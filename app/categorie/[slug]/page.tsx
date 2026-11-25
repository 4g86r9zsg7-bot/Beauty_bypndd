
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import Suggestions from '@/components/Suggestions';

export const dynamic = 'force-dynamic';

type SP = {
  brand?: string;
  range?: string;
  sort?: string;
  stock?: string;
  availability?: string;
  q?: string;
  min?: string;
  max?: string;
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
};

const FIXED: Record<string, { title: string; desc: string; filter?: (q: any) => any }> = {
  'coups-de-coeur': {
    title: 'Coups de cœur',
    desc: 'Découvrez les coups de cœur Beauty_bypndd : une sélection de maquillage, soins, parfums et produits beauté appréciés par nos clientes au Maroc.',
    filter: (q) => q.eq('featured', true)
  },
  'meilleures-ventes': {
    title: 'Meilleures ventes',
    desc: 'Découvrez les meilleures ventes Beauty_bypndd : maquillage, parfums, soins et produits de beauté tendance au Maroc.',
    filter: (q) => q.eq('is_bestseller', true)
  },
  tous: {
    title: 'Tous les produits',
    desc: 'Explorez tous les produits Beauty_bypndd : maquillage, soins du visage, soins du corps, parfums, brumes parfumées et mode au Maroc.'
  },
  nouveautes: {
    title: 'Nouveautés',
    desc: 'Découvrez les nouveautés Beauty_bypndd : les derniers produits de maquillage, soins, parfums et beauté à découvrir au Maroc.',
    filter: (q) => q.eq('is_new', true)
  },
  promotions: {
    title: 'Promotions',
    desc: 'Profitez des promotions Beauty_bypndd sur une sélection de produits de beauté, maquillage, soins et parfums au Maroc.',
    filter: (q) => q.not('old_price', 'is', null)
  },
  arrivages: {
    title: 'Prochains arrivages',
    desc: 'Découvrez les prochains arrivages Beauty_bypndd et retrouvez bientôt vos produits de beauté préférés.',
    filter: (q) => q.eq('availability', 'arrival')
  },
  precommandes: {
    title: 'Précommandes',
    desc: 'Commandez vos produits en précommande chez Beauty_bypndd : maquillage, parfums, soins et nouveautés beauté.',
    filter: (q) => q.eq('availability', 'preorder')
  }
};

const SORTS: [string, string][] = [
  ['', 'Plus récents'],
  ['old', 'Les plus anciens'],
  ['pop', 'Plus vendus'],
  ['asc', 'Prix croissant'],
  ['desc', 'Prix décroissant']
];

const AVAILABILITY: [string, string][] = [
  ['', 'Toutes les disponibilités'],
  ['stock', 'En stock'],
  ['arrival', 'Arrivage'],
  ['preorder', 'Précommande'],
  ['soldout', 'Épuisé']
];

// ---------- Catégories ----------
const getCats = cache(async () => {
  const { data } = await supabase
    .from('categories')
    .select('id,slug,name,parent_id,image_url,position')
    .order('position', { ascending: true, nullsFirst: false })
    .order('name');

  return (data || []) as any[];
});

const kidsOf = (all: any[], id: any) =>
  all.filter((x) => x.parent_id === id && x.slug !== 'sacs-accessoires');

const subtree = (all: any[], id: any, depth = 0): any[] =>
  depth > 5
    ? [id]
    : [id, ...kidsOf(all, id).flatMap((k) => subtree(all, k.id, depth + 1))];

