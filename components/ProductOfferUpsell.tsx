
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
    return variants.some((v:any)=>
      v.status!=='soldout'&&Number(v.stock??0)>0
    );
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

  return(
    <section className="mx-auto mt-8 max-w-7xl px-4 md:px-8">
      <div className="overflow-hidden rounded-3xl border border-[#eadccf] bg-gradient-to-br from-[#fff9f7] via-white to-[#fffaf1] p-5 shadow-sm sm:p-7">

        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b47b82]">
            Beauty_bypndd
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[#593b48]">
            Complétez votre offre
          </h2>
          <p className="mt-2 text-sm text-[#806d70]">
            Ajoutez les produits manquants pour profiter automatiquement de nos offres.
          </p>
        </div>

        {packs.map((o:any)=>(
          <div key={`pack-${o.id}`} className="mt-6 rounded-2xl border border-[#eadccf] bg-white p-4 sm:p-5">

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b47b82]">
              Pack exclusif
            </p>

            <h3 className="mt-2 font-serif text-xl text-[#593b48]">
              {o.title}
            </h3>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#fff8f5] p-3">
              <div>
                <p className="text-xs text-[#806d70]">
                  Prix fixe du pack
                </p>
                <p className="font-serif text-2xl text-[#593b48]">
                  {eur(Number(o.pack_price))}
                </p>
              </div>
              <span className="rounded-full bg-[#f5e5e6] px-3 py-2 text-[10px] font-semibold text-[#8d5366]">
                Remise automatique
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {(o.offer_items||[]).map((it:any)=>{
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

                const currentProduct=String(p.id)===String(productId);
                const image=Array.isArray(p.images)?p.images[0]:p.images;

                return(
                  <div key={it.id} className="flex gap-3 rounded-xl border border-[#f0e7e2] p-3">

                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f8f1ed]">
                      {image&&(
                        <img
                          src={image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="text-sm font-medium text-[#593b48]">
                        {p.name}
                      </p>

                      {fixed&&(
                        <p className="mt-1 text-xs text-[#806d70]">
                          Variante : {fixed}
                        </p>
                      )}

                      <p className="mt-1 text-sm font-semibold text-[#80606a]">
                        {eur(itemPrice(it,choice))}
                      </p>

                      {needsChoice&&(
                        <select
                          value={choice}
                          onChange={e=>setSelected(s=>({
                            ...s,
                            [key]:e.target.value
                          }))}
                          className="mt-2 w-full rounded-lg border border-[#eadccf] bg-white px-2 py-2 text-xs"
                        >
                          <option value="">Choisir une variante</option>
                          {variants.map((v:any)=>(
                            <option
                              key={v.name}
                              value={v.name}
                              disabled={v.status==='soldout'||Number(v.stock??0)<=0}
                            >
                              {v.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-[#806d70]">
                          {missing===0
                            ?'Quantité complète dans le panier'
                            :`${current}/${required} dans le panier`}
                        </p>

                        {missing>0&&(
                          <button
                            type="button"
                            disabled={!available||!choice&&needsChoice||current>=max||max<=0}
                            onClick={()=>addProduct(it,choice)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8d5366] text-xl font-medium text-white transition hover:bg-[#593b48] disabled:opacity-40"
                            aria-label={`Ajouter ${p.name}`}
                          >
                            +
                          </button>
                        )}

                        {missing===0&&(
                          <span className="text-xs font-semibold text-[#8d5366]">
                            <span aria-hidden="true">✓</span> Ajouté
                          </span>
                        )}
                      </div>

                      {currentProduct&&missing>0&&(
                        <p className="mt-1 text-[10px] text-[#9b7a80]">
                          Ajoutez également ce produit avec le bouton de sa fiche.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-[#806d70]">
              Le prix du pack sera calculé automatiquement lorsque tous les produits requis seront réunis dans votre panier.
            </p>
          </div>
        ))}

        {freeOffers.map((o:any)=>{
          const items=(o.offer_items||[]).filter((it:any)=>
            String(productOf(it)?.id)!==String(productId)&&validItem(it)
          );

          if(!items.length)return null;

          return(
            <div key={`free-${o.id}`} className="mt-6 rounded-2xl border border-[#eadccf] bg-white p-4 sm:p-5">

              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b47b82]">
                Offre spéciale
              </p>

              <h3 className="mt-2 font-serif text-xl text-[#593b48]">
                {o.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#806d70]">
                {`Achetez ${Number(o.buy_qty||1)} article(s) parmi cette sélection et profitez d’un article offert. La réduction sera calculée automatiquement dans votre panier.`}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {items.map((it:any)=>{
                  const p=productOf(it);
                  const variants=variantsOf(p);
                  const fixed=it.variant||'';
                  const key=`${o.id}-${it.id}`;
                  const choice=selected[key]??fixed;
                  const needsChoice=variants.length>0&&!fixed;
                  const chosen=variants.find((v:any)=>v.name===choice);
                  const max=itemMax(it,choice);
                  const current=cartQty(it,choice);
                  const available=needsChoice
                    ?!!chosen&&chosen.status!=='soldout'&&Number(chosen.stock??0)>0
                    :validItem(it);

                  const image=Array.isArray(p.images)?p.images[0]:p.images;

                  return(
                    <div key={it.id} className="flex gap-3 rounded-xl border border-[#f0e7e2] p-3">
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f8f1ed]">
                        {image&&(
                          <img
                            src={image}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="line-clamp-2 text-sm font-medium text-[#593b48]">
                          {p.name}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#80606a]">
                          {eur(itemPrice(it,choice))}
                        </p>

                        {needsChoice&&(
                          <select
                            value={choice}
                            onChange={e=>setSelected(s=>({
                              ...s,
                              [key]:e.target.value
                            }))}
                            className="mt-2 w-full rounded-lg border border-[#eadccf] bg-white px-2 py-2 text-xs"
                          >
                            <option value="">Choisir une variante</option>
                            {variants.map((v:any)=>(
                              <option
                                key={v.name}
                                value={v.name}
                                disabled={v.status==='soldout'||Number(v.stock??0)<=0}
                              >
                                {v.name}
                              </option>
                            ))}
                          </select>
                        )}

                        <button
                          type="button"
                          disabled={!available||(!choice&&needsChoice)||current>=max||max<=0}
                          onClick={()=>addProduct(it,choice)}
                          className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#8d5366] text-xl text-white disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      </div>
    </section>
  );
}
