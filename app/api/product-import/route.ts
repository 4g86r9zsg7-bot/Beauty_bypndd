

import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export const runtime = 'nodejs';

const MAX_HTML = 2 * 1024 * 1024;
const MAX_IMAGES = 30;
const MAX_VARIANTS = 50;

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
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16))
    )
    .trim();
}

function clean(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';

  return decodeHtml(String(value))
    .replace(/<[^>]*>/g, '')
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

function getTypes(data: any): string[] {
  const types = Array.isArray(data?.['@type'])
    ? data['@type']
    : [data?.['@type']];

  return types.map((type: any) => String(type).toLowerCase());
}

function findProducts(data: any, found: any[] = []): any[] {
  if (!data || typeof data !== 'object') return found;

  if (Array.isArray(data)) {
    for (const item of data) {
      findProducts(item, found);
    }
    return found;
  }

  const types = getTypes(data);

  if (
    types.includes('product') ||
    types.includes('productgroup')
  ) {
    found.push(data);
  }

  if (data['@graph']) {
    findProducts(data['@graph'], found);
  }

  return found;
}

function getStructuredProduct(html: string): any {
  const scripts = html.match(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi
  ) || [];

  const products: any[] = [];

  for (const script of scripts) {
    const content = script
      .replace(/^<script\b[^>]*>/i, '')
      .replace(/<\/script>$/i, '')
      .trim();

    try {
      findProducts(JSON.parse(content), products);
    } catch {
      // Ignore les données structurées incorrectes.
    }
  }

  return (
    products.find(item => getTypes(item).includes('productgroup')) ||
    products.find(item => getTypes(item).includes('product')) ||
    null
  );
}

function getImageUrl(item: any, baseUrl: string): string {
  const value = typeof item === 'object' && item !== null
    ? item.url || item.contentUrl || item['@id'] || ''
    : item;

  if (typeof value !== 'string' || !value.trim()) return '';

  try {
    const url = new URL(value, baseUrl);

    if (!['http:', 'https:'].includes(url.protocol)) return '';

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
  const raw = [
    ...(Array.isArray(product?.image)
      ? product.image
      : product?.image
        ? [product.image]
        : []),
    getMeta(html, 'og:image'),
    getMeta(html, 'twitter:image')
  ];

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
} {
  const attributes: string[] = [];

  const fields = [
    ['color', 'Couleur'],
    ['size', 'Taille'],
    ['pattern', 'Motif'],
    ['material', 'Matière'],
    ['model', 'Modèle']
  ];

  for (const [field, label] of fields) {
    const value = clean(variant?.[field]);

    if (value) {
      attributes.push(`${label}: ${value}`);
    }
  }

  if (Array.isArray(variant?.additionalProperty)) {
    for (const property of variant.additionalProperty) {
      const name = clean(property?.name);
      const value = clean(property?.value);

      if (name && value) {
        attributes.push(`${name}: ${value}`);
      }
    }
  }

  if (attributes.length > 0) {
    const labels = fields
      .filter(([field]) => clean(variant?.[field]))
      .map(([, label]) => label);

    return {
      name: labels.join(' / ') || 'Option',
      value: attributes.join(' · ')
    };
  }

  return {
    name: 'Variante',
    value: clean(variant?.name) || clean(variant?.sku) || 'Option'
  };
}

function getVariants(product: any, baseUrl: string): any[] {
  const rawVariants = [
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

  const result: any[] = [];
  const seen = new Set<string>();

  for (const variant of rawVariants) {
    if (!variant || typeof variant !== 'object') continue;

    const attributes = getVariantAttributes(variant);

    const sku = clean(variant.sku);
    const mpn = clean(variant.mpn);
    const key = `${sku}|${attributes.value}`;

    if (seen.has(key)) continue;
    seen.add(key);

    const offer = Array.isArray(variant.offers)
      ? variant.offers[0]
      : variant.offers;

    const images = [
      ...(Array.isArray(variant.image)
        ? variant.image
        : variant.image
          ? [variant.image]
          : [])
    ]
      .map(image => getImageUrl(image, baseUrl))
      .filter(Boolean)
      .slice(0, 12);

    const price = offer?.price ?? offer?.lowPrice ?? null;

    result.push({
      name: attributes.name,
      value: attributes.value,
      sku,
      mpn,
      price: price != null && !Number.isNaN(Number(price))
        ? Number(price)
        : null,
      currency: clean(offer?.priceCurrency),
      images
    });

    if (result.length >= MAX_VARIANTS) break;
  }

  return result;
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
          'User-Agent': 'Mozilla/5.0 (compatible; BeautyByPND/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
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

    const product = getStructuredProduct(html);

    const offer = Array.isArray(product?.offers)
      ? product.offers[0]
      : product?.offers;

    const brandValue = product?.brand;

    const brand = typeof brandValue === 'object'
      ? brandValue?.name
      : brandValue;

    const name =
      clean(product?.name) ||
      getMeta(html, 'og:title');

    const description =
      clean(product?.description) ||
      getMeta(html, 'og:description') ||
      getMeta(html, 'description');

    const price = clean(
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
