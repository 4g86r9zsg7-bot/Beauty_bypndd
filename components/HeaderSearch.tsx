'use client';

import {useState} from 'react';
import SearchBox from '@/components/SearchBox';

export default function HeaderSearch(){
  const [open,setOpen]=useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={open?'Fermer la recherche':'Rechercher un produit'}
        aria-expanded={open}
        onClick={()=>setOpen(value=>!value)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
      >
        {open?(
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        ):(
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>
        )}
      </button>
      {open&&(
        <div className="absolute right-0 top-full z-[100] mt-3 w-[min(92vw,420px)]">
          <SearchBox compact/>
        </div>
      )}
    </div>
  );
}
