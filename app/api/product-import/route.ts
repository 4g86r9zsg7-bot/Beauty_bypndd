

import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import sharp from 'sharp';

export const runtime = 'nodejs';

const MAX_HTML = 2 * 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGES = 30;
const MAX_VARIANTS = 50;
const MAX_SCAN_DEPTH = 12;
const FETCH_TIMEOUT = 10000;
const SHADE_CONCURRENCY = 8;

function isPublicIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const p = ip.split('.').map(Number);
    const [a, b] = p;
    if (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51) ||
      (a === 203 && b === 0)
    ) return false;
    return true;
  }

  if (isIP(ip) === 6) {
    const value = ip.toLowerCase();
    if (
      value === '::1' || value === '::' ||
      value.startsWith('fc') || value.startsWith('fd') ||
      value.startsWith('fe80:') || value.startsWith('ff') ||
      value.startsWith('2001:db8:')
    ) return false;
    const first = parseInt(value.split(':')[0] || '0', 16);
    return first >= 0x2000 && first <= 0x3fff;
  }
  return false;
}

async function validateUrl(value: string): Promise<URL> {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Seuls les liens HTTP et HTTPS sont acceptés.');
  }
  if (url.username || url.password) throw new Error('Ce lien ne peut pas être utilisé.');
  if (url.port && !['80', '443'].includes(url.port)) throw new Error('Port non autorisé.');

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === 'localhost' || hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') || hostname.endsWith('.internal')
  ) throw new Error('Adresse non autorisée.');

  if (isIP(hostname)) {
    if (!isPublicIp(hostname)) throw new Error('Adresse IP non autorisée.');
  } else {
    const addresses = await lookup(hostname, { all: true });
    if (!addresses.length || addresses.some(a => !isPublicIp(a.address))) {
      throw new Error('Adresse du site non autorisée.');
    }
  }
  return url;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCodePoint(Number(n));
      } catch {
        return '';
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      try {
        return String.fromCodePoint(parseInt(n, 16));
      } catch {
        return '';
      }
    })
    .trim();
}

function clean(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return decodeHtml(String(value))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMeta(html: string, key: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs: Record<string, string> = {};
    tag.replace(
      /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
      (_, name, a, b, c) => {
        attrs[name.toLowerCase()] = a ?? b ?? c ?? '';
        return '';
      }
    );
    const property = (attrs.property || attrs.name || attrs.itemprop || '').toLowerCase();
    if (property === key.toLowerCase()) return clean(attrs.content);
  }
  return '';
}

function getAttribute(tag: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(
    new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  );
  return clean(match?.[1] ?? match?.[2] ?? match?.[3] ?? '');
}

function getTypes(data: any): string[] {
  const types = Array.isArray(data?.['@type']) ? data['@type'] : [data?.['@type']];
  return types.filter(Boolean).map((type: any) => String(type).toLowerCase());
}

function isProductObject(data: any): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const types = getTypes(data);
  return types.includes('product') || types.includes('productgroup');
}

function findProducts(data: any, found: any[] = [], depth = 0): any[] {
  if (!data || typeof data !== 'object' || depth > MAX_SCAN_DEPTH) return found;
  if (Array.isArray(data)) {
    for (const item of data) findProducts(item, found, depth + 1);
    return found;
  }
  if (isProductObject(data)) found.push(data);
  for (const [key, value] of Object.entries(data)) {
    if ([
      '@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement',
      'product', 'products', 'variants', 'hasVariant', 'offers', 'data'
    ].includes(key)) findProducts(value, found, depth + 1);
  }
  return found;
}

function parseJsonScripts(html: string): any[] {
  const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || [];
  const results: any[] = [];
  for (const script of scripts) {
    const opening = script.match(/^<script\b[^>]*>/i)?.[0] || '';
    const type = getAttribute(opening, 'type').toLowerCase();
    const id = getAttribute(opening, 'id').toLowerCase();
    if (
      !type.includes('json') && id !== '__next_data__' &&
      !id.includes('product') && !id.includes('state')
    ) continue;
    const content = script.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '').trim();
    if (!content || content.length > MAX_HTML) continue;
    try {
      results.push(JSON.parse(content));
    } catch {
      // JSON non standard.
    }
  }
  return results;
}

