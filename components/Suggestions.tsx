'use client';import {useEffect,useState} from 'react';import {supabase} from '@/lib/supabase';import {useCart} from '@/lib/cart';import ProductCard from '@/components/ProductCard';
export default function Suggestions({title='Vous aimerez aussi',categoryId=null,brandId=null,exclude=[],excludeCart=false,limit=8}:{title?:string;categoryId?:string|null;brandId?:string|null;exclude?:string[];excludeCart?:boolean;limit?:number}){
const {lines}=useCart();const [items,setItems]=useState<any[]>([]);
const ex=[...exclude,...(excludeCart?(lines||[]).map((l:any)=>l.id):[])];const key=ex.join(',');
useEffect(()=>{supabase.from('products').select('*,brands(name)').eq('active',true).order('created_at',{ascending:false}).limit(60).then(({data})=>{
const score=(p:any)=>{const sold=p.availability==='soldout'||(p.availability!=='preorder'&&p.availability!=='arrival'&&p.stock<=0);const inS=!sold&&(p.availability==='available'||p.availability==='last');return (inS?100:p.availability==='preorder'?20:p.availability==='arrival'?10:0)+(categoryId&&p.category_id===categoryId?30:0)+(brandId&&p.brand_id===brandId?15:0)+Math.min(p.sold||0,10)};
setItems((data||[]).filter((p:any)=>!ex.includes(p.id)).map((p:any)=>({p,s:score(p)})).sort((a:any,b:any)=>b.s-a.s).slice(0,limit).map((x:any)=>x.p))})},[categoryId,brandId,key]);
if(!items.length)return null;
return <section className="mt-12"><div className="text-center mb-5"><h2 className="font-serif text-3xl text-plum">{title}</h2><div className="w-16 h-px bg-rose mx-auto mt-3"/></div><div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">{items.map((p:any)=><ProductCard key={p.id} p={p}/>)}</div></section>}
