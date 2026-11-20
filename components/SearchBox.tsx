'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {supabase,eur} from '@/lib/supabase';

const rk=(p:any)=>{
  const pre=p.availability==='preorder',arr=p.availability==='arrival';
  return p.availability==='soldout'||(!pre&&!arr&&p.stock<=0)?2:(pre||arr)?1:0;
};

const lab=(p:any)=>
  p.availability==='soldout'||(p.availability!=='preorder'&&p.availability!=='arrival'&&p.stock<=0)
    ?'Indisponible'
    :p.availability==='preorder'?'Précommande'
    :p.availability==='arrival'?'Arrivage':'';

const norm=(s:any)=>String(s??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const editDistance=(a:string,b:string)=>{
  const prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    let diagonal=prev[0];
    prev[0]=i;
    for(let j=1;j<=b.length;j++){
      const old=prev[j];
      prev[j]=Math.min(prev[j]+1,prev[j-1]+1,diagonal+(a[i-1]===b[j-1]?0:1));
      diagonal=old;
    }
  }
  return prev[b.length];
};

const typoScore=(query:string,candidate:string)=>{
  const q=norm(query), c=norm(candidate);
  if(!q||!c)return 0;
  if(c.includes(q)||q.includes(c))return 1;
  const qt=q.split(' ').filter(Boolean), ct=c.split(' ').filter(Boolean);
  const scores=qt.map(token=>{
    let best=0;
    for(const word of ct){
      const d=editDistance(token,word);
      const score=1-d/Math.max(token.length,word.length,1);
      if(score>best)best=score;
    }
    return best;
  });
  return scores.reduce((a,b)=>a+b,0)/scores.length;
};