function getStructuredProduct(html: string): { product: any; documents: any[] } {
  const documents = parseJsonScripts(html);
  const products: any[] = [];
  for (const document of documents) findProducts(document, products);
  const product =
    products.find(item => getTypes(item).includes('productgroup')) ||
    products.find(item => getTypes(item).includes('product')) ||
    null;
  return { product, documents };
}

function getImageUrl(item: any, baseUrl: string): string {
  const value = typeof item === 'object' && item !== null
    ? item.url || item.contentUrl || item['@id'] || item.src || ''
    : item;
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    if (
      /\.(svg)(?:[?#]|$)/i.test(url.href) ||
      /(?:logo|icon|favicon|sprite|placeholder)/i.test(url.href)
    ) return '';
    return url.href;
  } catch {
    return '';
  }
}

function getImages(product: any, html: string, baseUrl: string): string[] {
  const raw: any[] = [
    ...(Array.isArray(product?.image) ? product.image : product?.image ? [product.image] : []),
    getMeta(html, 'og:image'),
    getMeta(html, 'twitter:image'),
    getMeta(html, 'twitter:image:src')
  ];
  const imageTags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of imageTags) {
    const image =
      getAttribute(tag, 'data-zoom-image') ||
      getAttribute(tag, 'data-large-image') ||
      getAttribute(tag, 'data-src') ||
      getAttribute(tag, 'data-original') ||
      getAttribute(tag, 'src');
    if (image) raw.push(image);
    const srcset = getAttribute(tag, 'data-srcset') || getAttribute(tag, 'srcset');
    if (srcset) {
      const largest = srcset.split(',').map(item => item.trim().split(/\s+/)[0]).filter(Boolean).pop();
      if (largest) raw.push(largest);
    }
  }
  const result: string[] = [];
  for (const item of raw) {
    const image = getImageUrl(item, baseUrl);
    if (image && !result.includes(image)) result.push(image);
    if (result.length >= MAX_IMAGES) break;
  }
  return result;
}

/* COULEURS DES VARIANTES */

function normalizeSwatch(value: unknown): string {
  if (typeof value !== 'string') return '';
  const color = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
  if (/^rgba?\(\s*[\d.%\s,]+\)$/i.test(color)) return color;
  if (/^hsla?\(\s*[\d.%\s,deg]+\)$/i.test(color)) return color;
  return '';
}

function getSwatch(variant: any): string {
  if (!variant || typeof variant !== 'object') return '';
  const colorObject = typeof variant.color === 'object' && variant.color !== null ? variant.color : {};
  const colourObject = typeof variant.colour === 'object' && variant.colour !== null ? variant.colour : {};
  const shadeObject = typeof variant.shade === 'object' && variant.shade !== null ? variant.shade : {};
  const candidates = [
    variant.swatch, variant.swatchColor, variant.swatch_color,
    variant.colorHex, variant.colorCode, variant.color_code,
    variant.hex, variant.hexColor, variant.colourHex,
    variant.backgroundColor, variant.background_color,
    colorObject.hex, colorObject.value, colorObject.code, colorObject.color,
    colourObject.hex, colourObject.value, colourObject.code,
    shadeObject.hex, shadeObject.color, shadeObject.value
  ];
  for (const candidate of candidates) {
    const color = normalizeSwatch(candidate);
    if (color) return color;
  }
  for (const style of [variant.style, variant.css, variant.swatchStyle, variant.swatch_style]) {
    if (typeof style !== 'string') continue;
    const match = style.match(
      /(?:background-color|background)\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/i
    );
    if (match) {
      const color = normalizeSwatch(match[1]);
      if (color) return color;
    }
  }
  return '';
}

