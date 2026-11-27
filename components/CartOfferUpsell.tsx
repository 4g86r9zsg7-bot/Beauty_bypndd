
'use client';

import {useEffect,useState} from 'react';
import {useCart} from '@/lib/cart';
import {supabase,eur} from '@/lib/supabase';

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
      v.status!=='soldout'&&Number(v.stock??0)>=qty
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

function cartQuantity(lines:any[],it:any,variant:string){
  const p=productOf(it);
  if(!p)return 0;

  return lines.reduce((sum:number,l:any)=>{
    if(l.offer||String(l.id)!==String(p.id))return sum;
    if((l.variant||'')!==(variant||''))return sum;
    return sum+Number(l.qty||0);
  },0);
}

export default function CartOfferUpsell(){
  const {lines,add}=useCart();
  const [offers,setOffers]=useState<any[]>([]);
  const [selected,setSelected]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true);

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

    return()=>{
      cancelled=true;
    };
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
      items.every(validItem);
  });

  const freeOffers=offers.filter((o:any)=>{
    if(o.kind!=='buy_x_get_1')return false;
    if(o.stock!=null&&Number(o.stock)-Number(o.sold||0)<=0)return false;

    const items=o.offer_items||[];
    if(!items.length)return false;

    const total=items.reduce((sum:number,it:any)=>{
      const p=productOf(it);
      if(!p)return sum;

      const variants=variantsOf(p);
      const variant=it.variant||'';

      if(variant)return sum+cartQuantity(lines,it,variant);

      if(variants.length){
        return sum+variants.reduce((s:number,v:any)=>
          s+cartQuantity(lines,it,v.name),0
        );
      }

      return sum+cartQuantity(lines,it,'');
    },0);

    const required=Math.max(1,Number(o.buy_qty||1))+1;
    return total>0&&total<required;
  });

  if(!packs.length&&!freeOffers.length)return null;

  const addProduct=(it:any,variant:string)=>{
    const p=productOf(it);
    if(!p)return;

    const max=itemMax(it,variant);
    const current=cartQuantity(lines,it,variant);
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

  const productCard=(it:any,o:any)=>{
    const p=productOf(it);
    if(!p)return null;

    const variants=variantsOf(p);
    const fixed=it.variant||'';
    const key=`${o.id}-${it.id}`;
    const needsChoice=variants.length>0&&!fixed;
    const choice=selected[key]??fixed;
    const chosen=variants.find((v:any)=>v.name===choice);
    const required=Math.max(1,Number(it.qty||1));

    const current=fixed
      ?cartQuantity(lines,it,fixed)
      :needsChoice&&choice
        ?cartQuantity(lines,it,choice)
        :!variants.length
          ?cartQuantity(lines,it,'')
          :variants.reduce((sum:number,v:any)=>
            sum+cartQuantity(lines,it,v.name),0);

    const missing=Math.max(0,required-current);
    const max=choice||fixed
      ?itemMax(it,choice||fixed)
      :Number(p.stock||0);

    const available=needsChoice
      ?!!chosen&&chosen.status!=='soldout'&&Number(chosen.stock??0)>0
      :validItem(it);

    const image=imageOf(p);

    return(
      <div key={it.id} className="group flex min-w-0 gap-3 rounded-2xl border border-[#eee2df] bg-white p-3 transition duration-200 hover:border-[#d8b5bb] hover:shadow-[0_6px_20px_rgba(89,59,72,0.06)]">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f8f1ed] sm:h-28 sm:w-24">
          {image?(
            <img src={image} alt={p.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
          ):(
            <div className="flex h-full items-center justify-center text-2xl text-[#c4a5a5]">✧</div>
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

            <p className="mt-2 font-semibold text-[#80606a]">
              {eur(itemPrice(it,choice||fixed))}
            </p>

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
                onClick={()=>addProduct(it,choice||fixed)}
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
    <section className="overflow-hidden rounded-[28px] border border-[#eadccf] bg-[#fffaf8] shadow-[0_12px_40px_rgba(89,59,72,0.06)]">

      <div className="px-5 pb-4 pt-6 text-center sm:px-8 sm:pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b47b82]">
            SÉLECTION BEAUTÉ
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[#593b48] sm:text-3xl">
            Complétez votre sélection
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[#806d70] sm:text-sm">
            Retrouvez les produits de votre offre et profitez du prix avantageux.
          </p>
          <div className="mx-auto mt-3 h-px w-12 bg-[#d8b5bb]"/>
        </div>

      {packs.map((o:any)=>{
        const items=o.offer_items||[];

        const complete=items.every((it:any)=>{
          const p=productOf(it);
          if(!p)return false;

          const variants=variantsOf(p);
          const variant=it.variant||'';

          if(variant)return cartQuantity(lines,it,variant)>=Number(it.qty||1);

          if(variants.length){
            return variants.reduce((sum:number,v:any)=>
              sum+cartQuantity(lines,it,v.name),0
            )>=Number(it.qty||1);
          }

          return cartQuantity(lines,it,'')>=Number(it.qty||1);
        });

        const regularTotal=items.reduce((sum:number,it:any)=>{
          const p=productOf(it);
          if(!p)return sum;

          const variants=variantsOf(p);
          const variant=it.variant||'';
          const price=variant
            ?itemPrice(it,variant)
            :variants.length
              ?Math.min(...variants.map((v:any)=>Number(v.price??p.price??0)))
              :Number(p.price||0);

          return sum+price*Math.max(1,Number(it.qty||1));
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
                {saving>0&&(
                  <p className="text-[11px] text-[#b49b9c] line-through">{eur(regularTotal)}</p>
                )}
                <p className="font-serif text-2xl font-semibold text-[#593b48]">{eur(Number(o.pack_price))}</p>
                {saving>0&&(
                  <span className="mt-1 inline-flex rounded-full bg-[#f7eef0] px-2.5 py-1 text-[10px] font-semibold text-[#8d5366]">
                    Vous économisez {eur(saving)}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#593b48]">Les produits de votre pack</p>
                <span className="rounded-full bg-[#f7eef0] px-3 py-1 text-[10px] font-semibold text-[#8d5366]">
                  {complete?'Pack complet':'À compléter'}
                </span>
              </div>

              <div className="space-y-3">
                {items.map((it:any)=>productCard(it,o))}
              </div>

              <div className="mt-4 rounded-xl bg-[#fff8f5] px-4 py-3 text-center">
                <p className="text-xs leading-relaxed text-[#806d70]">
                  {complete
                    ?'Votre pack est complet. Son prix spécial sera calculé automatiquement.'
                    :'Ajoutez les produits manquants : le prix spécial sera appliqué automatiquement lorsque toutes les quantités seront réunies.'}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {freeOffers.map((o:any)=>{
        const items=(o.offer_items||[]).filter(validItem);
        if(!items.length)return null;

        const total=items.reduce((sum:number,it:any)=>{
          const p=productOf(it);
          if(!p)return sum;

          const variants=variantsOf(p);

          if(it.variant)return sum+cartQuantity(lines,it,it.variant);

          if(variants.length){
            return sum+variants.reduce((s:number,v:any)=>
              s+cartQuantity(lines,it,v.name),0
            );
          }

          return sum+cartQuantity(lines,it,'');
        },0);

        const required=Math.max(1,Number(o.buy_qty||1))+1;
        const missing=Math.max(0,required-total);

        return(
          <div key={`free-${o.id}`} className="mx-4 mb-5 overflow-hidden rounded-2xl border border-[#eadccf] bg-white sm:mx-7">
            <div className="bg-gradient-to-r from-[#f8eeee] to-[#fff8f3] px-4 py-4 sm:px-5">
              <span className="inline-block rounded-full bg-white px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8d5366]">
                Offre spéciale
              </span>

              <h3 className="mt-2 font-serif text-xl text-[#593b48]">{o.title}</h3>

              <p className="mt-2 text-xs leading-relaxed text-[#806d70]">
                {`Ajoutez encore ${missing} article${missing>1?'s':''} de cette sélection pour profiter de votre offre. La réduction sera calculée automatiquement.`}
              </p>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              {items.map((it:any)=>productCard(it,o))}
            </div>
          </div>
        );
      })}

      
    </section>
  );
}
