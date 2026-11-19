


import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export const runtime = 'nodejs';

const MAX_HTML = 2 * 1024 * 1024;
const MAX_IMAGES = 30;
const MAX_VARIANTS = 50;
const MAX_SCAN_DEPTH = 12;

function isPublicIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const p = ip.split('.').map(Number);
    const [a, b] = p;

    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
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
      value === '::1' ||
      value === '::' ||
      value.startsWith('fc') ||
      value.startsWith('fd') ||
      value.startsWith('fe80:') ||
      value.startsWith('ff') ||
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

  if (url.username || url.password) {
    throw new Error('Ce lien ne peut pas être utilisé.');
  }

  if (url.port && !['80', '443'].includes(url.port)) {
    throw new Error('Port non autorisé.');
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Adresse non autorisée.');
  }

  const ipType = isIP(hostname);

  if (ipType) {
    if (!isPublicIp(hostname)) {
      throw new Error('Adresse IP non autorisée.');
    }
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
      const code = Number(n);
      try {
        return Number.isFinite(code) ? String.fromCodePoint(code) : '';
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

    const property = (
      attrs.property ||
      attrs.name ||
      attrs.itemprop ||
      ''
    ).toLowerCase();

    if (property === key.toLowerCase()) {
      return clean(attrs.content);
    }
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
  const types = Array.isArray(data?.['@type'])
    ? data['@type']
    : [data?.['@type']];

  return types
    .filter(Boolean)
    .map((type: any) => String(type).toLowerCase());
}

function isProductObject(data: any): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;

  const types = getTypes(data);

  return (
    types.includes('product') ||
    types.includes('productgroup')
  );
}

function findProducts(data: any, found: any[] = [], depth = 0): any[] {
  if (!data || typeof data !== 'object' || depth > MAX_SCAN_DEPTH) {
    return found;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      findProducts(item, found, depth + 1);
    }
    return found;
  }

  if (isProductObject(data)) {
    found.push(data);
  }

  for (const [key, value] of Object.entries(data)) {
    if (
      key === '@graph' ||
      key === 'mainEntity' ||
      key === 'mainEntityOfPage' ||
      key === 'itemListElement' ||
      key === 'product' ||
      key === 'products' ||
      key === 'variants' ||
      key === 'hasVariant' ||
      key === 'offers' ||
      key === 'data'
    ) {
      findProducts(value, found, depth + 1);
    }
  }

  return found;
}

function parseJsonScripts(html: string): any[] {
  const scripts = html.match(
    /<script\b[^>]*>[\s\S]*?<\/script>/gi
  ) || [];

  const results: any[] = [];

  for (const script of scripts) {
    const opening = script.match(/^<script\b[^>]*>/i)?.[0] || '';
    const type = getAttribute(opening, 'type').toLowerCase();
    const id = getAttribute(opening, 'id').toLowerCase();

    const isJson =
      type.includes('json') ||
      id === '__next_data__' ||
      id.includes('product') ||
      id.includes('state');

    if (!isJson) continue;

    const content = script
      .replace(/^<script\b[^>]*>/i, '')
      .replace(/<\/script>$/i, '')
      .trim();

    if (!content || content.length > MAX_HTML) continue;

    try {
      results.push(JSON.parse(content));
    } catch {
      // Certains sites utilisent des blocs JSON non standard.
    }
  }

  return results;
}