function getVariantAttributes(variant: any): {
  name: string; value: string; options: Record<string, string>;
} {
  const options: Record<string, string> = {};
  const fields: [string, string][] = [
    ['color', 'Couleur'], ['colour', 'Couleur'], ['size', 'Taille'],
    ['pattern', 'Motif'], ['material', 'Matière'], ['model', 'Modèle']
  ];
  for (const [field, label] of fields) {
    const value = clean(variant?.[field]);
    if (value) options[label] = value;
  }
  const properties = [
    ...(Array.isArray(variant?.additionalProperty) ? variant.additionalProperty : []),
    ...(Array.isArray(variant?.properties) ? variant.properties : []),
    ...(Array.isArray(variant?.attributes) ? variant.attributes : [])
  ];
  for (const property of properties) {
    const name = clean(property?.name || property?.key || property?.label);
    const value = clean(property?.value || property?.valueName || property?.valueLabel);
    if (name && value) options[name] = value;
  }
  const name = clean(variant?.name || variant?.title || variant?.optionName || variant?.attributeName);
  const value = clean(variant?.value || variant?.valueName || variant?.optionValue || variant?.attributeValue);
  if (name && value && name !== value && !options[name]) options[name] = value;
  if (Object.keys(options).length) {
    return {
      name: Object.keys(options).join(' / '),
      value: Object.entries(options).map(([key, val]) => `${key}: ${val}`).join(' · '),
      options
    };
  }
  return {
    name: name || 'Variante',
    value: value || name || clean(variant?.sku) || 'Option',
    options: {}
  };
}

function collectVariantCandidates(data: any, found: any[] = [], depth = 0): any[] {
  if (!data || typeof data !== 'object' || depth > MAX_SCAN_DEPTH) return found;
  if (Array.isArray(data)) {
    for (const item of data) collectVariantCandidates(item, found, depth + 1);
    return found;
  }
  const types = getTypes(data);
  const hasAttributes = [
    'color', 'colour', 'size', 'pattern', 'material',
    'additionalProperty', 'attributes', 'optionValue', 'valueName'
  ].some(key => {
    const value = data[key];
    return (typeof value === 'string' && value.trim()) || (Array.isArray(value) && value.length > 0);
  });
  const hasIdentity = Boolean(data.sku || data.mpn || data.productID || data.variantId || data.id);
  const hasOffer = Boolean(data.offers || data.price || data.priceAmount || data.salePrice);
  const isTypedVariant = types.includes('product') || types.includes('productmodel');
  if (
    (isTypedVariant && (hasAttributes || hasIdentity || hasOffer)) ||
    (hasAttributes && (hasIdentity || hasOffer))
  ) found.push(data);

  for (const key of [
    'hasVariant', 'variants', 'variant', 'options', 'children',
    'products', 'productVariants', 'variantList', 'skus',
    'data', 'attributes', 'values', 'items', 'results'
  ]) {
    if (data[key] && typeof data[key] === 'object') {
      collectVariantCandidates(data[key], found, depth + 1);
    }
  }
  return found;
}

function getVariants(product: any, documents: any[], baseUrl: string): any[] {
  const candidates: any[] = [];
  if (product) {
    candidates.push(
      ...(Array.isArray(product?.hasVariant) ? product.hasVariant : product?.hasVariant ? [product.hasVariant] : []),
      ...(Array.isArray(product?.variants) ? product.variants : product?.variants ? [product.variants] : [])
    );
  }
  for (const document of documents) collectVariantCandidates(document, candidates);

  const result: any[] = [];
  const seen = new Set<string>();
  for (const variant of candidates) {
    if (!variant || typeof variant !== 'object') continue;
    const attributes = getVariantAttributes(variant);
    const sku = clean(variant.sku || variant.SKU);
    const mpn = clean(variant.mpn || variant.MPN);
    const offer = Array.isArray(variant.offers) ? variant.offers[0] : variant.offers;
    const priceValue = offer?.price ?? offer?.lowPrice ?? variant.price ??
      variant.priceAmount ?? variant.salePrice ?? null;
    const currency = clean(offer?.priceCurrency || variant.priceCurrency || variant.currency);
    const images = [
      ...(Array.isArray(variant.image) ? variant.image : variant.image ? [variant.image] : []),
      ...(Array.isArray(variant.images) ? variant.images : [])
    ].map(image => getImageUrl(image, baseUrl)).filter(Boolean).slice(0, 12);
    const variantName = clean(variant.name || variant.title || variant.value ||
      variant.optionValue || attributes.value);
    if (!variantName && !sku && !mpn && !Object.keys(attributes.options).length) continue;
    const key = [sku, mpn, attributes.value, variantName].join('|').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      name: attributes.name,
      value: variantName || attributes.value,
      options: attributes.options,
      swatch: getSwatch(variant),
      sku,
      mpn,
      price: priceValue != null && !Number.isNaN(Number(priceValue)) ? Number(priceValue) : null,
      currency,
      images
    });
    if (result.length >= MAX_VARIANTS) break;
  }
  return result;
}

