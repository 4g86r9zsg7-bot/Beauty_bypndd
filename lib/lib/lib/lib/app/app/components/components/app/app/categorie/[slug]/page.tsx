import {notFound} from 'next/navigation';import {supabase} from '@/lib/supabase';import ProductCard from '@/components/ProductCard';
export const dynamic='force-dynamic';
export default async function Cat({params,searchParams}:{params:{slug:string};searchParams:{brand?:string;sort?:string;stock?:string}}){
const s=params.slug;let q:any=supabase.from('products').select('*,brands(name)').eq('active',true);let title='';
if(s==='nouveautes'){title='Nouveautés';q=q.eq('is_new',true)}else if(s==='promotions'){title='Promotions';q=q.not('old_price','is',null)}
else{const {data:c}=await supabase.from('categories').select('id,name').eq('slug',s).single();if(!c)notFound();title=c.name;q=q.eq('category_id',c.id)}
if(searchParams.brand)q=q.eq('brand_id',searchParams.brand);if(searchParams.stock)q=q.neq('availability','soldout');
const o=searchParams.sort;q=o==='asc'?q.order('price'):o==='desc'?q.order('price',{ascending:false}):q.order('created_at',{ascending:false});
const [{data}, {data:brands}]=await Promise.all([q,supabase.from('brands').select('*').order('name')]);
return <><h1 className="font-serif text-3xl">{title}</h1>
<form className="flex flex-wrap gap-2 my-4 text-sm"><select name="brand" defaultValue={searchParams.brand||''} className="border border-sand bg-white p-2"><option value="">Toutes les marques</option>{brands?.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
<select name="sort" defaultValue={o||''} className="border border-sand bg-white p-2"><option value="">Plus récents</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option></select>
<label className="flex items-center gap-1"><input type="checkbox" name="stock" value="1" defaultChecked={!!searchParams.stock}/>En stock</label><button className="bg-ink text-white px-4">Filtrer</button></form>
{data?.length?<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{data.map((p:any)=><ProductCard key={p.id} p={p}/>)}</div>:<p>Aucun produit pour le moment.</p>}</>}
