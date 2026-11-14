import {notFound} from 'next/navigation';import {supabase} from '@/lib/supabase';import ProductBuy from '@/components/ProductBuy';import Suggestions from '@/components/Suggestions';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:{slug:string}}){const {data}=await supabase.from('products').select('name,description').eq('slug',params.slug).single();return {title:data?`${data.name} | Beauty_bypndd`:'Produit',description:data?.description?.slice(0,150)}}
export default async function P({params}:{params:{slug:string}}){
const {data:p}=await supabase.from('products').select('*,brands(name)').eq('slug',params.slug).eq('active',true).single();if(!p)notFound();
return <><ProductBuy p={p}/><Suggestions title="Produits similaires" categoryId={p.category_id} brandId={p.brand_id} exclude={[p.id]} limit={4}/></>}
