'use client';

import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';

export default function HeaderSearch(){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const input=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    if(open) input.current?.focus();
  },[open]);

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape') setOpen(false);
    };
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  },[]);

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
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(88vw,380px)] rounded-2xl border border-sand bg-white p-4 text-ink shadow-2xl">
          <p className="mb-3 font-serif text-xl text-plum">Que recherchez-vous ?</p>
          <form action="/categorie/tous" role="search" onSubmit={()=>setOpen(false)} className="flex gap-2">
            <input
              ref={input}
              name="q"
              type="search"
              inputMode="search"
              autoComplete="off"
              value={query}
              onChange={event=>setQuery(event.target.value)}
              placeholder="Nom, marque ou catégorie"
              className="min-w-0 flex-1 rounded-full border border-sand px-4 py-3 text-sm outline-none focus:border-plum"
            />
            <button type="submit" aria-label="Lancer la recherche" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose text-white">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>
            </button>
          </form>
          <p className="mt-2 text-[11px] text-ink/55">Recherchez parmi les produits, les marques et les catégories.</p>
          <Link href="/categorie/tous" onClick={()=>setOpen(false)} className="mt-3 inline-block text-xs text-plum underline underline-offset-4">Parcourir tous les produits</Link>
        </div>
      )}
    </div>
  );
}