function getStructuredProduct(html: string): {
  product: any;
  documents: any[];
} {
  const documents = parseJsonScripts(html);
  const products: any[] = [];

  for (const document of documents) {
    findProducts(document, products);
  }

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

function getImages(
  product: any,
  html: string,
  baseUrl: string
): string[] {
  const raw: any[] = [
    ...(Array.isArray(product?.image)
      ? product.image
      : product?.image
        ? [product.image]
        : []),
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

    const srcset =
      getAttribute(tag, 'data-srcset') ||
      getAttribute(tag, 'srcset');

    if (srcset) {
      const largest = srcset
        .split(',')
        .map(item => item.trim().split(/\s+/)[0])
        .filter(Boolean)
        .pop();

      if (largest) raw.push(largest);
    }
  }

  const result: string[] = [];

  for (const item of raw) {
    const image = getImageUrl(item, baseUrl);

    if (image && !result.includes(image)) {
      result.push(image);
    }

    if (result.length >= MAX_IMAGES) break;
  }

  return result;
}

function getVariantAttributes(variant: any): {
  name: string;
  value: string;
  options: Record<string, string>;
} {
  const options: Record<string, string> = {};

  const fields: [string, string][] = [
    ['color', 'Couleur'],
    ['colour', 'Couleur'],
    ['size', 'Taille'],
    ['pattern', 'Motif'],
    ['material', 'Matière'],
    ['model', 'Modèle']
  ];

  for (const [field, label] of fields) {
    const value = clean(variant?.[field]);

    if (value) options[label] = value;
  }

  const properties = [
    ...(Array.isArray(variant?.additionalProperty)
      ? variant.additionalProperty
      : []),
    ...(Array.isArray(variant?.properties)
      ? variant.properties
      : []),
    ...(Array.isArray(variant?.attributes)
      ? variant.attributes
      : [])
  ];

  for (const property of properties) {
    const name = clean(
      property?.name ||
      property?.key ||
      property?.label
    );

    const value = clean(
      property?.value ||
      property?.valueName ||
      property?.valueLabel
    );

    if (name && value) options[name] = value;
  }

  const name = clean(
    variant?.name ||
    variant?.title ||
    variant?.optionName ||
    variant?.attributeName
  );

  const value = clean(
    variant?.value ||
    variant?.valueName ||
    variant?.optionValue ||
    variant?.attributeValue
  );

  if (name && value && name !== value && !options[name]) {
    options[name] = value;
  }

  if (Object.keys(options).length) {
    return {
      name: Object.keys(options).join(' / '),
      value: Object.entries(options)
        .map(([key, val]) => `${key}: ${val}`)
        .join(' · '),
      options
    };
  }

  return {
    name: name || 'Variante',
    value: value || name || clean(variant?.sku) || 'Option',
    options: {}
  };
}

function collectVariantCandidates(
  data: any,
  found: any[] = [],
  depth = 0
): any[] {
  if (!data || typeof data !== 'object' || depth > MAX_SCAN_DEPTH) {
    return found;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      collectVariantCandidates(item, found, depth + 1);
    }
    return found;
  }

  const types = getTypes(data);

  const hasAttributes = [
    'color',
    'colour',
    'size',
    'pattern',
    'material',
    'additionalProperty',
    'attributes',
    'optionValue',
    'valueName'
  ].some(key => {
    const value = data[key];
    return (
      (typeof value === 'string' && value.trim()) ||
      (Array.isArray(value) && value.length > 0)
    );
  });

  const hasIdentity = Boolean(
    data.sku ||
    data.mpn ||
    data.productID ||
    data.variantId ||
    data.id
  );

  const hasOffer = Boolean(
    data.offers ||
    data.price ||
    data.priceAmount ||
    data.salePrice
  );

  const isTypedVariant =
    types.includes('product') ||
    types.includes('productmodel');

  if (
    (isTypedVariant && (hasAttributes || hasIdentity || hasOffer)) ||
    (hasAttributes && (hasIdentity || hasOffer))
  ) {
    found.push(data);
  }

  const keys = [
    'hasVariant',
    'variants',
    'variant',
    'options',
    'children',
    'products',
    'productVariants',
    'variantList',
    'skus',
    'data',
    'attributes',
    'values',
    'items',
    'results'
  ];

  for (const key of keys) {
    if (data[key] && typeof data[key] === 'object') {
      collectVariantCandidates(data[key], found, depth + 1);
    }
  }

  return found;
}

