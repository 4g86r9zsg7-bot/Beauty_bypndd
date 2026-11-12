import {notFound} from 'next/navigation';import {supabase,eur,AVAIL} from '@/lib/supabase';import ProductCard from '@/components/ProductCard';import AddToCart from '@/components/AddToCart';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:{slug:string}}){const {data}=await supabase.from('products').select('name,description').eq('slug',params.slug).single();return {title:data?`${data.name} | Beauty_bypndd`:'Produit',description:data?.description?.slice(0,150)}}
export default async function P({params}:{params:{slug:string}}){
const {data:p}=await supabase.from('products').select('*,brands(name)').eq('slug',params.slug).eq('active',true).single();if(!p)notFound();
const {data:sim}=await supabase.from('products').select('*,brands(name)').eq('category_id',p.category_id).neq('id',p.id).eq('active',true).limit(4);
const promo=p.old_price&&p.old_price>p.price;
return <><div className="grid md:grid-cols-2 gap-8"><div className="flex md:grid gap-2 overflow-x-auto snap-x">{p.images?.map((u:string)=><img key={u} src={u} alt={p.name} className="w-full min-w-[85%] md:min-w-0 snap-center object-cover"/>)}</div>
<div><p className="text-sm text-ink/60">{p.brands?.name}</p><h1 className="font-serif text-3xl">{p.name}</h1>
<p className="text-xl mt-2">{eur(p.price)} {promo&&<><s className="text-ink/50 ml-2">{eur(p.old_price)}</s> <span className="bg-blush px-2 text-sm">-{Math.round(100-p.price/p.old_price*100)}%</span></>}</p>
<p className="mt-2 text-sm">{AVAIL[p.availability]}{p.availability==='last'&&` (${p.stock} restant${p.stock>1?'s':''})`}</p>
<AddToCart p={p}/><p className="mt-6 whitespace-pre-line">{p.description}</p></div></div>
{!!sim?.length&&<section className="mt-12"><h2 className="font-serif text-2xl mb-3">Produits similaires</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{sim.map((s:any)=><ProductCard key={s.id} p={s}/>)}</div></section>}</>}