/* DÉTECTION DES TEINTES KIKO */

function getKikoShadeLinks(html: string, baseUrl: string): Array<{ label: string; url: string }> {
  const base = new URL(baseUrl);
  if (!/(^|\.)kikocosmetics\.com$/i.test(base.hostname)) return [];

  const result: Array<{ label: string; url: string }> = [];
  const seen = new Set<string>();

  function addShade(href: string, possibleLabels: string[]) {
    let target: URL;
    try {
      target = new URL(href, baseUrl);
    } catch {
      return;
    }
    if (
      target.hostname.toLowerCase() !== base.hostname.toLowerCase() ||
      !target.pathname.includes('/p/') || target.pathname === base.pathname
    ) return;

    let label = '';
    for (const possibleLabel of possibleLabels) {
      const candidate = clean(possibleLabel)
        .replace(/\b\d+[,.]\d{2}\s*€?/gi, '')
        .replace(/\b\d+[,.]\d{2}\s*(?:EUR|MAD|DH|DHS)\b/gi, '')
        .replace(/\s+/g, ' ').trim();
      const match = candidate.match(/^(\d{1,3})\s+(.+)$/);
      if (match && match[2].trim().length <= 70) {
        label = `${match[1]} ${match[2].trim()}`;
        break;
      }
    }
    if (!label) {
      let slug = '';
      try {
        slug = decodeURIComponent(target.pathname.split('/').filter(Boolean).pop() || '');
      } catch {
        slug = target.pathname.split('/').filter(Boolean).pop() || '';
      }
      const numberMatch = slug.match(/(?:^|-)(\d{2,3})-\d+$/);
      if (numberMatch) {
        const number = numberMatch[1];
        const nameFromSlug = slug.replace(/-\d+$/, '').replace(/-\d{2,3}$/, '')
          .split('-').filter(Boolean).slice(-5).join(' ')
          .replace(/\b\w/g, letter => letter.toUpperCase());
        label = nameFromSlug ? `${number} ${nameFromSlug}` : `${number} Teinte`;
      }
    }
    if (!label || seen.has(target.href.toLowerCase())) return;
    seen.add(target.href.toLowerCase());
    result.push({ label, url: target.href });
  }

  const anchors = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
  for (const anchor of anchors) {
    const opening = anchor.match(/^<a\b[^>]*>/i)?.[0] || '';
    const href = getAttribute(opening, 'href');
    if (!href) continue;
    const textContent = clean(anchor.replace(/^<a\b[^>]*>/i, '').replace(/<\/a>$/i, ''));
    const labels = [textContent, getAttribute(opening, 'aria-label'), getAttribute(opening, 'title')];
    const imageTags = anchor.match(/<img\b[^>]*>/gi) || [];
    for (const imageTag of imageTags) {
      labels.push(getAttribute(imageTag, 'alt'), getAttribute(imageTag, 'title'));
    }
    addShade(href, labels);
  }

  const hrefMatches = html.match(
    /(?:href|data-href|data-url)\s*=\s*(?:"[^"]*\/p\/[^"]*"|'[^']*\/p\/[^']*'|[^\s>]*\/p\/[^\s>]*)/gi
  ) || [];
  for (const item of hrefMatches) {
    const match = item.match(/(?:href|data-href|data-url)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
    const href = match?.[1] || match?.[2] || match?.[3];
    if (href) addShade(href, []);
  }
  return result.slice(0, MAX_VARIANTS);
}

/* RÉCUPÉRATION HTML SÉCURISÉE */

async function fetchHtmlPage(
  inputUrl: string,
  requiredHost?: string
): Promise<{ html: string; url: URL }> {
  let currentUrl = await validateUrl(inputUrl);
  if (requiredHost && currentUrl.hostname.toLowerCase() !== requiredHost.toLowerCase()) {
    throw new Error('Le lien de variante pointe vers un autre site.');
  }

  let response: Response | null = null;
  for (let i = 0; i < 4; i++) {
    response = await fetch(currentUrl.href, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
      }
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirection du site impossible à suivre.');
      currentUrl = await validateUrl(new URL(location, currentUrl).href);
      if (requiredHost && currentUrl.hostname.toLowerCase() !== requiredHost.toLowerCase()) {
        throw new Error('Redirection vers un autre site refusée.');
      }
      continue;
    }
    break;
  }

  if (!response || response.status >= 300) {
    throw new Error('Le site n’a pas autorisé la lecture de cette page.');
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    throw new Error('Ce lien ne correspond pas à une page produit lisible.');
  }
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_HTML) throw new Error('La page est trop volumineuse.');
  const html = await response.text();
  if (html.length > MAX_HTML) throw new Error('La page est trop volumineuse.');
  return { html, url: currentUrl };
}

