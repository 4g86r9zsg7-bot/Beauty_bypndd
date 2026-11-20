'use client';

import {useEffect,useState} from 'react';

export default function BackToTop(){
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    const update=()=>setVisible(window.scrollY>420);
    update();
    window.addEventListener('scroll',update,{passive:true});
    return ()=>window.removeEventListener('scroll',update);
  },[]);

  if(!visible)return null;

  return (
    <button
      type="button"
      aria-label="Retour en haut de la page"
      title="Retour en haut"
      onClick={()=>{
        const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'});
      }}
      className="fixed bottom-24 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-[#14040c] text-white shadow-lg transition hover:bg-plum active:scale-95"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m18 15-6-6-6 6"/>
        <path d="M12 9v11"/>
      </svg>
    </button>
  );
}
