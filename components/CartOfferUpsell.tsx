
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

      if(variant){
        return sum+cartQuantity(lines,it,variant);
      }

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
          Ajoutez les articles manquants et profitez automatiquement de vos avantages.
        </p>
      </div>

      {packs.map((o:any)=>{
        const items=o.offer_items||[];

        const complete=items.every((it:any)=>{
          const p=productOf(it);
          if(!p)return false;

          const variants=variantsOf(p);
          const variant=it.variant||'';

          if(variant){
            return cartQuantity(lines,it,variant)>=Number(it.qty||1);
          }

          if(variants.length){
            return variants.reduce((sum:number,v:any)=>
              sum+cartQuantity(lines,it,v.name),0
            )>=Number(it.qty||1);
          }

          return cartQuantity(lines,it,'')>=Number(it.qty||1);
        });

        return(
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
                {complete?'Pack complet':'Remise automatique'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((it:any)=>{
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

                const image=Array.isArray(p.images)?p.images[0]:p.images;

                const available=needsChoice
                  ?!!chosen&&chosen.status!=='soldout'&&Number(chosen.stock??0)>0
                  :validItem(it);

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
                        {eur(itemPrice(it,choice||fixed))}
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
                            ?'Quantité complète'
                            :`${current}/${required} dans le panier`}
                        </p>

                        {missing>0&&(
                          <button
                            type="button"
                            disabled={!available||(!choice&&needsChoice)||current>=max||max<=0}
                            onClick={()=>addProduct(it,choice||fixed)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8d5366] text-xl font-medium text-white transition hover:bg-[#593b48] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Ajouter ${p.name}`}
                          >
                            +
                          </button>
                        )}

                        {missing===0&&(
                          <span className="text-xs font-semibold text-[#8d5366]">
                            ✓ Ajouté
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-[#806d70]">
              {complete
                ?'Votre pack est complet. Son prix sera calculé automatiquement dans le panier.'
                :'Ajoutez les produits manquants : la réduction du pack sera calculée automatiquement lorsque toutes les quantités seront réunies.'}
            </p>
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

          if(it.variant){
            return sum+cartQuantity(lines,it,it.variant);
          }

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
          <div key={`free-${o.id}`} className="mt-6 rounded-2xl border border-[#eadccf] bg-white p-4 sm:p-5">

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b47b82]">
              Offre spéciale
            </p>

            <h3 className="mt-2 font-serif text-xl text-[#593b48]">
              {o.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-[#806d70]">
              Ajoutez encore {missing} article{missing>1?'s':''} de cette sélection pour profiter de votre offre. La réduction sera calculée automatiquement.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {items.map((it:any)=>{
                const p=productOf(it);
                if(!p)return null;

                const variants=variantsOf(p);
                const fixed=it.variant||'';
                const key=`${o.id}-${it.id}`;
                const needsChoice=variants.length>0&&!fixed;
                const choice=selected[key]??fixed;
                const chosen=variants.find((v:any)=>v.name===choice);
                const max=choice||fixed
                  ?itemMax(it,choice||fixed)
                  :Number(p.stock||0);

                const current=choice||fixed
                  ?cartQuantity(lines,it,choice||fixed)
                  :!variants.length
                    ?cartQuantity(lines,it,'')
                    :variants.reduce((sum:number,v:any)=>
                      sum+cartQuantity(lines,it,v.name),0);

                const image=Array.isArray(p.images)?p.images[0]:p.images;
                const available=needsChoice
                  ?!!chosen&&chosen.status!=='soldout'&&Number(chosen.stock??0)>0
                  :validItem(it);

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
                        {eur(itemPrice(it,choice||fixed))}
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
                        disabled={!available||(!choice&&needsChoice)||current>=max||max<=0||missing<=0}
                        onClick={()=>addProduct(it,choice||fixed)}
                        className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#8d5366] text-xl text-white transition hover:bg-[#593b48] disabled:opacity-40"
                        aria-label={`Ajouter ${p.name}`}
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

    </section>
  );
}
