'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';

const STORAGE_KEY='beautybypndd_recently_viewed';

export default function PersonalizedPromo({codes}:{codes:any[]}){
  const [history,setHistory]=useState<any[]>([]);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      setHistory(Array.isArray(saved)?saved.slice(0,8):[]);
    }catch{
      setHistory([]);
    }
    setReady(true);
  },[]);

  const matching=useMemo(()=>{
    if(!ready||!Array.isArray(codes))return [];
    const score=(promo:any)=>{
      const target=promo.target_type||'all';
      if(target==='all')return 1;
      const index=history.findIndex((item:any)=>{
        if(!item)return false;
        if(target==='product')return item.id===promo.target_id;
        if(target==='variant'){
          return item.id===promo.target_id&&
            Array.isArray(item.variants)&&
            item.variants.some((v:any)=>String(typeof v==='string'?v:v?.name||'').trim().toLowerCase()===String(promo.target_variant||'').trim().toLowerCase());
        }
        if(target==='brand')return item.brand_id===promo.target_id;
        if(target==='category')return item.category_id===promo.target_id;
        return false;
      });
      if(index<0)return 0;
      const weight=target==='product'?100:target==='variant'?110:target==='brand'?70:50;
      return weight+(history.length-index);
    };
    return [...codes]
      .map((promo:any)=>({...promo,_personalScore:score(promo)}))
      .filter((promo:any)=>promo._personalScore>0)
      .sort((a:any,b:any)=>b._personalScore-a._personalScore)
      .slice(0,4);
  },[codes,history,ready]);

  if(!ready||!matching.length)return null;
  const personalized=matching.some((p:any)=>(p.target_type||'all')!=='all');

  return (
    <section className="relative mt-7 overflow-hidden rounded-[26px] border border-[#C6A15B]/45 bg-gradient-to-br from-[#fff8fa] via-white to-[#f8eaf0] px-5 py-8 shadow-sm sm:px-8">
      <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[#C6A15B]/10 blur-3xl"/>
      <div className="relative">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#98783b]">
            {personalized?'Selon vos intérêts':'Un petit cadeau pour vous'}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-plum sm:text-4xl">
            {personalized?'Offres sélectionnées pour vous':'Codes promo exclusifs'}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/65">
            {personalized
              ?'Voici les réductions actives qui correspondent aux produits et catégories que vous avez consultés.'
              :'Profitez des codes promo actuellement disponibles dans notre boutique.'}
          </p>
          <div className="mx-auto mt-4 h-px w-16 bg-[#C6A15B]"/>
        </div>
        <div className="mx-auto mt-7 grid max-w-4xl gap-4 sm:grid-cols-2">
          {matching.map((p:any)=>(
            <div key={p.id||p.code} className="relative overflow-hidden rounded-2xl border border-[#ead8df] bg-white/90 p-5 text-center shadow-sm">
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#98783b]">
                {p.target_type&&p.target_type!=='all'?'Offre adaptée à vos intérêts':'Code disponible'}
              </span>
              <p className="mt-2 break-all font-serif text-2xl font-semibold tracking-[0.12em] text-plum">{p.code}</p>
              <p className="mt-2 font-serif text-3xl text-rose">
                {p.kind==='percent'?'-'+Number(p.percent)+' %':'-'+Number(p.amount)+' DH'}
              </p>
              <p className="mt-2 text-xs font-medium text-plum">{p.target_label||'Valable sur le catalogue'}</p>
              <p className="mt-1 text-[10px] text-ink/55">À saisir dans votre panier</p>
              {p.expires_at&&(
                <p className="mt-2 text-[10px] text-[#98783b]">
                  Valable jusqu'au {new Date(p.expires_at).toLocaleDateString('fr-FR')}
                </p>
              )}
              <Link href="/categorie/tous" className="mt-4 inline-flex rounded-full border border-[#C6A15B] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-plum transition hover:bg-[#fdf3f7]">
                En profiter
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
