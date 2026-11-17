'use client';
import {useEffect,useRef,useState} from 'react';

// Rangée défilante avec flèches gauche/droite (affichées seulement quand il reste des éléments à découvrir)
export default function ScrollRow({className,children}:{className?:string;children:React.ReactNode}){
  const ref=useRef<HTMLDivElement>(null);
  const [l,setL]=useState(false),[r,setR]=useState(false);
  const upd=()=>{const e=ref.current;if(!e)return;setL(e.scrollLeft>4);setR(e.scrollLeft+e.clientWidth<e.scrollWidth-4)};
  useEffect(()=>{upd();window.addEventListener('resize',upd);return()=>window.removeEventListener('resize',upd)},[]);
  const go=(d:number)=>{const e=ref.current;if(e)e.scrollBy({left:d*Math.max(e.clientWidth*0.8,160),behavior:'smooth'})};
  const b='absolute top-[46px] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-sand bg-white/95 text-plum shadow-md transition active:scale-95 md:top-[54px]';
  const ic={width:18,height:18,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  return (
    <div className="relative mt-5">
      {l&&<button type="button" aria-label="Sous-catégories précédentes" onClick={()=>go(-1)} className={`${b} left-1`}><svg {...ic}><path d="M15 6l-6 6 6 6"/></svg></button>}
      <div ref={ref} onScroll={upd} className={className}>{children}</div>
      {r&&<button type="button" aria-label="Sous-catégories suivantes" onClick={()=>go(1)} className={`${b} right-1`}><svg {...ic}><path d="M9 6l6 6-6 6"/></svg></button>}
    </div>
  );
}