// ---------- Métadonnées SEO ----------
export async function generateMetadata({ params, searchParams }: PageProps) {
  const { slug: s } = await params;
  const sp = await searchParams;

  const all = await getCats();
  const f = FIXED[s];
  const c = all.find((x) => x.slug === s);

  if (!f && !c) {
    return {
      title: 'Boutique beauté | Beauty_bypndd',
      robots: {
        index: false,
        follow: true
      }
    };
  }

  const title = f ? f.title : c.name;

  const subs = c
    ? kidsOf(all, c.id).map((k) => k.name).slice(0, 6)
    : [];

  const description = f
    ? f.desc
    : subs.length
      ? `Découvrez notre sélection ${title.toLowerCase()} chez Beauty_bypndd : ${subs.join(', ')}. Produits de beauté et marques tendance à prix accessibles, livraison au Maroc et paiement à la livraison.`
      : `Découvrez ${title} chez Beauty_bypndd : une sélection de produits de beauté et de grandes marques à prix accessibles, avec livraison au Maroc et paiement à la livraison.`;

  let pq: any = supabase
    .from('products')
    .select('images')
    .eq('active', true);

  if (c) {
    pq = pq
      .in('category_id', subtree(all, c.id))
      .order('sold', { ascending: false });
  } else {
    pq = (f?.filter ? f.filter(pq) : pq)
      .order('created_at', { ascending: false });
  }

  const { data: pr } = await pq.limit(1);

  const img: string | undefined =
    c?.image_url || pr?.[0]?.images?.[0];

  const pageTitle = `${title} | Beauty_bypndd`;
  const hasFilters = Object.values(sp).some((value) => Boolean(value));

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: `/categorie/${s}`
    },
    robots: {
      index: !hasFilters,
      follow: true,
      googleBot: {
        index: !hasFilters,
        follow: true
      }
    },
    openGraph: {
      title: pageTitle,
      description,
      url: `/categorie/${s}`,
      siteName: 'Beauty_bypndd',
      locale: 'fr_FR',
      type: 'website',
      images: img
        ? [{ url: img, alt: `${title} - Beauty_bypndd` }]
        : undefined
    },
    twitter: {
      card: img ? 'summary_large_image' : 'summary',
      title: pageTitle,
      description,
      images: img ? [img] : undefined
    }
  };
}

