
'use client';

import {useState} from 'react';
import {useCart} from '@/lib/cart';
import {eur} from '@/lib/supabase';

function productOf(it:any){
  return Array.isArray(it.products)?it.products[0]:it.products;
}

function variantsOf(p:any){
  return (Array.isArray(p?.variants)?p.variants:[])
    .map((v:any)=>typeof v==='string'?{name:v}:v);
}

function validItem(it:any){
  const p=productOf(it);
  if(!p||!p.active||['soldout','arrival','preorder'].includes(p.availability))return false;

  const variants=variantsOf(p);
  const qty=Math.max(1,Number(it.qty||1));

  if(it.variant){
    const v=variants.find((x:any)=>x.name===it.variant);
    return !!v&&v.status!=='soldout'&&Number(v.stock??0)>=qty;
  }

  if(variants.length){
    return variants.some((v:any)=>v.status!=='soldout'&&Number(v.stock??0)>0);
  }

  return Number(p.stock||0)>=qty;
}

function itemPrice(it:any,variant:string){
  const p=productOf(it);
  const v=variantsOf(p).find((x:any)=>x.name===variant);
  return Number(v?.price??p?.price??0);
}

function itemMax(it:any,variant:string){
  const p=productOf(it);
  const v=variantsOf(p).find((x:any)=>x.name===variant);
  return v?Number(v.stock??0):Number(p?.stock??0);
}

