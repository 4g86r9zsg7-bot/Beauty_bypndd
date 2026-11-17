'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
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
};
const PER=4;
const shuffle=(a:any[])=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r};

export default function Shelf({tone,title,href,items}:{tone:string;title:string;href:string;items:any[]}){
  const t=TONES[tone]||TONES.nouveautes;
  const n=items.length,multi=n>PER,pages=Math.ceil(n/PER);
  const [list,setList]=useState(items);
  const [page,setPage]=useState(0);
  const [fade,setFade]=useState(false);
  const pg=useRef(0),busy=useRef(false),hold=useRef(false),seen=useRef(true);
  const root=useRef<HTMLDivElement>(null),timer=useRef<any>(null);

  const go=useCallback((dir:number)=>{
    if(busy.current)return;busy.current=true;setFade(true);
    timer.current=setTimeout(()=>{
      const np=(pg.current+dir+pages)%pages;
      if(dir>0&&np===0)setList(l=>shuffle(l));
      pg.current=np;setPage(np);setFade(false);busy.current=false;
    },260);
  },[pages]);

  useEffect(()=>{
    if(!multi)return;
    const el=root.current;let io:IntersectionObserver|undefined;
    if(el&&'IntersectionObserver' in window){io=new IntersectionObserver(([e])=>{seen.current=e.isIntersecting});io.observe(el)}
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id=reduced?undefined:setInterval(()=>{if(!hold.current&&seen.current&&document.visibilityState==='visible')go(1)},9000);
    return()=>{if(id)clearInterval(id);io?.disconnect();clearTimeout(timer.current)};
  },[multi,go]);

  const view=multi?Array.from({length:PER},(_,i)=>list[(page*PER+i)%n]):list;
  const arrow='flex h-9 w-9 items-center justify-center rounded-full border border-plum/30 bg-white text-lg leading-none text-plum transition hover:border-plum';

  return (
    <div ref={root} className={`relative left-1/2 mt-10 w-screen -translate-x-1/2 py-10 ${t.band}`}
      onMouseEnter={()=>{hold.current=true}} onMouseLeave={()=>{hold.current=false}}
      onFocus={()=>{hold.current=true}} onBlur={()=>{hold.current=false}}
      onTouchStart={()=>{hold.current=true}} onTouchEnd={()=>{setTimeout(()=>{hold.current=false},8000)}}>
      <div className="mx-auto max-w-6xl px-4">
        <div className={`flex flex-col gap-4 ${t.center?'items-center text-center':'sm:flex-row sm:items-end sm:justify-between'}`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-rose">{t.kicker}</p>
            <h2 className="mt-2 font-serif text-3xl text-plum md:text-4xl">{title}</h2>
            <span className={`mt-3 block h-px w-14 ${t.line} ${t.center?'mx-auto':''}`}/>
          </div>
          <div className="flex items-center gap-2">
            {multi&&<><button type="button" aria-label="Produits précédents" onClick={()=>go(-1)} className={arrow}>‹</button><button type="button" aria-label="Produits suivants" onClick={()=>go(1)} className={arrow}>›</button></>}
            <Link href={href} className={`rounded-full border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition ${t.btn}`}>Voir tout</Link>
          </div>
        </div>
        <div className={`mt-8 grid grid-cols-2 gap-x-3 gap-y-8 transition-opacity duration-300 md:grid-cols-4 md:gap-x-5 ${fade?'opacity-0':'opacity-100'}`}>
          {view.map((p:any,i:number)=><ProductCard key={`${p.id}-${i}`} p={p}/>)}
        </div>
      </div>
    </div>
  );
}