function getVariants(
  product: any,
  documents: any[],
  baseUrl: string
): any[] {
  const candidates: any[] = [];

  if (product) {
    const raw = [
      ...(Array.isArray(product?.hasVariant)
        ? product.hasVariant
        : product?.hasVariant
          ? [product.hasVariant]
          : []),
      ...(Array.isArray(product?.variants)
        ? product.variants
        : product?.variants
          ? [product.variants]
          : [])
    ];

    candidates.push(...raw);
  }

  for (const document of documents) {
    collectVariantCandidates(document, candidates);
  }

  const result: any[] = [];
  const seen = new Set<string>();

  for (const variant of candidates) {
    if (!variant || typeof variant !== 'object') continue;

    const attributes = getVariantAttributes(variant);

    const sku = clean(variant.sku || variant.SKU);
    const mpn = clean(variant.mpn || variant.MPN);

    const offer = Array.isArray(variant.offers)
      ? variant.offers[0]
      : variant.offers;

    const priceValue =
      offer?.price ??
      offer?.lowPrice ??
      variant.price ??
      variant.priceAmount ??
      variant.salePrice ??
      null;

    const currency = clean(
      offer?.priceCurrency ||
      variant.priceCurrency ||
      variant.currency
    );

    const images = [
      ...(Array.isArray(variant.image)
        ? variant.image
        : variant.image
          ? [variant.image]
          : []),
      ...(Array.isArray(variant.images)
        ? variant.images
        : [])
    ]
      .map(image => getImageUrl(image, baseUrl))
      .filter(Boolean)
      .slice(0, 12);

    const variantName = clean(
      variant.name ||
      variant.title ||
      variant.value ||
      variant.optionValue ||
      attributes.value
    );

    if (
      !variantName &&
      !sku &&
      !mpn &&
      !Object.keys(attributes.options).length
    ) continue;

    const key = [
      sku,
      mpn,
      attributes.value,
      variantName
    ].join('|').toLowerCase();

    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      name: attributes.name,
      value: variantName || attributes.value,
      options: attributes.options,
      sku,
      mpn,
      price:
        priceValue != null &&
        !Number.isNaN(Number(priceValue))
          ? Number(priceValue)
          : null,
      currency,
      images
    });

    if (result.length >= MAX_VARIANTS) break;
  }

  return result;
}

function getDescription(
  product: any,
  html: string
): string {
  const direct = clean(product?.description);

  if (direct.length > 20) return direct;

  const metaDescription =
    getMeta(html, 'og:description') ||
    getMeta(html, 'description') ||
    getMeta(html, 'twitter:description');

  if (metaDescription.length > direct.length) {
    return metaDescription;
  }

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

    let currentUrl = await validateUrl(input);
    let response: Response | null = null;

    for (let i = 0; i < 4; i++) {
      response = await fetch(currentUrl.href, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(12000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
        }
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');

        if (!location) {
          throw new Error('Redirection du site impossible à suivre.');
        }

        currentUrl = await validateUrl(
          new URL(location, currentUrl).href
        );

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

    if (length > MAX_HTML) {
      throw new Error('La page est trop volumineuse.');
    }

    const html = await response.text();

    if (html.length > MAX_HTML) {
      throw new Error('La page est trop volumineuse.');
    }

    const { product, documents } = getStructuredProduct(html);

    const offer = Array.isArray(product?.offers)
      ? product.offers[0]
      : product?.offers;

    const brandValue = product?.brand;

    const brand = typeof brandValue === 'object'
      ? brandValue?.name
      : brandValue;

    const name =
      clean(product?.name) ||
      getMeta(html, 'og:title') ||
      getMeta(html, 'twitter:title');

    const description = getDescription(product, html);

    const price = getCurrencyPrice(
      offer?.price ??
      offer?.lowPrice ??
      getMeta(html, 'product:price:amount')
    );

    const currency = clean(
      offer?.priceCurrency ||
      getMeta(html, 'product:price:currency')
    );

    const images = getImages(
      product,
      html,
      currentUrl.href
    );

    const variants = getVariants(
      product,
      documents,
      currentUrl.href
    );

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
        (
          Array.isArray(value)
            ? value.length === 0
            : !value
        )
      )
      .map(([key]) => key);

    if (!name && !description && !images.length) {
      throw new Error(
        'Aucune information produit exploitable trouvée sur cette page.'
      );
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
