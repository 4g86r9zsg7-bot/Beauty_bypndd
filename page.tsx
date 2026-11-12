import Link from 'next/link';import {supabase} from '@/lib/supabase';import ProductCard from '@/components/ProductCard';
export const revalidate=30;
async function row(title:string,f:(q:any)=>any,href?:string){const {data}=await f(supabase.from('products').select('*,brands(name)').eq('active',true).order('created_at',{ascending:false}).limit(8));
if(!data?.length)return null;return <section className="mt-10"><div className="flex justify-between items-baseline mb-3"><h2 className="font-serif text-2xl">{title}</h2>{href&&<Link href={href} className="text-sm underline">Tout voir</Link>}</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{data.map((p:any)=><ProductCard key={p.id} p={p}/>)}</div></section>}
export default async function Home(){
const {data:cats}=await supabase.from('categories').select('*').order('name');const {data:brands}=await supabase.from('brands').select('*').order('name');
return <>
<section className="bg-blush px-6 py-14 md:py-24 rounded-sm"><h1 className="font-serif text-4xl md:text-6xl max-w-2xl leading-tight">Le luxe à petit prix.</h1>
<p className="mt-4 max-w-md">Votre beauté, vos marques préférées, vos petits prix.</p>
<Link href="/categorie/nouveautes" className="inline-block mt-6 bg-ink text-white px-6 py-3 text-sm">Voir les nouveautés</Link></section>
<div className="flex gap-2 overflow-x-auto mt-6">{cats?.map(c=><Link key={c.id} href={`/categorie/${c.slug}`} className="border border-sand bg-white px-4 py-2 text-sm whitespace-nowrap">{c.name}</Link>)}</div>
{await row('Arrivages du moment',q=>q.in('availability',['arrival','preorder']),'/categorie/nouveautes')}
{await row('Nouveautés',q=>q.eq('is_new',true),'/categorie/nouveautes')}
{await row('Meilleures ventes',q=>q.eq('is_bestseller',true))}
{await row('Promotions et bonnes affaires',q=>q.not('old_price','is',null),'/categorie/promotions')}
{await row('Disponibles immédiatement',q=>q.eq('availability','available'))}
{await row('Coffrets cadeaux',q=>q.eq('category_id',cats?.find(c=>c.slug==='coffrets-cadeaux')?.id??'00000000-0000-0000-0000-000000000000'),'/categorie/coffrets-cadeaux')}
{!!brands?.length&&<section className="mt-10"><h2 className="font-serif text-2xl mb-3">Marques populaires</h2><div className="flex flex-wrap gap-2">{brands.map(b=><span key={b.id} className="border border-ink px-4 py-1.5 text-sm">{b.name}</span>)}</div></section>}
</>}