/* EXTRACTION DES IMAGES DE PASTILLES KIKO */

function normalizeShadeLabel(value: string): string {
  return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function extractExplicitColor(source: string): string {
  if (!source) return '';
  const patterns = [
    /(?:data-swatch-color|data-color|data-colour|data-hex|data-color-hex|data-swatch)\s*=\s*["']([^"']+)["']/i,
    /(?:background-color|background)\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/i,
    /["'](?:swatchColor|swatch_color|colorHex|colorCode|hexColor|backgroundColor|hex)["']\s*:\s*["']([^"']+)["']/i
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) {
      const color = normalizeSwatch(match[1]);
      if (color) return color;
    }
  }
  return '';
}

function getShadeObjectSwatch(data: any, shadeLabel: string, depth = 0): string {
  if (!data || typeof data !== 'object' || depth > MAX_SCAN_DEPTH) return '';
  if (Array.isArray(data)) {
    for (const item of data) {
      const color = getShadeObjectSwatch(item, shadeLabel, depth + 1);
      if (color) return color;
    }
    return '';
  }
  const target = normalizeShadeLabel(shadeLabel);
  const identityFields = [
    data.name, data.label, data.title, data.value, data.valueName,
    data.valueLabel, data.shade, data.shadeName, data.colorName,
    data.colourName, data.displayName
  ].filter(value => typeof value === 'string')
    .map((value: string) => normalizeShadeLabel(value));
  const matchesShade = identityFields.some(value =>
    value === target || (value.length > 0 && target.includes(value)) ||
    (target.length > 0 && value.includes(target))
  );
  if (matchesShade) {
    const color = getSwatch(data);
    if (color) return color;
  }
  for (const value of Object.values(data)) {
    if (value && typeof value === 'object') {
      const color = getShadeObjectSwatch(value, shadeLabel, depth + 1);
      if (color) return color;
    }
  }
  return '';
}

function getHtmlSwatch(html: string, shadeLabel: string): string {
  const target = normalizeShadeLabel(shadeLabel);
  if (!target) return '';
  for (const document of parseJsonScripts(html)) {
    const color = getShadeObjectSwatch(document, shadeLabel);
    if (color) return color;
  }

  const tags = html.match(/<[^>]+>/g) || [];
  const labelAttributes = [
    'aria-label', 'title', 'data-value', 'data-name', 'data-shade',
    'data-color-name', 'data-variant-name', 'alt'
  ];
  for (let i = 0; i < tags.length; i++) {
    const values = labelAttributes.map(attribute => getAttribute(tags[i], attribute))
      .filter(Boolean).map(normalizeShadeLabel);
    const matches = values.some(value =>
      value === target || (value.length > 0 && target.includes(value)) ||
      (target.length > 0 && value.includes(target))
    );
    if (!matches) continue;
    const colorInTag = extractExplicitColor(tags[i]);
    if (colorInTag) return colorInTag;
    const nearby = tags.slice(i, Math.min(i + 8, tags.length)).join(' ');
    const nearbyColor = extractExplicitColor(nearby);
    if (nearbyColor) return nearbyColor;
  }

  const selectedPatterns = [
    /<[^>]*(?:aria-selected|aria-checked|aria-pressed)\s*=\s*["']true["'][^>]*>/gi,
    /<[^>]*class\s*=\s*["'][^"']*(?:selected|active|current|checked|is-active)[^"']*["'][^>]*>/gi
  ];
  for (const pattern of selectedPatterns) {
    for (const tag of html.match(pattern) || []) {
      const color = extractExplicitColor(tag);
      if (color) return color;
    }
  }
  const swatchTags = html.match(
    /<[^>]*(?:data-swatch-color|data-color|data-colour|data-hex|data-color-hex|data-swatch)\s*=\s*["'][^"']+["'][^>]*>/gi
  ) || [];
  for (const tag of swatchTags) {
    const color = extractExplicitColor(tag);
    if (color) return color;
  }
  return '';
}

/**
 * Recherche une image de pastille liée à la teinte.
 * On privilégie les attributs et classes swatch/color/shade.
 * Les images générales du produit ne sont jamais utilisées comme pastilles.
 */
function getShadeSwatchImageUrl(html: string, shadeLabel: string, baseUrl: string): string {
  const target = normalizeShadeLabel(shadeLabel);
  const candidates: string[] = [];
  const tags = html.match(/<[^>]+>/g) || [];

  const imageAttributes = [
    'data-swatch-image', 'data-swatch-src', 'data-color-image',
    'data-shade-image', 'data-image', 'data-src', 'src',
    'data-background-image', 'data-bg'
  ];

  function add(value: string) {
    if (!value || value.startsWith('data:')) return;
    const url = getImageUrl(value, baseUrl);
    if (!url) return;
    if (!/(swatch|shade|color|colour|variant|chip|on-eva)/i.test(url)) return;
    if (/(product|main|hero|zoom|large|gallery)/i.test(url)) return;
    if (!candidates.includes(url)) candidates.push(url);
  }

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    const attrs = [
      'aria-label', 'title', 'data-value', 'data-name',
      'data-shade', 'data-color-name', 'alt'
    ];
    const labels = attrs.map(name => normalizeShadeLabel(getAttribute(tag, name))).filter(Boolean);
    const className = getAttribute(tag, 'class').toLowerCase();
    const hasShadeLabel = labels.some(value =>
      value === target || (value.length > 0 && target.includes(value)) ||
      (target.length > 0 && value.includes(target))
    );
    const isSwatchElement = /(swatch|shade|color|colour|variant|chip)/i.test(className + ' ' + tag);

    if (!hasShadeLabel && !isSwatchElement) continue;

    const block = tags.slice(Math.max(0, i - 2), Math.min(tags.length, i + 7)).join(' ');
    if (hasShadeLabel || isSwatchElement) {
      for (const attribute of imageAttributes) {
        const value = getAttribute(tag, attribute);
        if (value) add(value);
      }
      const backgroundMatches = block.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi) || [];
      for (const match of backgroundMatches) {
        const value = match.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i)?.[1];
        if (value) add(value);
      }
      const nestedImages = block.match(/<img\b[^>]*>/gi) || [];
      for (const imageTag of nestedImages) {
        for (const attribute of imageAttributes) {
          const value = getAttribute(imageTag, attribute);
          if (value) add(value);
        }
      }
    }
    if (candidates.length >= 8) break;
  }

  // Les URL de swatches peuvent être dans le JSON de la page.
  const jsonText = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of jsonText) {
    if (!/(swatch|shade|color|colour)/i.test(script)) continue;
    const targetIndex = normalizeShadeLabel(script).indexOf(target);
    if (targetIndex < 0) continue;
    const fragment = script.slice(Math.max(0, targetIndex - 1500), targetIndex + 2500);
    const urls = fragment.match(/(?:https?:)?\/\/[^"'\\\s<>]+|(?:\/[^"'\\\s<>]+\.(?:png|jpe?g|webp)(?:\?[^"'\\\s<>]*)?)/gi) || [];
    for (const value of urls) add(value);
  }

  return candidates[0] || '';
}

