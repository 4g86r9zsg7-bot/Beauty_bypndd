'use client';

import {useEffect,useRef} from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

type Tone={band:string;kicker:string;center?:boolean;btn:string;line:string};
const OUT='border-plum text-plum hover:bg-plum hover:text-white';
const TONES:Record<string,Tone>={
  nouveautes:{band:'',kicker:'Tout juste arrivé',btn:OUT,line:'bg-rose'},
  immediat:{band:'bg-[#f6efe6]',kicker:'Livraison en 24 à 48 h',btn:OUT,line:'bg-plum'},
  coeur:{band:'',kicker:'Notre sélection',center:true,btn:OUT,line:'bg-rose'},
  ventes:{band:'bg-sand/40',kicker:'Les plus aimés',btn:OUT,line:'bg-plum'},
  promo:{band:'bg-rose/10',kicker:'Offres à saisir',btn:'border-rose bg-rose text-white hover:brightness-110',line:'bg-rose'},
  arrivages:{band:'border-y border-dashed border-plum/30',kicker:'Bientôt disponible',btn:OUT,line:'bg-plum'},
  precommandes:{band:'bg-plum/5',kicker:'Réservez dès maintenant',btn:OUT,line:'bg-rose'},
  cadeaux:{band:'bg-[#f6efe6]',kicker:'Pour offrir',center:true,btn:OUT,line:'bg-plum'},
  anciens:{band:'bg-[#FCF8F8]',kicker:'Des références à redécouvrir',btn:OUT,line:'bg-plum'},
};

export default function Shelf({tone,title,href,items}:{tone:string;title:string;href:string;items:any[]}){
  const t=TONES[tone]||TONES.nouveautes;
  const scroller=useRef<HTMLDivElement>(null);
  const go=(dir:number)=>{
    const el=scroller.current;
    if(!el)return;
    const card=el.querySelector<HTMLElement>('[data-shelf-card]');
    const step=card?card.offsetWidth+12:el.clientWidth*0.8;
    el.scrollBy({left:dir*step,behavior:'smooth'});
  };

  useEffect(()=>{
    const el=scroller.current;
    if(!el||items.length<3)return;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce)return;
    let timer:ReturnType<typeof setInterval>;
    const start=()=>{
      clearInterval(timer);
      timer=setInterval(()=>{
        if(document.hidden)return;
        const max=el.scrollWidth-el.clientWidth;
        if(max<=8)return;
        const card=el.querySelector<HTMLElement>('[data-shelf-card]');
        const step=card?card.offsetWidth+12:el.clientWidth*0.8;
        if(el.scrollLeft>=max-12){
          el.scrollTo({left:0,behavior:'smooth'});
        }else{
          el.scrollBy({left:step,behavior:'smooth'});
        }
      },10000);
    };
    start();
    const pause=()=>clearInterval(timer);
    const resume=()=>start();
    el.addEventListener('pointerdown',pause);
    el.addEventListener('pointerup',resume);
    el.addEventListener('pointercancel',resume);
    el.addEventListener('mouseenter',pause);
    el.addEventListener('mouseleave',resume);
    return ()=>{
      clearInterval(timer);
      el.removeEventListener('pointerdown',pause);
      el.removeEventListener('pointerup',resume);
      el.removeEventListener('pointercancel',resume);
      el.removeEventListener('mouseenter',pause);
      el.removeEventListener('mouseleave',resume);
    };
  },[items.length]);

  const arrow='flex h-9 w-9 items-center justify-center rounded-full border border-plum/30 bg-white text-lg leading-none text-plum transition hover:border-plum';

  return (
    <div className={`relative left-1/2 mt-10 w-screen -translate-x-1/2 py-10 ${t.band}`}>
      <div className="mx-auto max-w-6xl px-4">
        <div className={`flex flex-col gap-4 ${t.center?'items-center text-center':'sm:flex-row sm:items-end sm:justify-between'}`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-rose">{t.kicker}</p>
            <h2 className="mt-2 font-serif text-3xl text-plum md:text-4xl">{title}</h2>
            <span className={`mt-3 block h-px w-14 ${t.line} ${t.center?'mx-auto':''}`}/>
          </div>
          <div className="flex items-center gap-2">
            {items.length>1&&<>
              <button type="button" aria-label="Produits précédents" onClick={()=>go(-1)} className={arrow}>‹</button>
              <button type="button" aria-label="Produits suivants" onClick={()=>go(1)} className={arrow}>›</button>
            </>}
            <Link href={href} className={`rounded-full border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition ${t.btn}`}>Voir tout</Link>
          </div>
        </div>
        <div ref={scroller} aria-label={`Produits : ${title}`} className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:scroll-pl-0 md:gap-x-5 md:px-0">
          {items.map((p:any)=><div data-shelf-card key={p.id} className="w-[42%] shrink-0 snap-start md:w-[calc(25%-15px)]"><ProductCard p={p}/></div>)}
        </div>
        <p className="mt-2 text-center text-[9px] text-ink/45">Défilement automatique · Faites glisser ou utilisez les flèches</p>
      </div>
    </div>
  );
}