export default function ProductOfferUpsell({
  productId,
  offers
}:{
  productId:string;
  offers:any[];
}){
  const {add,lines}=useCart();
  const [selected,setSelected]=useState<Record<string,string>>({});

  const packs=(offers||[]).filter((o:any)=>
    o.kind==='pack'&&
    Number(o.pack_price)>0&&
    !(o.stock!=null&&Number(o.stock)-Number(o.sold||0)<=0)&&
    (o.offer_items||[]).some((it:any)=>
      String(productOf(it)?.id)===String(productId)
    )&&
    (o.offer_items||[]).every(validItem)
  );

  const freeOffers=(offers||[]).filter((o:any)=>
    o.kind==='buy_x_get_1'&&
    !(o.stock!=null&&Number(o.stock)-Number(o.sold||0)<=0)&&
    (o.offer_items||[]).some((it:any)=>
      String(productOf(it)?.id)===String(productId)
    )
  );

  if(!packs.length&&!freeOffers.length)return null;

  const cartQty=(it:any,variant:string)=>{
    const p=productOf(it);
    return lines
      .filter((l:any)=>
        String(l.id)===String(p?.id)&&
        (l.variant||'')===(variant||'')
      )
      .reduce((s:number,l:any)=>s+Number(l.qty||0),0);
  };

  const addProduct=(it:any,variant:string)=>{
    const p=productOf(it);
    if(!p)return;

    const max=itemMax(it,variant);
    const current=cartQty(it,variant);
    if(max<=current)return;

    add({
      id:p.id,
      name:p.name,
      price:itemPrice(it,variant),
      qty:1,
      image:Array.isArray(p.images)?p.images[0]:p.images||undefined,
      variant:variant||undefined,
      max,
      pre:false
    });
  };

  const imageOf=(p:any)=>Array.isArray(p?.images)?p.images[0]:p?.images;

  const productCard=(it:any,o:any,compact=false)=>{
    const p=productOf(it);
    if(!p)return null;

    const fixed=it.variant||'';
    const variants=variantsOf(p);
    const needsChoice=variants.length>0&&!fixed;
    const key=`${o.id}-${it.id}`;
    const choice=selected[key]??fixed;
    const chosen=variants.find((v:any)=>v.name===choice);
    const required=Math.max(1,Number(it.qty||1));
    const current=cartQty(it,choice);
    const missing=Math.max(0,required-current);
    const max=itemMax(it,choice);

    const available=needsChoice
      ?!!chosen&&chosen.status!=='soldout'&&Number(chosen.stock??0)>0
      :validItem(it);

    const image=imageOf(p);

    return(
      <div key={it.id} className={`group flex gap-3 rounded-2xl border border-[#eee2df] bg-white p-3 transition hover:border-[#d8b5bb] ${compact?'sm:flex-col':''}`}>
        <div className={`relative shrink-0 overflow-hidden rounded-xl bg-[#f8f1ed] ${compact?'h-28 w-24 sm:h-36 sm:w-full':'h-24 w-20 sm:h-28 sm:w-24'}`}>
          {image?(
            <img src={image} alt={p.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
          ):(
            <div className="flex h-full items-center justify-center text-[#c4a5a5]">
              <span className="text-2xl">✧</span>
            </div>
          )}
          {missing===0&&(
            <div className="absolute inset-0 flex items-center justify-center bg-[#593b48]/35">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-[#8d5366]">✓</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1">
            <p className="text-sm font-medium leading-snug text-[#593b48]">{p.name}</p>

            {fixed&&(
              <p className="mt-1 text-xs text-[#967b80]">Variante : {fixed}</p>
            )}

            <p className="mt-2 font-semibold text-[#80606a]">{eur(itemPrice(it,choice))}</p>

            {needsChoice&&(
              <select
                value={choice}
                onChange={e=>setSelected(s=>({...s,[key]:e.target.value}))}
                className="mt-2 w-full rounded-xl border border-[#eadccf] bg-[#fffaf8] px-3 py-2.5 text-xs text-[#593b48] outline-none focus:border-[#b47b82]"
              >
                <option value="">Choisir une variante</option>
                {variants.map((v:any)=>(
                  <option key={v.name} value={v.name} disabled={v.status==='soldout'||Number(v.stock??0)<=0}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-[#967b80]">
              {missing===0?'Quantité complète':`${current}/${required} dans le panier`}
            </p>

            {missing>0?(
              <button
                type="button"
                disabled={!available||(!choice&&needsChoice)||current>=max||max<=0}
                onClick={()=>addProduct(it,choice)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#8d5366] bg-[#8d5366] px-4 py-2 text-[11px] font-semibold text-white transition hover:border-[#593b48] hover:bg-[#593b48] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-base leading-none">+</span>
                Ajouter
              </button>
            ):(
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7eef0] px-3 py-2 text-[10px] font-semibold text-[#8d5366]">
                ✓ Ajouté
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return(
    <section className="mx-auto mt-8 max-w-7xl px-4 md:px-8">
      <div className="overflow-hidden rounded-[28px] border border-[#eadccf] bg-[#fffaf8] shadow-[0_12px_40px_rgba(89,59,72,0.06)]">

        <div className="px-5 pb-5 pt-7 text-center sm:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b47b82]">
            BEAUTY_BYP NDD
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[#593b48] sm:text-3xl">
            Complétez votre sélection
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[#806d70] sm:text-sm">
            Découvrez les produits associés et profitez de nos offres exclusives.
          </p>
          <div className="mx-auto mt-4 h-px w-14 bg-[#d8b5bb]"/>
        </div>

        {packs.map((o:any)=>{
          const regularTotal=(o.offer_items||[]).reduce((sum:number,it:any)=>{
            const key=`${o.id}-${it.id}`;
            const variant=selected[key]??it.variant??'';
            return sum+itemPrice(it,variant)*Math.max(1,Number(it.qty||1));
          },0);
          const saving=Math.max(0,regularTotal-Number(o.pack_price));

          return(
            <div key={`pack-${o.id}`} className="mx-4 mb-5 overflow-hidden rounded-2xl border border-[#eadccf] bg-white sm:mx-7">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#f8eeee] to-[#fff8f3] px-4 py-4 sm:px-5">
                <div>
                  <span className="inline-block rounded-full bg-white px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8d5366]">
                    Offre exclusive
                  </span>
                  <h3 className="mt-2 font-serif text-xl text-[#593b48]">{o.title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-[#967b80]">Prix du pack</p>
                  <p className="font-serif text-2xl text-[#593b48]">{eur(Number(o.pack_price))}</p>
                  {saving>0&&(
                    <p className="text-[10px] font-semibold text-[#8d5366]">
                      Économisez {eur(saving)}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#593b48]">Les produits de votre pack</p>
                  <span className="text-[10px] text-[#967b80]">{(o.offer_items||[]).length} produit(s)</span>
                </div>

                <div className="space-y-3">
                  {(o.offer_items||[]).map((it:any)=>productCard(it,o))}
                </div>

                <div className="mt-4 rounded-xl bg-[#fff8f5] px-4 py-3 text-center">
                  <p className="text-xs leading-relaxed text-[#806d70]">
                    Ajoutez les produits manquants : le prix spécial sera appliqué automatiquement dans votre panier.
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {freeOffers.map((o:any)=>{
          const items=(o.offer_items||[]).filter((it:any)=>
            String(productOf(it)?.id)!==String(productId)&&validItem(it)
          );

          if(!items.length)return null;

          return(
            <div key={`free-${o.id}`} className="mx-4 mb-5 overflow-hidden rounded-2xl border border-[#eadccf] bg-white sm:mx-7">
              <div className="bg-gradient-to-r from-[#f8eeee] to-[#fff8f3] px-4 py-4 sm:px-5">
                <span className="inline-block rounded-full bg-white px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8d5366]">
                  Offre spéciale
                </span>
                <h3 className="mt-2 font-serif text-xl text-[#593b48]">{o.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#806d70]">
                  {`Achetez ${Number(o.buy_qty||1)} article(s) parmi cette sélection et profitez d’un article offert. La réduction sera calculée automatiquement dans votre panier.`}
                </p>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                {items.map((it:any)=>productCard(it,o,true))}
              </div>
            </div>
          );
        })}

        <div className="px-5 pb-5 text-center">
          <p className="text-[9px] tracking-wider text-[#b49b9c]">
            BEAUTY_BYP NDD · BEAUTÉ & ÉLÉGANCE
          </p>
        </div>
      </div>
    </section>
  );
}
