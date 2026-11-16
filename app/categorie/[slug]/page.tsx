import {cache} from 'react';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {supabase} from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import Suggestions from '@/components/Suggestions';

export const dynamic = 'force-dynamic';

type SP = {brand?: string; sort?: string; stock?: string; q?: string; min?: string; max?: string};

const FIXED: Record<string, {title: string; desc: string; filter?: (q: any) => any}> = {
  tous: {title: 'Tous les produits', desc: 'Tous les produits Beauty_bypndd : maquillage, soins, parfums et mode, authentiques à prix accessibles.'},
  nouveautes: {title: 'Nouveautés', desc: 'Les dernières nouveautés beauté, soins, parfums et mode chez Beauty_bypndd.', filter: (q) => q.eq('is_new', true)},
  promotions: {title: 'Promotions', desc: 'Les bonnes affaires du moment chez Beauty_bypndd : produits authentiques à prix réduit.', filter: (q) => q.not('old_price', 'is', null)},
  arrivages: {title: 'Prochains arrivages', desc: 'Découvrez les prochains arrivages Beauty_bypndd avant tout le monde.', filter: (q) => q.eq('availability', 'arrival')},
  precommandes: {title: 'Précommandes', desc: 'Réservez dès maintenant vos produits en précommande chez Beauty_bypndd.', filter: (q) => q.eq('availability', 'preorder')},
};

const SORTS: [string, string][] = [['', 'Plus récents'], ['pop', 'Plus vendus'], ['asc', 'Prix croissant'], ['desc', 'Prix décroissant']];

// ---------- Catégories (une seule requête, partagée) ----------
const getCats = cache(async () => {
  const {data} = await supabase.from('categories').select('id,slug,name,parent_id').order('name');
  return (data || []) as any[];
});
const kidsOf = (all: any[], id: any) => all.filter((x) => x.parent_id === id && x.slug !== 'sacs-accessoires');
const subtree = (all: any[], id: any, depth = 0): any[] =>
  depth > 5 ? [id] : [id, ...kidsOf(all, id).flatMap((k) => subtree(all, k.id, depth + 1))];

// ---------- Titre, description et aperçu de partage propres à chaque page ----------
export async function generateMetadata({params}: {params: {slug: string}}) {
  const s = params.slug;
  const all = await getCats();
  const f = FIXED[s];
  const c = all.find((x) => x.slug === s);
  if (!f && !c) return {title: 'Boutique | Beauty_bypndd'};

  const title = f ? f.title : c.name;
  const subs = c ? kidsOf(all, c.id).map((k) => k.name).slice(0, 6) : [];
  const description = f
    ? f.desc
    : subs.length
    ? `${title} chez Beauty_bypndd : ${subs.join(', ')}. Marques authentiques à prix accessibles, livraison à domicile et paiement à la livraison.`
    : `Découvrez ${title} chez Beauty_bypndd : produits authentiques à prix accessibles, livraison à domicile et paiement à la livraison.`;

  let pq: any = supabase.from('products').select('images').eq('active', true);
  if (c) pq = pq.in('category_id', subtree(all, c.id)).order('sold', {ascending: false});
  else pq = (f?.filter ? f.filter(pq) : pq).order('created_at', {ascending: false});
  const {data: pr} = await pq.limit(1);
  const img: string | undefined = pr?.[0]?.images?.[0];

  return {
    title: `${title} | Beauty_bypndd`,
    description,
    alternates: {canonical: `/categorie/${s}`},
    openGraph: {
      title: `${title} | Beauty_bypndd`,
      description,
      url: `/categorie/${s}`,
      siteName: 'Beauty_bypndd',
      locale: 'fr_FR',
      type: 'website',
      images: img ? [{url: img, alt: title}] : undefined,
    },
    twitter: {card: img ? 'summary_large_image' : 'summary', title: `${title} | Beauty_bypndd`, description, images: img ? [img] : undefined},
  };
}

