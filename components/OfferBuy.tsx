'use client';
import {useState} from 'react';
import {useCart} from '@/lib/cart';

export default function OfferBuy({o}:{o:{id:string;title:string;price:number;image?:string|null;max?:number|null}}){
  const {add}=useCart();
  const [done,setDone]=useState(false);
  return (
    <div className="mt-4">
      <button type="button" onClick={()=>{add({id:`offer:${o.id}`,name:o.title,price:o.price,qty:1,image:o.image||undefined,offer:o.id,max:o.max??null});setDone(true)}}
        className="block w-full rounded-full bg-rose py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white">Ajouter le pack au panier</button>
      {done&&<p className="mt-2 text-center text-sm">Ajouté. <a href="/panier" className="underline">Voir le panier</a></p>}
    </div>
  );
}
