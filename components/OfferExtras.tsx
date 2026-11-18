
'use client';

import {useEffect,useState} from 'react';

type OfferItem={
  id:string;
  name:string;
  image?:string|null;
  qty:number;
  variant?:string|null;
  priceLabel:string;
};

export function OfferCountdown({endsAt}:{endsAt:string}){
  const [remaining,setRemaining]=useState<number|null>(null);

  useEffect(()=>{
    const update=()=>{
      setRemaining(Math.max(0,new Date(endsAt).getTime()-Date.now()));
    };
    update();
    const timer=setInterval(update,1000);
    return ()=>clearInterval(timer);
  },[endsAt]);

  if(remaining===null||remaining<=0)return null;

  const units=[
    {value:Math.floor(remaining/86400000),label:'Jours'},
    {value:Math.floor((remaining%86400000)/3600000),label:'Heures'},
    {value:Math.floor((remaining%3600000)/60000),label:'Min'},
    {value:Math.floor((remaining%60000)/1000),label:'Sec'}
  ];

  return (
    <div className="mt-4 rounded-2xl border border-[#C6A15B]/40 bg-white/80 p-3">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-plum/70">
        Cette offre se termine dans
      </p>
      <div className="flex items-center justify-center gap-2">
        {units.map((unit,i)=>(
          <div key={unit.label} className="flex items-center gap-2">
            <div className="min-w-[48px] rounded-xl bg-[#7A1F4A] px-2 py-2 text-center text-white">
              <span className="block font-serif text-xl leading-none tabular-nums">
                {String(unit.value).padStart(2,'0')}
              </span>
              <span className="mt-1 block text-[9px] uppercase tracking-wider text-white/75">
                {unit.label}
              </span>
            </div>
            {i!==units.length-1&&<span className="font-semibold text-[#C6A15B]">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OfferDetails({
  title,
  description,
  items
}:{
  title:string;
  description?:string|null;
  items:OfferItem[];
}){
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    if(!open)return;
    const onKey=(e:KeyboardEvent)=>{
      if(e.key==='Escape')setOpen(false);
    };
    document.addEventListener('keydown',onKey);
    return ()=>document.removeEventListener('keydown',onKey);
  },[open]);

  return (
    <>
      <button
        type="button"
        onClick={()=>setOpen(true)}
        className="mt-3 w-full rounded-full border border-[#C6A15B] bg-white px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-plum transition hover:bg-[#fdf3f7]"
      >
        Voir le contenu du pack
      </button>

      {open&&(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#24131d]/65 p-3 backdrop-blur-sm"
          onClick={()=>setOpen(false)}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-details-title"
            className="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#fffdfd] p-5 shadow-2xl sm:p-7"
            onClick={e=>e.stopPropagation()}
          >
            <button
              type="button"
              onClick={()=>setOpen(false)}
              aria-label="Fermer"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#ead9e0] text-xl text-plum hover:bg-[#fdf3f7]"
            >
              ×
            </button>

            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C6A15B]">
              Beauty_bypndd
            </p>
            <h3 id="offer-details-title" className="mt-2 pr-8 font-serif text-3xl text-plum">
              {title}
            </h3>
            {description&&(
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {description}
              </p>
            )}

            <div className="my-5 h-px bg-gradient-to-r from-transparent via-[#C6A15B]/60 to-transparent"/>

            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-plum/65">
              Les produits inclus dans votre pack
            </p>

            <div className="space-y-3">
              {items.map(item=>(
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#f0dce4] bg-white p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#fdf3f7]">
                    {item.image&&(
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover"/>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-plum">{item.name}</p>
                    {item.variant&&<p className="mt-1 text-xs text-ink/60">{item.variant}</p>}
                    <p className="mt-1 text-xs text-ink/60">Quantité : {item.qty}</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-plum">
                    {item.priceLabel}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={()=>setOpen(false)}
              className="mt-6 w-full rounded-full bg-[#7A1F4A] px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#64183c]"
            >
              Continuer mes achats
            </button>
          </section>
        </div>
      )}
    </>
  );
}
