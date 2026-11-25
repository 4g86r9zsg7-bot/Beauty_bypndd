
'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '@/lib/supabase';
import {useClient} from '@/components/ClientProvider';
import ProductCard from '@/components/ProductCard';

export default function Favoris(){
  const {clientKey,favs}=useClient();
  const [items,setItems]=useState<any[]|null>(null);

  useEffect(()=>{
    let active=true;

    if(!clientKey)return ()=>{active=false};

    if(!favs.length){
      setItems([]);
      return ()=>{active=false};
    }

    setItems(null);

    supabase
      .from('products')
      .select('*,brands(name)')
      .in('id',favs)
      .eq('active',true)
      .then(({data})=>{
        if(active)setItems(data||[]);
      });

    return ()=>{active=false};
  },[clientKey,favs]);

  const heart=(
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blush text-plum shadow-sm">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.6 5 6.6 5c1.9 0 3.5 1 5.4 3 1.9-2 3.5-3 5.4-3 3 0 4.9 3 3.8 6.2-1.7 4.7-9.2 9.3-9.2 9.3z"/>
      </svg>
    </div>
  );

  const emptyState=(
    <div className="py-16 px-5 text-center">
      {heart}
      <p className="mt-6 font-serif text-2xl text-plum">
        Votre liste est encore vide
      </p>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink/60">
        Découvrez vos produits préférés et touchez le cœur pour les retrouver facilement ici.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex items-center justify-center rounded-full bg-rose px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:opacity-90"
      >
        Découvrir la boutique
      </Link>
    </div>
  );

  return (
    <div className="min-h-[55vh]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rose/10 pb-5">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-rose">
            Votre sélection personnelle
          </p>
          <h1 className="font-serif text-4xl text-plum">
            Mes favoris
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Retrouvez les produits que vous aimez.
          </p>
        </div>

        {clientKey&&items!==null&&items.length>0&&(
          <span className="rounded-full bg-blush px-4 py-2 text-xs font-semibold text-plum">
            {items.length} {items.length>1?'produits':'produit'}
          </span>
        )}
      </div>

      {!clientKey?(
        <div className="py-16 px-5 text-center">
          {heart}
          <p className="mt-6 font-serif text-2xl text-plum">
            Retrouvez vos favoris
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink/60">
            Votre liste est liée à cet appareil et accessible uniquement depuis cette session de navigation.
          </p>
          <p className="mt-5 text-xs text-ink/50">Chargement de votre espace sécurisé…</p>
        </div>
      ):items===null?(
        <div className="grid grid-cols-2 gap-3 py-8 md:grid-cols-4 md:gap-5">
          {Array.from({length:4}).map((_,i)=>(
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-2xl bg-blush/60"/>
              <div className="mt-3 h-3 w-3/4 rounded bg-blush/60"/>
              <div className="mt-2 h-3 w-1/2 rounded bg-blush/60"/>
            </div>
          ))}
        </div>
      ):items.length===0?(
        emptyState
      ):(
        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
          {items.map(p=>(
            <ProductCard key={p.id} p={p}/>
          ))}
        </div>
      )}
    </div>
  );
}
