'use client';

import {useEffect,useState} from 'react';
import ProductCard from '@/components/ProductCard';

const STORAGE_KEY='beautybypndd_recently_viewed';
const MAX_RECENT=8;

export default function RecentlyViewed({product}:{product:any}){
  const [recent,setRecent]=useState<any[]>([]);

  useEffect(()=>{
    if(!product?.id||!product?.slug)return;

    let previous:any[]=[];
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      if(Array.isArray(saved))previous=saved;
    }catch{
      previous=[];
    }

    const viewed=previous
      .filter((item:any)=>item&&item.id!==product.id&&item.slug&&item.name)
      .slice(0,MAX_RECENT);

    setRecent(viewed);

    const current={
      id:product.id,
      slug:product.slug,
      name:product.name,
      price:product.price,
      category_id:product.category_id||null,
      brand_id:product.brand_id||null,
      old_price:product.old_price,
      images:Array.isArray(product.images)?product.images:[],
      availability:product.availability,
      stock:product.stock,
      variants:Array.isArray(product.variants)?product.variants:[],
      source_name:product.source_name,
      commercial_range:product.commercial_range,
      brands:product.brands
    };

    try{
      localStorage.setItem(STORAGE_KEY,JSON.stringify([
        current,
        ...previous.filter((item:any)=>item&&item.id!==product.id)
      ].slice(0,MAX_RECENT+1)));

      // Historique léger des produits réellement ouverts, utilisé pour varier l'accueil.
      const viewedKey='beautybypndd_viewed_products';
      const savedViewed=JSON.parse(localStorage.getItem(viewedKey)||'[]');
      const viewedIds=Array.isArray(savedViewed)?savedViewed.filter((id:any)=>typeof id==='string'):[];
      localStorage.setItem(viewedKey,JSON.stringify([
        product.id,
        ...viewedIds.filter((id:any)=>id!==product.id)
      ].slice(0,500)));
    }catch{
      // Le site reste utilisable même si le stockage local est indisponible.
    }
  },[product]);

  if(!recent.length)return null;

  return (
    <section aria-label="Produits récemment consultés" className="mx-auto mt-12 w-full max-w-6xl px-4 md:px-8">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-rose">Votre historique</p>
        <h2 className="mt-2 font-serif text-3xl text-plum md:text-4xl">Récemment consultés</h2>
        <span className="mt-3 block h-px w-14 bg-[#C6A15B]"/>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {recent.slice(0,MAX_RECENT).map((item:any)=>(
          <ProductCard key={item.id} p={item}/>
        ))}
      </div>
    </section>
  );
}
