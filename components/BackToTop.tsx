'use client';

import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {WA} from '@/lib/supabase';
import {WhatsAppIcon} from '@/components/SocialIcons';

export default function BackToTop(){
  const [visible,setVisible]=useState(false);
  const pathname=usePathname();

  useEffect(()=>{
    const update=()=>setVisible(window.scrollY>420);
    update();
    window.addEventListener('scroll',update,{passive:true});
    return ()=>window.removeEventListener('scroll',update);
  },[]);

  // Sur les fiches produits, les boutons fixes masquent les variantes et les actions d'achat.
  if(pathname.startsWith('/produit/'))return null;
  if(!visible)return null;

  return (
    <>
      <a
        href={`https://wa.me/${WA}`}
        aria-label="Contacter BeautyByPND sur WhatsApp"
        title="WhatsApp"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-3 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a45c] focus-visible:ring-offset-2 sm:right-5 sm:h-14 sm:w-14"
      >
        <WhatsAppIcon size={48}/>
      </a>
      <button
        type="button"
        aria-label="Retour en haut de la page"
        title="Retour en haut"
        onClick={()=>{
          const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'});
        }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a45c]/80 bg-[#3b1028] text-white shadow-[0_6px_20px_rgba(20,4,12,0.28)] transition-all duration-200 hover:border-[#e0bd79] hover:bg-[#54203d] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a45c] focus-visible:ring-offset-2 sm:bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] sm:right-5 sm:h-11 sm:w-11"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m18 15-6-6-6 6"/>
          <path d="M12 9v11"/>
        </svg>
      </button>
    </>
  );
}
