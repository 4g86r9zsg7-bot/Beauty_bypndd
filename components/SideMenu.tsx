
'use client';

import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import Link from 'next/link';
import {supabase} from '@/lib/supabase';
import SearchBox from '@/components/SearchBox';

const LABEL:Record<string,string>={
  maquillage:'Maquillage',
  'parfums-brumes':'Parfums',
  'soins-visage':'Visage',
  'soins-corps':'Corps et bain',
  cheveux:'Cheveux',
  mode:'Mode et vêtements'
};

const row="flex w-full items-center justify-between border-b border-[#F1E4E9] px-5 py-4 text-left text-[12px] font-medium uppercase tracking-[0.16em] text-[#67213F] transition-colors hover:bg-[#FDF5F8]";
const lnk="block rounded-lg px-3 py-2.5 text-sm text-[#45313B] transition-colors hover:bg-white hover:text-[#A23C69]";

export default function SideMenu(){
  const [mounted,setMounted]=useState(false);
  const [open,setOpen]=useState(false);
  const [sec,setSec]=useState('');
  const [cats,setCats]=useState<any[]>([]);
  const [brands,setBrands]=useState<any[]>([]);
  const [usedB,setUsedB]=useState<Set<string>>(new Set());
  const triggerRef=useRef<HTMLButtonElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const panelRef=useRef<HTMLElement>(null);

  const show=()=>{
    setMounted(true);
    setSec('');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      setOpen(true);
      closeRef.current?.focus();
    }));
  };

  const hide=()=>setOpen(false);

  useEffect(()=>{
    if(!mounted)return;

    Promise.all([
      supabase.from('categories').select('id,slug,name,parent_id,position'),
      supabase.from('brands').select('id,name').order('name'),
      supabase.from('products').select('category_id,brand_id').eq('active',true)
    ]).then(([c,b,p])=>{
      setCats(c.data||[]);
      setBrands(b.data||[]);
      setUsedB(new Set((p.data||[]).map((x:any)=>x.brand_id).filter(Boolean)));
    });
  },[mounted]);

  useEffect(()=>{
    document.body.style.overflow=open?'hidden':'';

    const k=(e:KeyboardEvent)=>{
      if(e.key==='Escape')setOpen(false);
    };

    window.addEventListener('keydown',k);

    return()=>{
      window.removeEventListener('keydown',k);
      document.body.style.overflow='';
    };
  },[open]);

  const ord=(a:any,b:any)=>
    (a.position??9999)-(b.position??9999)||
    a.name.localeCompare(b.name);

  const tops=cats
    .filter(c=>!c.parent_id&&c.name.trim().toLowerCase()!=='mercadona'&&c.slug!=='sacs-accessoires')
    .sort(ord);

  const kids=(c:any)=>cats.filter(x=>x.parent_id===c.id).sort(ord);

  const mains=tops.filter(c=>kids(c).length>0);
  const others=tops.filter(c=>kids(c).length===0);
  const brandsU=brands.filter(b=>usedB.has(b.id));

  const Acc=({k,label,children}:{k:string;label:string;children:any})=>(
    <div>
      <button
        type="button"
        aria-expanded={sec===k}
        onClick={()=>setSec(sec===k?'':k)}
        className={row}
      >
        <span>{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#EBD5DF] text-lg font-light transition-all ${sec===k?'rotate-45 bg-[#F8E8EF]':'bg-white'}`}>
          +
        </span>
      </button>
      {sec===k&&(
        <div className="border-b border-[#F1E4E9] bg-[#FCF7F9] px-5 py-3">
          {children}
        </div>
      )}
    </div>
  );

  const services=[
    {
      href:'/compte',
      title:'Mon compte',
      subtitle:'Connexion et historique de commandes',
      icon:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
    },
    {
      href:'/favoris',
      title:'Mes favoris',
      subtitle:'Vos produits préférés',
      icon:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.6 5 6.6 5c1.9 0 3.5 1 5.4 3 1.9-2 3.5-3 5.4-3 3 0 4.9 3 3.8 6.2-1.7 4.7-9.2 9.3-9.2 9.3z"/></svg>
    },
    {
      href:'/notifications',
      title:'Notifications',
      subtitle:'Vos dernières actualités',
      icon:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 17h12l-1.6-2.2V10a4.4 4.4 0 0 0-8.8 0v4.8z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>
    },
    {
      href:'/suivi',
      title:'Suivi de commande',
      subtitle:'Suivez vos achats',
      icon:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/></svg>
    },
    {
      href:'/livraison',
      title:'Livraison',
      subtitle:'Informations de livraison',
      icon:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>
    },
    {
      href:'/contact',
      title:'Contact',
      subtitle:'Nous sommes à votre écoute',
      icon:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20c0 1.5-2 2-5 2"/></svg>
    }
  ];

  return <>
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={show}
      aria-label="Ouvrir le menu"
      className="-ml-2 rounded-full p-2 text-white transition hover:bg-white/10 active:scale-95"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M3 6h18M3 12h18M3 18h18"/>
      </svg>
    </button>

    {mounted&&createPortal(
      <div className={`fixed inset-0 z-[1000] transition-all duration-300 ${open?'':'invisible pointer-events-none'}`}>
        <div
          onClick={hide}
          className={`absolute inset-0 bg-[#180C13] transition-opacity duration-300 ${open?'opacity-100':'opacity-0'}`}
        />

        <aside
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="side-menu-title"
          tabIndex={-1}
          onKeyDown={e=>{
            if(e.key!=='Tab'||!panelRef.current)return;
            const focusable=Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'));
            if(!focusable.length)return;
            const first=focusable[0],last=focusable[focusable.length-1];
            if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
            else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
          }}
          className={`absolute inset-y-0 left-0 flex w-[90%] max-w-[390px] flex-col bg-[#FFFCFD] shadow-2xl transition-transform duration-300 ease-out ${open?'translate-x-0':'-translate-x-full'}`}
        >

          <div className="relative overflow-hidden border-b border-[#F0E1E8] bg-gradient-to-br from-[#FFF9FB] to-[#F9EAF1] px-5 pb-5 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p id="side-menu-title" className="font-serif text-[27px] italic leading-none tracking-tight text-[#702344]">
                  BeautyByPND
                </p>
                <p className="mt-2 text-[9px] uppercase tracking-[0.28em] text-[#98647A]">
                  L’élégance au féminin
                </p>
              </div>

              <button
                type="button"
                ref={closeRef}
                onClick={hide}
                aria-label="Fermer le menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EBD5DF] bg-white/80 text-2xl font-light text-[#702344] transition hover:bg-white active:scale-95"
              >
                ×
              </button>
            </div>

            <div className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#8D526D]">
              <span className="h-px w-7 bg-[#C99BAF]"/>
              Découvrez notre univers
              <span className="h-px flex-1 bg-[#E8CDD9]"/>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain" style={{paddingBottom:'env(safe-area-inset-bottom)'}}>
            <div className="border-b border-[#F0E1E8] bg-white px-5 py-4">
              <SearchBox compact/>
            </div>

            <div className="px-5 pb-2 pt-5">
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#A27B8D]">
                À découvrir
              </p>

              <Link href="/categorie/nouveautes" onClick={hide} className={row}>
                <span>Nouveautés</span>
                <span className="text-lg text-[#B68A9D]">›</span>
              </Link>

              <Link href="/categorie/promotions" onClick={hide} className={row}>
                <span>Bons plans</span>
                <span className="text-lg text-[#B68A9D]">›</span>
              </Link>

              <Link href="/offres" onClick={hide} className={row}>
                <span>Offres et coffrets</span>
                <span className="text-lg text-[#B68A9D]">›</span>
              </Link>

              <Link href="/categorie/arrivages" onClick={hide} className="mt-3 flex items-center justify-between rounded-xl border border-[#F0DCE5] bg-white px-4 py-3 text-sm text-[#702344] transition hover:bg-[#FCF1F6]">
                <span>Prochains arrivages</span>
                <span className="text-lg">›</span>
              </Link>

              <Link href="/precommande-shein" onClick={hide} className="mt-2 flex items-center justify-between rounded-xl border border-[#F0DCE5] bg-white px-4 py-3 text-sm text-[#702344] transition hover:bg-[#FCF1F6]">
                <span>Précommande SHEIN</span>
                <span className="text-lg">›</span>
              </Link>
            </div>

            <div className="mt-4 border-t border-[#F0E1E8]">
              <div className="px-5 pb-1 pt-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#A27B8D]">
                  Explorer la boutique
                </p>
              </div>

              {mains.map(c=>(
                <Acc key={c.id} k={c.slug} label={LABEL[c.slug]||c.name}>
                  <Link href={`/categorie/${c.slug}`} onClick={hide} className={`${lnk} font-semibold`}>
                    Voir toute la catégorie
                  </Link>
                  {kids(c).map(k=>(
                    <Link key={k.id} href={`/categorie/${k.slug}`} onClick={hide} className={lnk}>
                      {k.name}
                    </Link>
                  ))}
                </Acc>
              ))}

              <Acc k="marques" label="Nos marques">
                {brandsU.length>0?brandsU.map(b=>(
                  <Link key={b.id} href={`/categorie/tous?brand=${b.id}`} onClick={hide} className={lnk}>
                    {b.name}
                  </Link>
                )):<p className="px-3 py-3 text-sm text-[#987C8A]">Aucune marque disponible pour le moment.</p>}
              </Acc>

              {others.map(c=>(
                <Link key={c.id} href={`/categorie/${c.slug}`} onClick={hide} className={row}>
                  <span>{LABEL[c.slug]||c.name}</span>
                  <span className="text-lg text-[#B68A9D]">›</span>
                </Link>
              ))}
            </div>

            <section className="mt-5 border-t border-[#F0E1E8] bg-[#FBF2F6] px-5 pb-7 pt-6">
              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#A27B8D]">
                Votre espace
              </p>
              <h3 className="mt-1 font-serif text-2xl text-[#702344]">
                Mon compte & Services
              </h3>
              <p className="mt-1 text-xs text-[#997486]">
                Tout ce dont vous avez besoin
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {services.map(s=>(
                  <Link
                    key={s.href}
                    href={s.href}
                    onClick={hide}
                    className="flex min-h-[76px] items-center gap-2 rounded-xl border border-[#F0E1E8] bg-white px-2.5 py-2.5 transition hover:border-[#D8B5C5] hover:bg-[#FFFBFD] active:scale-[0.99]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8E8EF] text-[#853B5C]">
                      {s.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[#702344]">{s.title}</span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-[#987C8A]">{s.subtitle}</span>
                    </span>
                    <span className="text-lg text-[#B68A9D]">›</span>
                  </Link>
                ))}
              </div>

              <p className="mt-6 text-center text-[9px] uppercase tracking-[0.22em] text-[#A27B8D]">
                BeautyByPND · L’élégance au féminin
              </p>
            </section>
          </div>
        </aside>
      </div>,
      document.body
    )}
  </>;
}
