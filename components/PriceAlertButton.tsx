'use client';

import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {useClient} from '@/components/ClientProvider';

export default function PriceAlertButton({productId}:{productId:string}){
  const {phone,askPhone}=useClient();
  const [enabled,setEnabled]=useState(false);
  const [loading,setLoading]=useState(false);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    let active=true;
    setLoaded(false);
    if(!phone||!productId){setEnabled(false);setLoaded(true);return ()=>{active=false};}
    supabase.rpc('get_price_alert',{p_phone:phone,p_product:productId})
      .then(({data,error})=>{
        if(!active)return;
        setEnabled(!error&&data===true);
        setLoaded(true);
      });
    return ()=>{active=false};
  },[phone,productId]);

  const toggle=async()=>{
    if(!phone){askPhone();return;}
    if(loading)return;
    setLoading(true);
    const {data,error}=await supabase.rpc('set_price_alert',{
      p_phone:phone,p_product:productId,p_enabled:!enabled
    });
    if(!error)setEnabled(data===true);
    setLoading(false);
  };

  return (
    <button type="button" onClick={toggle} disabled={loading||!loaded}
      aria-pressed={enabled}
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-plum/20 bg-white px-4 py-3 text-sm font-medium text-plum transition hover:border-rose hover:bg-blush/30 disabled:opacity-50">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v2M5.6 5.6 4.2 4.2M3 12H1M23 12h-2M19.8 4.2l-1.4 1.4M7 18h10l-1.2-1.8a4.8 4.8 0 0 0-7.6 0L7 18Z"/>
        <path d="M9 21h6"/>
      </svg>
      {loading?'Enregistrement…':enabled?'Alerte activée · Désactiver':'M’alerter si le prix baisse'}
    </button>
  );
}
