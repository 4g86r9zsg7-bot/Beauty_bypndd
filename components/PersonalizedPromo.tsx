'use client';

import {useEffect,useMemo,useState} from 'react';

const STORAGE_KEY='beautybypndd_recently_viewed';

export default function PersonalizedPromo({codes}:{codes:any[]}){
  const [history,setHistory]=useState<any[]>([]);
  const [ready,setReady]=useState(false);
  const [activeIndex,setActiveIndex]=useState(0);

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

  useEffect(()=>{
    setActiveIndex(0);
    if(matching.length<2)return;
    const timer=window.setInterval(()=>{
      setActiveIndex(current=>(current+1)%matching.length);
    },6500);
    return ()=>window.clearInterval(timer);
  },[matching]);

  if(!ready||!matching.length)return null;
  const promo=matching[activeIndex%matching.length];
  const saving=promo.kind==='percent'?'-'+Number(promo.percent)+' %':'-'+Number(promo.amount)+' DH';
  const message='CODE PROMO · '+promo.code+' · '+saving+' · À SAISIR DANS VOTRE PANIER';

  return (
    <div className="promo-ticker my-3 overflow-hidden border-y border-[#eadde2] bg-[#FCF8F8] py-3" aria-label="Codes promotionnels disponibles">
      <div className="promo-ticker-track" aria-live="polite">
        {[0,1].map(copy=>(
          <span key={copy} className="promo-ticker-message" aria-hidden={copy===1}>
            <span className="text-[#98783b]">✦</span>
            <span>{message}</span>
            <span className="text-[#98783b]">✦</span>
          </span>
        ))}
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}
