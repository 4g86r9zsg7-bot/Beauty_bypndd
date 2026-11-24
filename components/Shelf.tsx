'use client';

import {useId,useRef} from 'react';
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
  const shelfId=useId();

  const go=(dir:number)=>{
    const el=scroller.current;
    if(!el)return;
    const card=el.querySelector<HTMLElement>('[data-shelf-card]');
    const step=card?card.offsetWidth+12:el.clientWidth*0.8;
    el.scrollBy({left:dir*step,behavior:'smooth'});
  };

  const arrow='flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-plum/30 bg-white text-xl leading-none text-plum transition hover:border-plum hover:bg-plum hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2';

  return (
    <section aria-labelledby={shelfId+'-title'} className={'relative left-1/2 mt-10 w-screen -translate-x-1/2 py-8 sm:py-10 '+t.band}>
      <div className="mx-auto max-w-6xl px-4">
        <div className={'flex flex-col gap-4 '+(t.center?'items-center text-center':'sm:flex-row sm:items-end sm:justify-between')}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-rose">{t.kicker}</p>
            <h2 id={shelfId+'-title'} className="mt-2 font-serif text-3xl text-plum md:text-4xl">{title}</h2>
            <span className={'mt-3 block h-px w-14 '+t.line+(t.center?' mx-auto':'')}/>
          </div>
          <div className="flex items-center gap-2">
            {items.length>1&&<>
              <button type="button" aria-label={'Faire défiler les produits de '+title+' vers la gauche'} aria-controls={shelfId} onClick={()=>go(-1)} className={arrow}>‹</button>
              <button type="button" aria-label={'Faire défiler les produits de '+title+' vers la droite'} aria-controls={shelfId} onClick={()=>go(1)} className={arrow}>›</button>
            </>}
            <Link href={href} className={'rounded-full border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition '+t.btn}>Voir tout</Link>
          </div>
        </div>
        <div
          id={shelfId}
          ref={scroller}
          role="group"
          aria-label={'Produits : '+title}
          tabIndex={0}
          className="-mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth scroll-pl-4 px-4 pb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/60 md:mx-0 md:scroll-pl-0 md:gap-x-5 md:px-0 [scrollbar-width:thin] [scrollbar-color:#b78b9d_transparent]"
        >
          {items.map((p:any)=><div data-shelf-card key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[42%] md:w-[calc(25%-15px)]"><ProductCard p={p}/></div>)}
        </div>
        <p className="mt-1 text-center text-[10px] text-ink/55">Faites glisser les produits ou utilisez les flèches pour parcourir la sélection.</p>
      </div>
    </section>
  );
}