export default function SearchBox({compact=false}:{compact?:boolean}){
  const [v,setV]=useState('');
  const [items,setItems]=useState<any[]>([]);
  const [total,setTotal]=useState(0);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [fuzzy,setFuzzy]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const inp=useRef<HTMLInputElement>(null);
  const seq=useRef(0);
  const t=v.replace(/[%,()*]/g,' ').trim();

  useEffect(()=>{
    const h=(e:PointerEvent)=>{
      if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);
    };
    document.addEventListener('pointerdown',h);
    return ()=>document.removeEventListener('pointerdown',h);
  },[]);

  useEffect(()=>{
    if(!t){
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id=++seq.current;
    const tm=setTimeout(async()=>{
      const [bm,cm]=await Promise.all([
        supabase.from('brands').select('id').ilike('name',`%${t}%`),
        supabase.from('categories').select('id').ilike('name',`%${t}%`)
      ]);
      const bi=(bm.data||[]).map((x:any)=>x.id);
      const ci=(cm.data||[]).map((x:any)=>x.id);
      const parts=[`name.ilike.%${t}%`];
      if(bi.length)parts.push(`brand_id.in.(${bi.join(',')})`);
      if(ci.length)parts.push(`category_id.in.(${ci.join(',')})`);

      const {data,count}=await supabase
        .from('products')
        .select('id,slug,name,price,images,availability,stock,brands(name)',{count:'exact'})
        .eq('active',true)
        .or(parts.join(','))
        .limit(30);

      if(id!==seq.current)return;

      let found=[...(data||[])];
      let usedFuzzy=false;
      let foundTotal=count||0;

      if(!found.length){
        const {data:pool}=await supabase
          .from('products')
          .select('id,slug,name,price,images,availability,stock,brands(name)')
          .eq('active',true)
          .limit(1000);

        if(id!==seq.current)return;

        const ranked=(pool||[])
          .map((p:any)=>({
            p,
            score:Math.max(
              typoScore(t,p.name),
              typoScore(t,p.brands?.name)
            )
          }))
          .filter((x:any)=>x.score>=0.62)
          .sort((a:any,b:any)=>b.score-a.score||rk(a.p)-rk(b.p));

        found=ranked.slice(0,6).map((x:any)=>x.p);
        foundTotal=ranked.length;
        usedFuzzy=found.length>0;
      }

      setItems(found.sort((a:any,b:any)=>rk(a)-rk(b)).slice(0,6));
      setTotal(foundTotal);
      setFuzzy(usedFuzzy);
      setLoading(false);
    },180);

    return ()=>{
      clearTimeout(tm);
      seq.current++;
    };
  },[t]);

  return (
    <div
      ref={ref}
      className={compact
        ?'relative z-30 w-full rounded-2xl bg-white p-3 text-ink shadow-2xl'
         :'relative z-30 mx-auto mt-8 w-full max-w-xl'}
    >
      {!compact&&(
        <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-blush">
          Rechercher un produit
        </p>
      )}

      <form
        action="/categorie/tous"
        onSubmit={()=>setOpen(false)}
        role="search"
        className="relative"
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-plum/60"
        >
          <circle cx="11" cy="11" r="6.5"/>
          <path d="M16 16l4.5 4.5"/>
        </svg>

        <input
          ref={inp}
          name="q"
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={v}
          onChange={e=>{setV(e.target.value);setOpen(true)}}
          onFocus={()=>setOpen(true)}
          placeholder="Nom, marque ou catégorie"
          className={`w-full rounded-full bg-white/95 py-3.5 pl-11 pr-24 text-base text-ink shadow-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-rose ${compact?'border border-sand':''}`}
        />

        {v&&(
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={()=>{setV('');setItems([]);setOpen(false);inp.current?.focus()}}
            className="absolute right-14 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-sand text-lg leading-none text-plum"
          >×</button>
        )}

        <button
          type="submit"
          aria-label="Rechercher"
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#EE6FB0] text-[#2a0a1b]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </button>
      </form>

      {open&&t&&(
        <div className={`${compact?'absolute left-0 right-0 top-full z-[200] mt-2':'relative mt-2'} max-h-[min(55vh,440px)] overflow-y-auto overscroll-contain rounded-2xl border border-sand bg-white text-ink shadow-2xl`}>
          {items.map(p=>{
            const l=lab(p);
            return (
              <Link
                key={p.id}
                href={`/produit/${p.slug}`}
                onClick={()=>setOpen(false)}
                className="flex items-center gap-3 border-b border-sand px-3 py-3 active:bg-cream"
              >
                <span className="h-16 w-12 shrink-0 overflow-hidden bg-sand">
                  {p.images?.[0]&&<img src={p.images[0]} alt="" loading="lazy" className="h-full w-full bg-white object-contain"/>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] uppercase tracking-[0.18em] text-plum/70">{p.brands?.name}</span>
                  <span className="block line-clamp-2 font-serif text-base leading-snug">{p.name}</span>
                  <span className="mt-0.5 block text-sm">
                    <b className="text-ink">{eur(p.price)}</b>
                    {l&&<span className="ml-2 text-xs text-plum">{l}</span>}
                  </span>
                </span>
              </Link>
            );
          })}

          {!items.length&&loading&&<p className="px-4 py-5 text-sm text-ink/60">Recherche…</p>}

          {!items.length&&!loading&&(
            <div className="px-4 py-6 text-center">
              <p className="font-serif text-lg text-plum">Aucun produit ne correspond à « {t} »</p>
              <p className="mt-1 text-sm text-ink/60">Essayez une marque, une catégorie ou un autre mot.</p>
            </div>
          )}

          {items.length>0&&(
            <Link
              href={`/categorie/tous?q=${encodeURIComponent(fuzzy?(items[0]?.name||t):t)}`}
              onClick={()=>setOpen(false)}
              className="block px-4 py-3.5 text-center text-[11px] uppercase tracking-[0.18em] text-rose"
            >
              {fuzzy?'Voir les résultats proches':'Voir tous les résultats'}{total>items.length?` (${total})`:''}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
