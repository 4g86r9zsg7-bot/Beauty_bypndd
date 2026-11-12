import Link from 'next/link';import {supabase} from '@/lib/supabase';import ProductCard from '@/components/ProductCard';
export const revalidate=30;
async function row(title:string,f:(q:any)=>any,href?:string){const {data}=await f(supabase.from('products').select('*,brands(name)').eq('active',true).order('created_at',{ascending:false}).limit(8));
if(!data?.length)return null;return <section className="mt-12"><div className="text-center mb-5"><h2 className="font-serif text-3xl text-plum">{title}</h2><div className="w-16 h-px bg-rose mx-auto mt-3"/>{href&&<Link href={href} className="text-[11px] tracking-[0.2em] uppercase text-rose mt-3 inline-block">Tout voir</Link>}</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{data.map((p:any)=><ProductCard key={p.id} p={p}/>)}</div></section>}
export default async function Home(){
const {data:cats}=await supabase.from('categories').select('*').order('name');const {data:brands}=await supabase.from('brands').select('*').order('name');
return <>
<section className="-mx-4 -mt-6 px-6 py-14 md:py-24 text-white bg-gradient-to-br from-deep via-[#4a1230] to-black">
<span className="inline-block border border-white/30 rounded-full px-4 py-1.5 text-[11px] tracking-[0.25em] uppercase">Nouveauté exclusive</span>
<p className="mt-8 text-xs tracking-[0.35em] uppercase text-blush">Beauté, mode &amp; accessoires</p>
<h1 className="font-serif text-5xl md:text-7xl mt-3 leading-tight max-w-2xl">Le luxe à petit prix</h1>
<p className="mt-4 max-w-md text-white/80 text-lg">Votre beauté, vos marques préférées, vos petits prix.</p>
<div className="mt-8 grid gap-3 max-w-sm"><Link href="/categorie/nouveautes" className="bg-rose text-center rounded-full py-4 text-xs tracking-[0.2em] uppercase font-semibold">Voir les nouveautés →</Link>
<Link href="/categorie/promotions" className="border border-white/40 text-center rounded-full py-4 text-xs tracking-[0.2em] uppercase font-semibold">Voir les bonnes affaires</Link></div></section>
<div className="text-center mt-12"><p className="text-xs tracking-[0.35em] uppercase text-rose">Inspiration élégante</p><h2 className="font-serif text-3xl text-plum mt-2">Achetez par catégorie</h2><div className="w-16 h-px bg-rose mx-auto mt-3"/></div>
<div className="flex flex-wrap justify-center gap-2 mt-5">{cats?.map(c=><Link key={c.id} href={`/categorie/${c.slug}`} className="border border-plum/30 bg-white text-plum rounded-full px-4 py-2 text-[11px] tracking-[0.15em] uppercase">{c.name}</Link>)}</div>
{await row('Arrivages du moment',q=>q.in('availability',['arrival','preorder']),'/categorie/nouveautes')}
{await row('Nouveautés',q=>q.eq('is_new',true),'/categorie/nouveautes')}
{await row('Meilleures ventes',q=>q.eq('is_bestseller',true))}
{await row('Promotions et bonnes affaires',q=>q.not('old_price','is',null),'/categorie/promotions')}
{await row('Disponibles immédiatement',q=>q.eq('availability','available'))}
{await row('Coffrets cadeaux',q=>q.eq('category_id',cats?.find(c=>c.slug==='coffrets-cadeaux')?.id??'00000000-0000-0000-0000-000000000000'),'/categorie/coffrets-cadeaux')}
{!!brands?.length&&<section className="mt-12 text-center"><h2 className="font-serif text-3xl text-plum">Marques populaires</h2><div className="flex flex-wrap justify-center gap-2 mt-4">{brands.map(b=><span key={b.id} className="border border-plum px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase text-plum">{b.name}</span>)}</div></section>}
</>}
