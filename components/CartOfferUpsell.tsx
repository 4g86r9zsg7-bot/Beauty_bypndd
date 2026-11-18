
'use client';

import {useEffect,useState} from 'react';
import {useCart} from '@/lib/cart';
import {supabase,eur} from '@/lib/supabase';
import OfferBuy from '@/components/OfferBuy';

function productOf(it:any){
  return Array.isArray(it.products)?it.products[0]:it.products;
}

function variantsOf(p:any){
  return (Array.isArray(p?.variants)?p.variants:[])
    .map((v:any)=>typeof v==='string'?{name:v}:v);
}

function availableVariants(p:any){
  return variantsOf(p).filter((v:any)=>
    v.status!=='soldout'&&Number(v.stock??0)>0
  );
}

function validItem(it:any){
  const p=productOf(it);

  if(!p||!p.active||['soldout','arrival','preorder'].includes(p.availability)){
    return false;
  }

  const variants=variantsOf(p);

  if(it.variant){
    const v=variants.find((x:any)=>x.name===it.variant);
    return !!v&&v.status!=='soldout'&&Number(v.stock??0)>0;
  }

  if(variants.length)return availableVariants(p).length>0;

  return Number(p.stock||0)>0;
}

function cartQuantity(lines:any[],it:any){
  const p=productOf(it);
  if(!p)return 0;

  return lines.reduce((sum:number,l:any)=>{
    if(l.offer||String(l.id)!==String(p.id))return sum;

    if(it.variant&&(l.variant||'')!==it.variant)return sum;

    return sum+Number(l.qty||0);
  },0);
}

