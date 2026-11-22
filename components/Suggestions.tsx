
'use client';

import {useEffect,useMemo,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {useCart} from '@/lib/cart';
import ProductCard from '@/components/ProductCard';

export default function Suggestions({
  title='Vous aimerez aussi',
  categoryId=null,
  brandId=null,
  exclude=[],
  excludeCart=false,
  limit=8
}:{
  title?:string;
  categoryId?:string|null;
  brandId?:string|null;
  exclude?:string[];
  excludeCart?:boolean;
  limit?:number;
}) {
  const {lines=[]}=useCart();
  const [products,setProducts]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  const excludeKey=exclude.join(',');

  const excludedIds=useMemo(
    ()=>new Set([
      ...exclude,
      ...(excludeCart?(lines||[]).map((l:any)=>l.id):[])
    ]),
    [excludeKey,excludeCart,lines]
  );

  useEffect(()=>{
    let active=true;

    const load=async()=>{
      setLoading(true);

      let query=supabase
        .from('products')
        .select('id,name,slug,price,old_price,images,variants,availability,stock,is_bestseller,is_new,source_name,commercial_range,brand_id,sold,created_at,brands(name)')
        .eq('active',true)
        .order('created_at',{ascending:false})
        .limit(100);

      // Sur une fiche produit, on impose la même catégorie.
      if(categoryId){
        query=query.eq('category_id',categoryId);
      }

      const {data,error}=await query;

      if(!active)return;

      if(error||!data){
        setProducts([]);
        setLoading(false);
        return;
      }

      const available=(p:any)=>{
        if(p.availability==='soldout')return false;
        if(p.availability==='preorder'||p.availability==='arrival')return true;
        return Number(p.stock||0)>0;
      };

      const ranked=data
        .filter((p:any)=>!excludedIds.has(p.id))
        .map((p:any)=>{
          let score=0;

          if(brandId&&p.brand_id===brandId)score+=50;
          if(p.is_bestseller)score+=25;
          if(p.is_new)score+=15;
          if(available(p))score+=30;
          if(p.old_price&&Number(p.old_price)>Number(p.price))score+=10;

          score+=Math.min(Number(p.sold)||0,20);

          return {product:p,score};
        })
        .sort((a:any,b:any)=>b.score-a.score);

      setProducts(ranked.slice(0,limit).map((x:any)=>x.product));
      setLoading(false);
    };

    load();

    return ()=>{active=false};
  },[categoryId,brandId,excludedIds,limit]);

  if(loading&&!products.length)return null;
  if(!products.length)return null;

  return (
    <section className="mt-12">
      <div className="mb-5 text-center">
        <h2 className="font-serif text-3xl text-plum">{title}</h2>
        <div className="mx-auto mt-3 h-px w-16 bg-rose"/>
        <p className="mt-2 text-xs tracking-wide text-ink/50">
          Une sélection choisie pour vous
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
        {products.map((p:any)=>(
          <ProductCard key={p.id} p={p}/>
        ))}
      </div>
    </section>
  );
}
