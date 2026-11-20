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
      className="fixed bottom-24 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-[#c9a45c]/80 bg-[#3b1028] text-white shadow-[0_6px_20px_rgba(20,4,12,0.28)] transition-all duration-200 hover:border-[#e0bd79] hover:bg-[#54203d] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a45c] focus-visible:ring-offset-2"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m18 15-6-6-6 6"/>
        <path d="M12 9v11"/>
      </svg>
    </button>
  );
}