/* TÉLÉCHARGEMENT SÉCURISÉ D'UNE IMAGE DE SWATCH */

async function fetchImageBuffer(inputUrl: string, requiredHost?: string): Promise<Buffer | null> {
  try {
    let currentUrl = await validateUrl(inputUrl);
    if (requiredHost && currentUrl.hostname.toLowerCase() !== requiredHost.toLowerCase()) {
      return null;
    }

    let response: Response | null = null;
    for (let i = 0; i < 4; i++) {
      response = await fetch(currentUrl.href, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8',
          'Referer': 'https://www.kikocosmetics.com/'
        }
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) return null;
        currentUrl = await validateUrl(new URL(location, currentUrl).href);
        if (requiredHost && currentUrl.hostname.toLowerCase() !== requiredHost.toLowerCase()) {
          return null;
        }
        continue;
      }
      break;
    }

    if (!response || !response.ok) return null;
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/')) return null;
    if (contentType.includes('svg')) return null;

    const length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_IMAGE_BYTES) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength || arrayBuffer.byteLength > MAX_IMAGE_BYTES) return null;
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/**
 * Calcule une couleur représentative à partir de l'image du swatch.
 * Les pixels transparents et les pixels presque blancs/noirs isolés
 * sont écartés pour limiter l'influence du fond.
 */
