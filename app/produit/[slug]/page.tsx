import {notFound} from 'next/navigation';import {supabase} from '@/lib/supabase';import ProductCard from '@/components/ProductCard';import ProductBuy from '@/components/ProductBuy';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:{slug:string}}){const {data}=await supabase.from('products').select('name,description').eq('slug',params.slug).single();return {title:data?`${data.name} | Beauty_bypndd`:'Produit',description:data?.description?.slice(0,150)}}
export default async function P({params}:{params:{slug:string}}){
const {data:p}=await supabase.from('products').select('*,brands(name)').eq('slug',params.slug).eq('active',true).single();if(!p)notFound();
const {data:sim}=await supabase.from('products').select('*,brands(name)').eq('category_id',p.category_id).neq('id',p.id).eq('active',true).limit(4);
return <><ProductBuy p={p}/>
{!!sim?.length&&<section className="mt-12"><h2 className="font-serif text-2xl mb-3">Produits similaires</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{sim.map((s:any)=><ProductCard key={s.id} p={s}/>)}</div></section>}</>}