export default async function Cat({ params, searchParams }: PageProps) {
  const { slug: s } = await params;
  const sp = await searchParams;

  if (s === 'sacs-accessoires') notFound();

  const all = await getCats();
  const fixed = FIXED[s];
  const cat = fixed ? null : all.find((x) => x.slug === s);

  if (!fixed && !cat) notFound();

  const parent = cat?.parent_id
    ? all.find((x) => x.id === cat.parent_id)
    : null;

  let title = fixed ? fixed.title : cat.name;

  if (s === 'tous' && sp.q) {
    title = `Recherche : ${sp.q}`;
  }

  // ---------- Produits ----------
  let q: any = supabase
    .from('products')
    .select('id,name,slug,price,old_price,images,variants,availability,stock,is_bestseller,is_new,source_name,commercial_range,sold,created_at,brands(name)')
    .eq('active', true);

  if (fixed?.filter) q = fixed.filter(q);

  if (cat) {
    q = q.in('category_id', subtree(all, cat.id));
  }

  const t = (sp.q || '').replace(/[%,()*]/g, ' ').trim();

  if (t) {
    const [bm, cm] = await Promise.all([
      supabase.from('brands').select('id').ilike('name', `%${t}%`),
      supabase.from('categories').select('id').ilike('name', `%${t}%`)
    ]);

    const bi = (bm.data || []).map((x: any) => x.id);
    const ci = (cm.data || []).map((x: any) => x.id);

    const parts = [
      `name.ilike.%${t}%`,
      `description.ilike.%${t}%`
    ];

    if (bi.length) parts.push(`brand_id.in.(${bi.join(',')})`);
    if (ci.length) parts.push(`category_id.in.(${ci.join(',')})`);

    q = q.or(parts.join(','));
  }

  if (sp.brand) {
    q = q.eq('brand_id', sp.brand);
  }

  // ---------- Disponibilité ----------
  if (sp.availability === 'stock') {
    q = q
      .or('availability.in.(available,last),and(availability.is.null,stock.gt.0)')
      .gt('stock', 0);
  } else if (sp.availability === 'arrival') {
    q = q.eq('availability', 'arrival');
  } else if (sp.availability === 'preorder') {
    q = q.eq('availability', 'preorder');
  } else if (sp.availability === 'soldout') {
    q = q.or('availability.eq.soldout,and(stock.lte.0,availability.is.null),and(stock.lte.0,availability.not.in.(arrival,preorder))');
  } else if (sp.stock) {
    q = q.neq('availability', 'soldout');
  }

  const o = sp.sort;
  const availableSorts = s === 'promotions'
    ? [...SORTS, ['promo', 'Meilleures réductions'] as [string, string]]
    : SORTS;

  q = o === 'asc'
    ? q.order('price')
    : o === 'desc'
      ? q.order('price', { ascending: false })
      : o === 'pop'
        ? q.order('sold', { ascending: false })
        : q.order('created_at', { ascending: o === 'old' });

  // Marques réellement présentes dans cette catégorie.
  let brandProductsQuery: any = supabase
    .from('products')
    .select('brand_id,price,old_price,variants,brands(id,name)')
    .eq('active', true);

  if (fixed?.filter) brandProductsQuery = fixed.filter(brandProductsQuery);
  if (cat) brandProductsQuery = brandProductsQuery.in('category_id', subtree(all, cat.id));

  const [{ data }, { data: brandProducts }] = await Promise.all([
    q,
    brandProductsQuery
  ]);

  const rank = (p: any) => {
    const pre = p.availability === 'preorder';
    const arr = p.availability === 'arrival';
    const sold = p.availability === 'soldout' || (!pre && !arr && p.stock <= 0);

    return sold ? 2 : pre || arr ? 1 : 0;
  };

  const allProducts = [...(data || [])];

  const productPrice = (p: any) => {
    const vars = Array.isArray(p.variants) ? p.variants : [];
    const reservable = p.availability === 'preorder' || p.availability === 'arrival';

    const prices = vars
      .filter((v: any) =>
        v &&
        typeof v === 'object' &&
        ['available', 'last', 'preorder', 'arrival'].includes(v.status || 'available') &&
        (v.stock == null || Number(v.stock) > 0 || reservable)
      )
      .map((v: any) => Number(v.price ?? p.price))
      .filter((n: number) => Number.isFinite(n) && n > 0);

    return prices.length ? Math.min(...prices) : Number(p.price) || 0;
  };

  const isRealPromotion = (p: any) =>
    Number(p.old_price) > 0 && Number(p.old_price) > productPrice(p);

  const discountRate = (p: any) =>
    isRealPromotion(p)
      ? (1 - productPrice(p) / Number(p.old_price)) * 100
      : 0;

  const list = allProducts
    .filter((p: any) => s !== 'promotions' || isRealPromotion(p))
    .filter((p: any) => !sp.range || p.commercial_range === sp.range)
    .filter((p: any) => !sp.min || !isFinite(Number(sp.min)) || productPrice(p) >= Number(sp.min))
    .filter((p: any) => !sp.max || !isFinite(Number(sp.max)) || productPrice(p) <= Number(sp.max))
    .sort((x: any, y: any) => {
      if (o === 'asc') return productPrice(x) - productPrice(y);
      if (o === 'desc') return productPrice(y) - productPrice(x);
      if (o === 'pop') return Number(y.sold || 0) - Number(x.sold || 0);
      if (o === 'promo' || (s === 'promotions' && !o)) {
        return discountRate(y) - discountRate(x) ||
          new Date(y.created_at).getTime() - new Date(x.created_at).getTime();
      }
      if (o === 'old') {
        return rank(x) - rank(y) ||
          new Date(x.created_at).getTime() - new Date(y.created_at).getTime();
      }
      if (s === 'nouveautes') {
        return new Date(y.created_at).getTime() - new Date(x.created_at).getTime();
      }
      return rank(x) - rank(y);
    });

  const seen = new Set<string>();

  const brands = (brandProducts || [])
    .filter((p: any) => s !== 'promotions' || isRealPromotion(p))
    .map((p: any) => p.brands)
    .filter((x: any) => x?.id && x?.name)
    .filter((x: any) => {
      const k = x.name.trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a: any, b: any) => a.name.localeCompare(b.name, 'fr'));

  if (s === 'tous' && sp.brand && !sp.q) {
    const bn = brands.find((x: any) => x.id === sp.brand)?.name;
    if (bn) title = bn;
  }

  // ---------- URL ----------
  const url = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    const m: any = { ...sp, ...over };

    for (const k of ['q', 'brand', 'range', 'sort', 'availability', 'stock', 'min', 'max']) {
      if (m[k]) p.set(k, m[k]);
    }

    const qs = p.toString();

    return `/categorie/${s}${qs ? `?${qs}` : ''}`;
  };

  const brandName = sp.brand
    ? brands.find((x: any) => x.id === sp.brand)?.name || ''
    : '';

  const availabilityLabel =
    AVAILABILITY.find((x) => x[0] === sp.availability)?.[1] || '';

  const chips: [string, string][] = [];

  if (sp.q) chips.push([`« ${sp.q} »`, url({ q: '' })]);
  if (brandName) chips.push([brandName, url({ brand: '' })]);
  if (sp.range) {
    chips.push([
      ({ petit_prix: 'Petit prix', marques: 'Marques', premium: 'Premium' } as Record<string, string>)[sp.range] || sp.range,
      url({ range: '' })
    ]);
  }

  if (sp.availability) {
    chips.push([availabilityLabel, url({ availability: '', stock: '' })]);
  } else if (sp.stock) {
    chips.push(['En stock', url({ stock: '' })]);
  }

  if (sp.min) chips.push([`Dès ${sp.min} DH`, url({ min: '' })]);
  if (sp.max) chips.push([`Jusqu’à ${sp.max} DH`, url({ max: '' })]);

  const sortLabel = availableSorts.find((x) => x[0] === (o || ''))?.[1] ||
    (s === 'promotions' ? 'Meilleures réductions' : 'Plus récents');

  const field = 'w-full rounded-full border border-sand bg-white px-4 py-2.5 text-sm outline-none focus:border-plum';

  return (
    <>
      {/* Fil d'Ariane */}
      <nav aria-label="Fil d’Ariane" className="text-xs text-ink/60">
        <Link href="/" className="hover:text-plum">Accueil</Link>
        {parent && <>
          <span aria-hidden="true"> / </span>
          <Link href={`/categorie/${parent.slug}`} className="hover:text-plum">{parent.name}</Link>
        </>}
        <span aria-hidden="true"> / </span>
        <span className="text-plum">{title}</span>
      </nav>

      {/* Titre */}
      <div className="mt-3 flex items-end justify-between gap-4">
        <h1 className="font-serif text-4xl text-plum md:text-5xl">{title}</h1>
        <p className="pb-1 text-sm text-ink/60">
          {list.length} produit{list.length > 1 ? 's' : ''}
        </p>
      </div>

      {s === 'promotions' && (
        <section className="relative mt-4 overflow-hidden rounded-2xl border border-[#EAD9E0] bg-gradient-to-br from-[#FCF0F3] via-white to-[#F7E8ED] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#EBD5DE]/40 blur-2xl" />
          <p className="relative text-[10px] font-semibold uppercase tracking-[0.22em] text-rose">Bons plans beauté</p>
          <p className="relative mt-2 max-w-2xl font-serif text-xl leading-snug text-plum sm:text-2xl">
            Vos essentiels beauté à prix réduits
          </p>
          <p className="relative mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">
            Retrouvez ici les offres en cours sur le maquillage, les soins et les parfums. Chaque réduction est calculée à partir du prix actuel et de l’ancien prix affiché.
          </p>
        </section>
      )}

      {s === 'nouveautes' && (
        <section className="relative mt-4 overflow-hidden rounded-2xl border border-[#EAD9E0] bg-gradient-to-br from-[#FCF4F6] via-white to-[#F8EDF1] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#EBD5DE]/35 blur-2xl" />
          <p className="relative text-[10px] font-semibold uppercase tracking-[0.22em] text-rose">Tout juste arrivés</p>
          <p className="relative mt-2 max-w-2xl font-serif text-xl leading-snug text-plum sm:text-2xl">
            Les dernières pépites beauté à découvrir
          </p>
          <p className="relative mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">
            Retrouvez nos nouveautés maquillage, soins et parfums. Les produits disponibles, précommandes et prochains arrivages sont clairement indiqués pour vous aider à choisir.
          </p>
        </section>
      )}

      {s === 'arrivages' && (
        <section className="relative mt-4 overflow-hidden rounded-2xl border border-[#EAD9E0] bg-gradient-to-br from-[#FCF0F3] via-white to-[#F7E8ED] px-5 py-5 sm:px-7 sm:py-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-rose">Bientôt disponibles</p>
          <h2 className="mt-2 max-w-2xl font-serif text-xl leading-snug text-plum sm:text-2xl">
            Réservez vos prochains coups de cœur beauté
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">
            Un produit vous intéresse ? Ouvrez sa fiche et choisissez « Réserver sur WhatsApp ». Notre équipe vous confirmera les modalités et le délai estimé avant de valider votre réservation.
          </p>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-plum/75">
            Pour connaître l’arrivée de votre produit, gardez votre conversation WhatsApp et contactez notre équipe pour obtenir la confirmation de réception.
          </p>
        </section>
      )}

      {cat && (
        <section
          aria-label="Gammes de produits"
          className={parent ? 'mt-5 flex flex-wrap gap-2' : 'mt-6 grid grid-cols-3 gap-2'}
        >
          {([
            ['petit_prix', 'Petit prix', 'Des essentiels à prix doux'],
            ['marques', 'Marques', 'Vos marques préférées'],
            ['premium', 'Premium', 'Une sélection premium']
          ] as [string, string, string][]).map(([value, label, desc]) => {
            const count = allProducts.filter((p: any) => p.commercial_range === value).length;

            return (
              <Link
                key={value}
                href={url({ range: sp.range === value ? '' : value })}
                aria-pressed={sp.range === value}
                className={parent
                  ? `inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs transition duration-200 ${sp.range === value ? 'border-plum bg-[#FBEFF3] font-semibold text-plum' : 'border-[#EAD9E0] bg-white text-ink/75 hover:border-plum/50'}`
                  : `flex min-h-[116px] flex-col items-center justify-center rounded-2xl border px-2.5 py-3 text-center shadow-sm transition duration-200 ${sp.range === value ? 'border-plum bg-gradient-to-b from-[#FBEFF3] to-[#F7E9EE] shadow-md ring-1 ring-plum/10' : 'border-[#EAD9E0] bg-gradient-to-b from-white to-[#FCF7F8] hover:border-plum/50 hover:shadow-md'}`}
              >
                <span className={parent ? 'font-medium' : 'block font-serif text-[14px] leading-tight text-plum sm:text-base'}>{label}</span>
                {!parent && (
                  <>
                    <span className="mt-2 block min-h-[2.4em] text-[10px] leading-snug text-ink/65">{desc}</span>
                    <span className="mt-1.5 block text-[10px] font-medium text-plum/65">
                      {count} produit{count > 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </section>
      )}

      {/* Barre filtres + tri */}
      <div className="relative z-20 mt-6 flex items-center justify-between gap-3 border-y border-sand py-3">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-plum px-5 py-2 text-sm text-plum [&::-webkit-details-marker]:hidden">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
              <circle cx="16" cy="7" r="2" />
              <circle cx="8" cy="17" r="2" />
            </svg>
            Filtres
            {chips.length > 0 && (
              <span className="rounded-full bg-rose px-1.5 text-[11px] text-white">
                {chips.length}
              </span>
            )}
          </summary>

          <form className="absolute inset-x-0 top-full z-30 mt-2 grid max-h-[75vh] gap-3 overflow-y-auto overscroll-contain rounded-2xl border border-sand bg-white p-4 text-sm shadow-xl md:grid-cols-2">
            <input type="hidden" name="sort" value={o || ''} />
            <input type="hidden" name="range" value={sp.range || ''} />

            <input
              name="q"
              defaultValue={sp.q || ''}
              placeholder="Rechercher un produit"
              className={`${field} md:col-span-2`}
            />

            <label className="block">
              <span className="mb-1 block text-xs text-ink/60">Marque</span>
              <select name="brand" defaultValue={sp.brand || ''} className={field}>
                <option value="">Toutes les marques</option>
                {brands.map((x: any) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </label>

            <div>
              <span className="mb-1 block text-xs text-ink/60">Prix (DH)</span>
              <div className="flex gap-2">
                <input
                  name="min"
                  type="number"
                  inputMode="numeric"
                  defaultValue={sp.min || ''}
                  placeholder="Min"
                  className={field}
                />
                <input
                  name="max"
                  type="number"
                  inputMode="numeric"
                  defaultValue={sp.max || ''}
                  placeholder="Max"
                  className={field}
                />
              </div>
            </div>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs text-ink/60">Disponibilité</span>
              <select
                name="availability"
                defaultValue={sp.availability || (sp.stock ? 'stock' : '')}
                className={field}
              >
                {AVAILABILITY.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <div className="flex gap-2 md:col-span-2">
              <button className="flex-1 rounded-full bg-rose py-3 text-xs uppercase tracking-[0.2em] text-white">
                Appliquer
              </button>
              <Link
                href={`/categorie/${s}`}
                className="rounded-full border border-plum px-6 py-3 text-xs uppercase tracking-[0.2em] text-plum"
              >
                Réinitialiser
              </Link>
            </div>
          </form>
        </details>

        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-sand px-5 py-2 text-sm text-ink [&::-webkit-details-marker]:hidden">
            <span className="text-ink/60">Trier :</span> {sortLabel}
          </summary>

          <ul className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-2xl border border-sand bg-white text-sm shadow-lg">
            {availableSorts.map(([v, l]) => (
              <li key={v}>
                <Link
                  href={url({ sort: v })}
                  className={`block px-4 py-3 hover:bg-sand/40 ${(o || '') === v ? 'font-semibold text-plum' : ''}`}
                >
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* Filtres actifs */}
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {chips.map(([l, h]) => (
            <Link
              key={l}
              href={h}
              className="flex items-center gap-1.5 rounded-full bg-sand/60 px-3 py-1.5 text-plum"
            >
              {l}<span aria-label="Retirer ce filtre">✕</span>
            </Link>
          ))}
          <Link href={`/categorie/${s}`} className="px-2 text-ink/60 underline">
            Tout effacer
          </Link>
        </div>
      )}

      {/* Produits */}
      <div className="relative z-0 mt-6">
        {list.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
            {list.map((p: any) => (
              <ProductCard key={p.id} p={p} highlightPromo={s === 'nouveautes' || s === 'promotions'} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md py-10 text-center">
            <p className="font-serif text-2xl text-plum">
              {sp.q
                ? `Aucun produit ne correspond à « ${sp.q} »`
                : 'Aucun produit pour le moment'}
            </p>
            <p className="mt-2 text-sm text-ink/60">
              Essayez une marque, une catégorie ou un autre mot.
            </p>
            <Link
              href="/categorie/tous"
              className="mt-5 inline-block rounded-full border border-plum px-6 py-3 text-xs uppercase tracking-[0.18em] text-plum"
            >
              Voir tous les produits
            </Link>
          </div>
        )}
      </div>

      <Suggestions
        title="Vous aimerez aussi"
        exclude={list.map((p: any) => p.id)}
        limit={4}
      />
    </>
  );
}
