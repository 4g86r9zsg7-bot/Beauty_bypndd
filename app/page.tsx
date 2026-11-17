import Link from 'next/link';import {supabase} from '@/lib/supabase';import Shortcuts from '@/components/Shortcuts';import Hero from '@/components/Hero';import Shelf from '@/components/Shelf';import Suggestions from '@/components/Suggestions';
export const revalidate=30;
export const metadata={title:'Beauty_bypndd | Le luxe à petit prix',description:'Beauté, soins, parfums et mode : grandes marques authentiques à prix accessibles. Livraison à domicile et paiement à la livraison.',openGraph:{title:'Beauty_bypndd | Le luxe à petit prix',description:'Beauté, soins, parfums et mode : grandes marques authentiques à prix accessibles.',url:'/',siteName:'Beauty_bypndd',locale:'fr_FR',type:'website'}};
const uniq=(a:any[]|null)=>{const s=new Set<string>();return (a||[]).filter(x=>{const k=x.name.trim().toLowerCase();if(s.has(k))return false;s.add(k);return true})};
export default async function Home(){
const [{data:c},{data:b}]=await Promise.all([supabase.from('categories').select('*').order('position',{nullsFirst:false}).order('name'),supabase.from('brands').select('*').order('name')]);
const cats=uniq(c),brands=uniq(b);
const top=cats.filter((x:any)=>!x.parent_id&&x.slug!=='sacs-accessoires');
const coffretsId=cats.find((x:any)=>x.slug==='coffrets-cadeaux')?.id??'00000000-0000-0000-0000-000000000000';
const defs:{tone:string;title:string;href:string;f:(q:any)=>any}[]=[
{tone:'nouveautes',title:'Nouveautés',href:'/categorie/nouveautes',f:q=>q.eq('is_new',true).not('availability','in','(arrival,preorder)')},
{tone:'immediat',title:'Disponibles immédiatement',href:'/categorie/tous',f:q=>q.in('availability',['available','last']).gt('stock',0)},
{tone:'coeur',title:'Coups de cœur',href:'/categorie/coups-de-coeur',f:q=>q.eq('featured',true)},
{tone:'ventes',title:'Meilleures ventes',href:'/categorie/meilleures-ventes',f:q=>q.eq('is_bestseller',true).not('availability','in','(arrival,preorder)')},
{tone:'promo',title:'Promotions et bonnes affaires',href:'/categorie/promotions',f:q=>q.not('old_price','is',null).not('availability','in','(arrival,preorder)')},
{tone:'arrivages',title:'Prochains arrivages',href:'/categorie/arrivages',f:q=>q.eq('availability','arrival')},
{tone:'precommandes',title:'Précommandes',href:'/categorie/precommandes',f:q=>q.eq('availability','preorder')},
{tone:'cadeaux',title:'Coffrets cadeaux',href:'/categorie/coffrets-cadeaux',f:q=>q.eq('category_id',coffretsId).not('availability','in','(arrival,preorder)')},
];
const fetched=await Promise.all(defs.map(d=>d.f(supabase.from('products').select('*,brands(name)').eq('active',true).order('created_at',{ascending:false}).limit(40))));
const seen=new Set<string>();
const shelves=defs.map((d,i)=>{
const all=(((fetched[i] as any).data)||[]).filter((x:any)=>x.availability!=='soldout');
const fresh=all.filter((x:any)=>!seen.has(x.id));
const items=(fresh.length>=4?fresh:all).slice(0,16);
items.forEach((x:any)=>seen.add(x.id));
return items.length?<Shelf key={d.tone} tone={d.tone} title={d.title} href={d.href} items={items}/>:null});
return <>
<Shortcuts/>
<Hero/>
<Link href="/precommande-shein" className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-[#14040c] px-5 py-4 text-white transition hover:opacity-90"><span><span className="block text-[10px] uppercase tracking-[0.3em] text-[#EE6FB0]">SHEIN</span><span className="mt-1 block font-serif text-2xl italic">Précommande SHEIN</span><span className="mt-0.5 block text-xs text-white/70">Collez votre panier, obtenez votre prix final en dirhams</span></span><span className="text-2xl text-[#EE6FB0]" aria-hidden="true">→</span></Link>

<section className="mt-14">
<div className="text-center"><p className="text-[11px] uppercase tracking-[0.35em] text-rose">Inspiration élégante</p><h2 className="mt-2 font-serif text-3xl text-plum md:text-4xl">Achetez par catégorie</h2><div className="mx-auto mt-3 h-px w-16 bg-rose"/></div>
<div className="-mx-4 mt-7 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible lg:px-0 lg:[grid-template-columns:repeat(auto-fit,minmax(112px,1fr))]">
{top.map((x:any)=><Link key={x.id} href={`/categorie/${x.slug}`} className="group w-[108px] shrink-0 md:w-[112px] lg:w-auto">
<span className="relative mx-auto block h-[92px] w-[92px] overflow-hidden rounded-full bg-gradient-to-br from-sand to-white ring-1 ring-sand transition group-hover:ring-plum md:h-[108px] md:w-[108px]">
<span className="absolute inset-0 flex items-center justify-center font-serif text-4xl text-plum/40">{x.name.charAt(0)}</span>
<img src={x.image_url||`/categories/${x.slug}.jpg`} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/></span>
<span className="mt-2 block text-center text-xs leading-tight text-ink">{x.name}</span></Link>)}</div>
</section>

{shelves}

{brands.length>0&&<section className="relative left-1/2 mt-16 w-screen -translate-x-1/2 bg-white py-12 text-center"><div className="mx-auto max-w-6xl px-4"><p className="text-[11px] uppercase tracking-[0.35em] text-rose">Nos partenaires</p><h2 className="mt-2 font-serif text-3xl text-plum md:text-4xl">Marques populaires</h2><div className="mx-auto mt-3 h-px w-16 bg-rose"/>
<div className="-mx-4 mt-8 flex items-center gap-6 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-wrap md:justify-center md:gap-x-12 md:gap-y-6 md:overflow-visible md:px-0">{brands.map((x:any)=><Link key={x.id} href={`/categorie/tous?brand=${x.id}`} aria-label={x.name} className="flex h-14 w-[132px] shrink-0 items-center justify-center px-2 md:w-[148px]">{x.logo_url?<img src={x.logo_url} alt={x.name} loading="lazy" decoding="async" className="max-h-9 max-w-full object-contain mix-blend-multiply grayscale"/>:<span className="text-center font-serif text-[15px] uppercase leading-tight tracking-[0.12em] text-black">{x.name}</span>}</Link>)}</div>
<Link href="/categorie/tous" className="mt-7 inline-block rounded-full border border-plum px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] text-plum transition hover:bg-plum hover:text-white">Voir tout</Link></div></section>}

<div className="mt-6"><Suggestions title="Vous aimerez aussi" exclude={[]} limit={4}/></div>
</>}