export default async function Cat({params, searchParams}: {params: {slug: string}; searchParams: SP}) {
  const s = params.slug;
  const sp = searchParams;
  if (s === 'sacs-accessoires') notFound();

  const all = await getCats();
  const fixed = FIXED[s];
  const cat = fixed ? null : all.find((x) => x.slug === s);
  if (!fixed && !cat) notFound();

  const parent = cat?.parent_id ? all.find((x) => x.id === cat.parent_id) : null;

  // Sous-catégories à afficher :
  // - page catégorie principale  -> ses sous-catégories
  // - page sous-catégorie        -> ses "sœurs" (même parent), comme chez Sephora
  // - pages spéciales (tous, nouveautés…) -> les grandes catégories
  const navItems: any[] = cat
    ? kidsOf(all, parent ? parent.id : cat.id)
    : all.filter((x) => !x.parent_id && x.slug !== 'sacs-accessoires');
  const navTitle = cat ? (parent ? parent.name : cat.name) : 'Parcourir par catégorie';
  const navAllHref = cat ? (parent ? `/categorie/${parent.slug}` : null) : null;

  let title = fixed ? fixed.title : cat.name;
  if (s === 'tous' && sp.q) title = `Recherche : ${sp.q}`;

  // ---------- Produits ----------
  let q: any = supabase.from('products').select('*,brands(name)').eq('active', true);
  if (fixed?.filter) q = fixed.filter(q);
  if (cat) q = q.in('category_id', subtree(all, cat.id));

  const t = (sp.q || '').replace(/[%,()*]/g, ' ').trim();
  if (t) {
    const [bm, cm] = await Promise.all([
      supabase.from('brands').select('id').ilike('name', `%${t}%`),
      supabase.from('categories').select('id').ilike('name', `%${t}%`),
    ]);
    const bi = (bm.data || []).map((x: any) => x.id);
    const ci = (cm.data || []).map((x: any) => x.id);
    const parts = [`name.ilike.%${t}%`, `description.ilike.%${t}%`];
    if (bi.length) parts.push(`brand_id.in.(${bi.join(',')})`);
    if (ci.length) parts.push(`category_id.in.(${ci.join(',')})`);
    q = q.or(parts.join(','));
  }
  if (sp.brand) q = q.eq('brand_id', sp.brand);
  if (sp.stock) q = q.neq('availability', 'soldout');
  if (sp.min && isFinite(Number(sp.min))) q = q.gte('price', Number(sp.min));
  if (sp.max && isFinite(Number(sp.max))) q = q.lte('price', Number(sp.max));

  const o = sp.sort;
  q = o === 'asc' ? q.order('price') : o === 'desc' ? q.order('price', {ascending: false}) : o === 'pop' ? q.order('sold', {ascending: false}) : q.order('created_at', {ascending: false});

  // Vignettes des sous-catégories : image du produit le plus vendu de chaque sous-catégorie
  const thumbIds = navItems.flatMap((n) => subtree(all, n.id));
  const thumbQ = thumbIds.length
    ? supabase.from('products').select('category_id,images').eq('active', true).in('category_id', thumbIds).order('sold', {ascending: false}).limit(400)
    : Promise.resolve({data: [] as any[]});

  const [{data}, {data: b}, {data: tp}] = await Promise.all([q, supabase.from('brands').select('*').order('name'), thumbQ as any]);

  const thumbs: Record<string, string> = {};
  for (const n of navItems) {
    const ids = new Set(subtree(all, n.id));
    const hit = (tp || []).find((p: any) => ids.has(p.category_id) && p.images?.[0]);
    if (hit) thumbs[n.id] = hit.images[0];
  }

  const rank = (p: any) => {
    const pre = p.availability === 'preorder', arr = p.availability === 'arrival';
    const sold = p.availability === 'soldout' || (!pre && !arr && p.stock <= 0);
    return sold ? 2 : pre || arr ? 1 : 0;
  };
  const list = [...(data || [])].sort((x: any, y: any) => rank(x) - rank(y));

  const seen = new Set<string>();
  const brands = (b || []).filter((x: any) => {
    const k = x.name.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (s === 'tous' && sp.brand && !sp.q) {
    const bn = (b || []).find((x: any) => x.id === sp.brand)?.name;
    if (bn) title = bn;
  }

  // ---------- Helpers d'URL ----------
  const url = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    const m: any = {...sp, ...over};
    for (const k of ['q', 'brand', 'sort', 'stock', 'min', 'max']) if (m[k]) p.set(k, m[k]);
    const qs = p.toString();
    return `/categorie/${s}${qs ? `?${qs}` : ''}`;
  };
  const brandName = sp.brand ? (b || []).find((x: any) => x.id === sp.brand)?.name : '';
  const chips: [string, string][] = [];
  if (sp.q) chips.push([`« ${sp.q} »`, url({q: ''})]);
  if (brandName) chips.push([brandName, url({brand: ''})]);
  if (sp.stock) chips.push(['En stock', url({stock: ''})]);
  if (sp.min) chips.push([`Dès ${sp.min} DH`, url({min: ''})]);
  if (sp.max) chips.push([`Jusqu’à ${sp.max} DH`, url({max: ''})]);
  const sortLabel = SORTS.find((x) => x[0] === (o || ''))?.[1] || 'Plus récents';

  const field = 'w-full rounded-full border border-sand bg-white px-4 py-2.5 text-sm outline-none focus:border-plum';
  const noScroll = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

  return (
    <>
      {/* Fil d'Ariane */}
      <nav aria-label="Fil d’Ariane" className="text-xs text-ink/60">
        <Link href="/" className="hover:text-plum">Accueil</Link>
        {parent && <> <span aria-hidden="true">/</span> <Link href={`/categorie/${parent.slug}`} className="hover:text-plum">{parent.name}</Link></>}
        <span aria-hidden="true"> / </span><span className="text-plum">{title}</span>
      </nav>

      {/* Titre */}
      <div className="mt-3 flex items-end justify-between gap-4">
        <h1 className="font-serif text-4xl text-plum md:text-5xl">{title}</h1>
        <p className="pb-1 text-sm text-ink/60">{list.length} produit{list.length > 1 ? 's' : ''}</p>
      </div>

      {/* Navigation par sous-catégories */}
      {navItems.length > 0 && (
        <>
          <div className={`-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 ${noScroll}`}>
            {navAllHref && (
              <Link href={navAllHref} className="shrink-0 rounded-full border border-plum/30 bg-white px-4 py-2 text-sm text-plum">Tout {navTitle}</Link>
            )}
            {navItems.map((k) => (
              <Link key={k.id} href={`/categorie/${k.slug}`} aria-current={k.slug === s ? 'page' : undefined}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${k.slug === s ? 'border-plum bg-plum text-white' : 'border-plum/30 bg-white text-plum hover:border-plum'}`}>
                {k.name}
              </Link>
            ))}
          </div>

          {/* Raccourcis visuels */}
          <div className={`-mx-4 mt-5 flex gap-4 overflow-x-auto px-4 pb-2 md:gap-6 ${noScroll}`}>
            {navItems.map((k) => (
              <Link key={k.id} href={`/categorie/${k.slug}`} className="group w-[84px] shrink-0 text-center md:w-[110px]">
                <span className={`mx-auto flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full bg-sand/60 ring-1 transition md:h-[110px] md:w-[110px] ${k.slug === s ? 'ring-2 ring-plum' : 'ring-sand group-hover:ring-plum'}`}>
                  {thumbs[k.id]
                    ? <img src={thumbs[k.id]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    : <span className="font-serif text-3xl text-plum/60">{k.name.charAt(0)}</span>}
                </span>
                <span className="mt-2 block text-xs leading-tight text-ink">{k.name}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Barre filtres + tri */}
      <div className="relative mt-6 flex items-center justify-between gap-3 border-y border-sand py-3">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-plum px-5 py-2 text-sm text-plum [&::-webkit-details-marker]:hidden">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>
            Filtres{chips.length > 0 && <span className="rounded-full bg-rose px-1.5 text-[11px] text-white">{chips.length}</span>}
          </summary>
          <form className="absolute inset-x-0 top-full z-10 mt-2 grid gap-3 rounded-2xl border border-sand bg-white p-4 text-sm shadow-lg md:grid-cols-2">
            <input type="hidden" name="sort" value={o || ''} />
            <input name="q" defaultValue={sp.q || ''} placeholder="Rechercher un produit" className={`${field} md:col-span-2`} />
            <label className="block">
              <span className="mb-1 block text-xs text-ink/60">Marque</span>
              <select name="brand" defaultValue={sp.brand || ''} className={field}>
                <option value="">Toutes les marques</option>
                {brands.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
            <div>
              <span className="mb-1 block text-xs text-ink/60">Prix (DH)</span>
              <div className="flex gap-2">
                <input name="min" type="number" inputMode="numeric" defaultValue={sp.min || ''} placeholder="Min" className={field} />
                <input name="max" type="number" inputMode="numeric" defaultValue={sp.max || ''} placeholder="Max" className={field} />
              </div>
            </div>
            <label className="flex items-center gap-2 md:col-span-2"><input type="checkbox" name="stock" value="1" defaultChecked={!!sp.stock} />Afficher seulement les produits en stock</label>
            <div className="flex gap-2 md:col-span-2">
              <button className="flex-1 rounded-full bg-rose py-3 text-xs uppercase tracking-[0.2em] text-white">Appliquer</button>
              <Link href={`/categorie/${s}`} className="rounded-full border border-plum px-6 py-3 text-xs uppercase tracking-[0.2em] text-plum">Réinitialiser</Link>
            </div>
          </form>
        </details>

        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-sand px-5 py-2 text-sm text-ink [&::-webkit-details-marker]:hidden">
            <span className="text-ink/60">Trier :</span> {sortLabel}
          </summary>
          <ul className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-2xl border border-sand bg-white text-sm shadow-lg">
            {SORTS.map(([v, l]) => (
              <li key={v}><Link href={url({sort: v})} className={`block px-4 py-3 hover:bg-sand/40 ${(o || '') === v ? 'font-semibold text-plum' : ''}`}>{l}</Link></li>
            ))}
          </ul>
        </details>
      </div>

      {/* Filtres actifs */}
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {chips.map(([l, h]) => (
            <Link key={l} href={h} className="flex items-center gap-1.5 rounded-full bg-sand/60 px-3 py-1.5 text-plum">{l}<span aria-label="Retirer ce filtre">✕</span></Link>
          ))}
          <Link href={`/categorie/${s}`} className="px-2 text-ink/60 underline">Tout effacer</Link>
        </div>
      )}

      {/* Produits */}
      <div className="mt-6">
        {list.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
            {list.map((p: any) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="mx-auto max-w-md py-10 text-center">
            <p className="font-serif text-2xl text-plum">{sp.q ? `Aucun produit ne correspond à « ${sp.q} »` : 'Aucun produit pour le moment'}</p>
            <p className="mt-2 text-sm text-ink/60">Essayez une marque, une catégorie ou un autre mot.</p>
            <Link href="/categorie/tous" className="mt-5 inline-block rounded-full border border-plum px-6 py-3 text-xs uppercase tracking-[0.18em] text-plum">Voir tous les produits</Link>
          </div>
        )}
      </div>

      <Suggestions title="Vous aimerez aussi" exclude={list.map((p: any) => p.id)} limit={4} />
    </>
  );
}