export default function CartOfferUpsell(){
  const {lines,add}=useCart();
  const [offers,setOffers]=useState<any[]>([]);
  const [selected,setSelected]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true);
  const [added,setAdded]=useState<string[]>([]);

  useEffect(()=>{
    let cancelled=false;

    async function load(){
      const now=new Date().toISOString();

      const {data,error}=await supabase
        .from('offers')
        .select('*, offer_items(id,variant,qty,products(*))')
        .eq('active',true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order('position',{nullsFirst:false})
        .order('created_at',{ascending:false});

      if(!cancelled){
        setOffers(error?[]:data||[]);
        setLoading(false);
      }
    }

    load();

    return()=>{cancelled=true};
  },[]);

  if(loading||!lines.length||!offers.length)return null;

  const productLines=lines.filter((l:any)=>!l.offer);

  if(!productLines.length)return null;

  const packs=offers.filter((o:any)=>{
    if(o.kind!=='pack'||Number(o.pack_price)<=0)return false;

    if(o.stock!=null&&Number(o.stock)-Number(o.sold||0)<=0)return false;

    const items=o.offer_items||[];

    return items.length>0&&
      items.some((it:any)=>productLines.some((l:any)=>
        String(l.id)===String(productOf(it)?.id)
      ))&&
      items.every(validItem)&&
      !lines.some((l:any)=>l.offer===String(o.id));
  });

  const freeOffers=offers.filter((o:any)=>{
    if(o.kind!=='buy_x_get_1')return false;

    if(o.stock!=null&&Number(o.stock)-Number(o.sold||0)<=0)return false;

    const items=o.offer_items||[];
    if(!items.length)return false;

    const total=items.reduce((sum:number,it:any)=>
      sum+cartQuantity(lines,it),0
    );

    const required=Math.max(1,Number(o.buy_qty||1))+1;

    return total>0&&total<required;
  });

  if(!packs.length&&!freeOffers.length)return null;

  const addProduct=(offerId:string,it:any,variant:string)=>{
    const p=productOf(it);
    if(!p)return;

    const chosen=variantsOf(p).find((v:any)=>v.name===variant);
    const price=Number(chosen?.price??p.price);
    const max=chosen
      ?Number(chosen.stock??0)
      :Number(p.stock??0);

    if(max<=0)return;

    add({
      id:p.id,
      name:p.name,
      price,
      qty:1,
      image:Array.isArray(p.images)?p.images[0]:p.images||undefined,
      variant:variant||undefined,
      max,
      pre:false
    });

    setAdded(a=>{
      const key=`${offerId}:${p.id}:${variant}`;
      return a.includes(key)?a:[...a,key];
    });
  };

  return(
    <section className="rounded-2xl border border-[#eadccf] bg-gradient-to-br from-[#fff9f7] via-white to-[#fffaf1] p-5 shadow-sm sm:p-6">
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b47b82]">
          Beauty_bypndd
        </p>

        <h2 className="mt-2 font-serif text-2xl text-[#593b48]">
          Profitez de nos offres
        </h2>

        <p className="mt-2 text-sm text-[#806d70]">
          Ajoutez les articles manquants et profitez de vos avantages.
        </p>
      </div>

      {freeOffers.map((o:any)=>{
        const items=(o.offer_items||[]).filter((it:any)=>{
          if(!validItem(it))return false;

          const p=productOf(it);
          return !lines.some((l:any)=>
            !l.offer&&String(l.id)===String(p?.id)&&
            (!it.variant||(l.variant||'')===it.variant)
          );
        });

        if(!items.length)return null;

        const total=(o.offer_items||[]).reduce((sum:number,it:any)=>
          sum+cartQuantity(lines,it),0
        );

        const required=Math.max(1,Number(o.buy_qty||1))+1;
        const missing=Math.max(0,required-total);

        return(
          <div key={`free-${o.id}`} className="mt-6 rounded-2xl border border-[#eadccf] bg-white p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b47b82]">
              Offre spéciale
            </p>

            <h3 className="mt-2 font-serif text-xl text-[#593b48]">
              {o.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-[#806d70]">
              Ajoutez encore {missing} article{missing>1?'s':''} de cette sélection pour profiter de votre offre.
              La réduction sera calculée automatiquement dans votre panier.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {items.map((it:any)=>{
                const p=productOf(it);
                const variants=variantsOf(p);
                const fixed=it.variant||'';
                const keySelect=`${o.id}-${it.id}`;
                const choice=selected[keySelect]??fixed;
                const needsChoice=variants.length>0&&!fixed;
                const chosen=variants.find((v:any)=>v.name===choice);

                const available=needsChoice
                  ?!!chosen&&chosen.status!=='soldout'&&Number(chosen.stock??0)>0
                  :validItem(it);

                const max=chosen
                  ?Number(chosen.stock??0)
                  :Number(p.stock??0);

                const key=`${o.id}:${p.id}:${choice}`;
                const wasAdded=added.includes(key);
                const price=chosen
                  ?Number(chosen.price??p.price)
                  :Number(p.price??0);

                return(
                  <div key={it.id} className="flex gap-3 rounded-xl border border-[#f0e7e2] p-3">
                    <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f8f1ed]">
                      {(Array.isArray(p.images)?p.images[0]:p.images)&&(
                        <img
                          src={Array.isArray(p.images)?p.images[0]:p.images}
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
                        {eur(price)}
                      </p>

                      {needsChoice&&(
                        <select
                          value={choice}
                          onChange={e=>setSelected(s=>({
                            ...s,[keySelect]:e.target.value
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
                        disabled={!available||wasAdded||max<=0}
                        onClick={()=>addProduct(o.id,it,choice)}
                        className="mt-auto rounded-full bg-[#8d5366] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#593b48] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {wasAdded?'Ajouté au panier':'Ajouter au panier'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {packs.map((o:any)=>(
        <div key={`pack-${o.id}`} className="mt-6 rounded-2xl border border-[#eadccf] bg-white p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b47b82]">
            Pack exclusif
          </p>

          <h3 className="mt-2 font-serif text-xl text-[#593b48]">
            {o.title}
          </h3>

          <div className="mt-3 space-y-2">
            {(o.offer_items||[]).map((it:any)=>(
              <p key={it.id} className="text-sm text-[#6e5a60]">
                • {productOf(it)?.name}
                {it.variant?` – ${it.variant}`:''}
              </p>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e7e2] pt-4">
            <div>
              <p className="text-xs text-[#806d70]">Prix du pack</p>
              <p className="font-serif text-2xl text-[#593b48]">
                {eur(Number(o.pack_price))}
              </p>
            </div>

            <div className="w-full sm:w-64">
              <OfferBuy o={{
                id:String(o.id),
                title:o.title,
                price:Number(o.pack_price),
                image:o.image||productOf(o.offer_items?.[0])?.images?.[0],
                max:o.stock!=null?Math.max(0,Number(o.stock)-Number(o.sold||0)):null
              }}/>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