async function getHexFromSwatchImage(buffer: Buffer): Promise<string> {
  try {
    const { data, info } = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize(32, 32, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels: number[][] = [];
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 100) continue;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      // Évite de retenir un fond blanc ou noir uniforme.
      if (max > 247 && min > 238) continue;
      if (max < 8) continue;

      pixels.push([r, g, b]);
    }

    if (!pixels.length) return '';

    // Médiane par canal : moins sensible aux bordures et aux reflets.
    const median = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };

    const r = median(pixels.map(pixel => pixel[0]));
    const g = median(pixels.map(pixel => pixel[1]));
    const b = median(pixels.map(pixel => pixel[2]));

    return '#' + [r, g, b].map(value => Math.round(value).toString(16).padStart(2, '0')).join('').toUpperCase();
  } catch {
    return '';
  }
}

async function getKikoShadeVariants(
  links: Array<{ label: string; url: string }>,
  baseUrl: string
): Promise<any[]> {
  const host = new URL(baseUrl).hostname;
  const results: any[] = new Array(links.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= links.length) return;
      const shade = links[index];

      try {
        const page = await fetchHtmlPage(shade.url, host);
        const { product } = getStructuredProduct(page.html);
        const images = getImages(product, page.html, page.url.href).slice(0, 5);
        const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
        const priceValue = offer?.price ?? offer?.lowPrice ?? null;

        // 1. Couleur HEX explicitement associée à cette teinte.
        let shadeSwatch = getHtmlSwatch(page.html, shade.label);

        // 2. Si le site ne fournit pas le HEX, analyser l'image de pastille
        // associée à cette teinte. Ne jamais prendre l'image produit principale.
        if (!shadeSwatch) {
          const swatchImageUrl = getShadeSwatchImageUrl(
            page.html,
            shade.label,
            page.url.href
          );

          if (swatchImageUrl) {
            const imageBuffer = await fetchImageBuffer(swatchImageUrl);
            if (imageBuffer) {
              shadeSwatch = await getHexFromSwatchImage(imageBuffer);
            }
          }
        }

        results[index] = {
          name: 'Teinte',
          value: shade.label,
          options: { Teinte: shade.label },
          // Si l'extraction échoue, la pastille reste vide.
          swatch: normalizeSwatch(shadeSwatch),
          sku: clean(product?.sku),
          mpn: clean(product?.mpn),
          price: priceValue != null && !Number.isNaN(Number(priceValue)) ? Number(priceValue) : null,
          currency: clean(offer?.priceCurrency),
          images
        };
      } catch {
        results[index] = {
          name: 'Teinte',
          value: shade.label,
          options: { Teinte: shade.label },
          swatch: '',
          sku: '',
          mpn: '',
          price: null,
          currency: '',
          images: []
        };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(SHADE_CONCURRENCY, links.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results.filter(Boolean).slice(0, MAX_VARIANTS);
}

/* DESCRIPTION */

function getDescription(product: any, html: string): string {
  const direct = clean(product?.description);
  if (direct.length > 20) return direct;

  const metaDescription =
    getMeta(html, 'og:description') ||
    getMeta(html, 'description') ||
    getMeta(html, 'twitter:description');

  if (metaDescription.length > direct.length) return metaDescription;

  const patterns = [
    /<[^>]*itemprop=["']description["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
    /<(?:div|section|article)[^>]*(?:id|class)=["'][^"']*(?:product-description|product__description|productDescription|description-content|product-detail-description|product__details)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|article)>/i,
    /<(?:div|section)[^>]*data-testid=["'][^"']*(?:description|product-detail)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/i
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const description = clean(match?.[1] || '');
    if (description.length > 20) return description;
  }
  return direct || metaDescription;
}

function getCurrencyPrice(value: any): string {
  if (value == null || value === '') return '';
  return clean(value);
}

/* ROUTE API */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = String(body?.url || '').trim();

    if (!input) {
      return NextResponse.json(
        { error: 'Colle d’abord le lien du produit.' },
        { status: 400 }
      );
    }

    const page = await fetchHtmlPage(input);
    const html = page.html;
    const currentUrl = page.url;
    const { product, documents } = getStructuredProduct(html);

    const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
    const brandValue = product?.brand;
    const brand = typeof brandValue === 'object' ? brandValue?.name : brandValue;

    const name = clean(product?.name) || getMeta(html, 'og:title') || getMeta(html, 'twitter:title');
    const description = getDescription(product, html);
    const price = getCurrencyPrice(
      offer?.price ?? offer?.lowPrice ?? getMeta(html, 'product:price:amount')
    );
    const currency = clean(
      offer?.priceCurrency || getMeta(html, 'product:price:currency')
    );
    const images = getImages(product, html, currentUrl.href);

    let variants = getVariants(product, documents, currentUrl.href);
    const kikoShadeLinks = getKikoShadeLinks(html, currentUrl.href);

    if (kikoShadeLinks.length > 0) {
      const kikoVariants = await getKikoShadeVariants(kikoShadeLinks, currentUrl.href);
      if (kikoVariants.length > 0) variants = kikoVariants;
    }

    const result = {
      name,
      description,
      brand: clean(brand) || getMeta(html, 'product:brand'),
      sku: clean(product?.sku),
      mpn: clean(product?.mpn),
      price,
      currency,
      images,
      variants,
      url: currentUrl.href
    };

    const missing = Object.entries(result)
      .filter(([key, value]) =>
        key !== 'url' &&
        (Array.isArray(value) ? value.length === 0 : !value)
      )
      .map(([key]) => key);

    if (!name && !description && !images.length) {
      throw new Error('Aucune information produit exploitable trouvée sur cette page.');
    }

    return NextResponse.json({
      success: true,
      product: result,
      missing
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.name === 'TimeoutError'
          ? 'Le site met trop de temps à répondre. Réessaie.'
          : error?.message || 'Impossible d’analyser ce lien.'
      },
      { status: 400 }
    );
  }
}
