
'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '@/lib/supabase';
import {useClient} from '@/components/ClientProvider';
import ProductCard from '@/components/ProductCard';

export default function Favoris(){
  const {clientKey,favs,useSyncKey}=useClient();
  const [items,setItems]=useState<any[]|null>(null);
  const [syncOpen,setSyncOpen]=useState(false);
  const [syncInput,setSyncInput]=useState('');
  const [syncMessage,setSyncMessage]=useState('');

  useEffect(()=>{
    let active=true;

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
  },[favs]);

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

      <section className="mt-5 rounded-2xl border border-sand bg-white p-4 sm:p-5">
        <button type="button" onClick={()=>setSyncOpen(v=>!v)} aria-expanded={syncOpen} className="text-sm font-semibold text-plum underline">
          Synchroniser mes favoris sur un autre appareil
        </button>
        {syncOpen&&<div className="mt-3 space-y-3">
          <p className="text-xs leading-5 text-ink/60">Le code donne accès à cette sélection. Copiez-le uniquement sur un appareil de confiance. Les notifications de commande se récupèrent avec le téléphone et le code secret de la commande.</p>
          <label className="block text-xs font-medium">Votre code de synchronisation
            <input readOnly value={clientKey} className="mt-1 w-full rounded-xl border border-sand bg-blush/20 px-3 py-3 font-mono text-sm"/>
          </label>
          <button type="button" disabled={!clientKey} onClick={async()=>{try{await navigator.clipboard.writeText(clientKey);setSyncMessage('Code copié.');}catch{setSyncMessage('Copiez le code affiché manuellement.');}}} className="rounded-full bg-plum px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50">Copier le code</button>
          <div className="border-t border-sand pt-3">
            <label className="block text-xs font-medium">Utiliser un code d’un autre appareil
              <input value={syncInput} onChange={e=>setSyncInput(e.target.value)} autoComplete="off" className="mt-1 w-full rounded-xl border border-sand px-3 py-3 font-mono text-sm" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/>
            </label>
            <button type="button" onClick={async()=>{const result=await useSyncKey(syncInput);setSyncMessage(result.error?.message||'Favoris synchronisés.');if(!result.error)setSyncInput('');}} className="mt-2 rounded-full border border-plum px-5 py-2.5 text-xs font-semibold text-plum">Associer cet appareil</button>
          </div>
          {syncMessage&&<p role="status" className="text-xs text-plum">{syncMessage}</p>}
        </div>}
      </section>

      {!clientKey?(
        <p className="py-16 text-center text-sm text-ink/60" role="status">Chargement de votre sélection…</p>
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
