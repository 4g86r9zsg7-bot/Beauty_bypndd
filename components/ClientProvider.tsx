'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';

const C=createContext<any>(null);
export const useClient=()=>useContext(C);

function createClientKey(){
  if(typeof crypto==='undefined'||!crypto.getRandomValues)throw new Error('Navigateur incompatible');
  if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
  const bytes=new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6]=(bytes[6]&15)|64;
  bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
}
const validKey=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function ClientProvider({children}:{children:React.ReactNode}){
  const [clientKey,setClientKey]=useState('');
  const [phone,setPhoneS]=useState('');
  const [favs,setFavs]=useState<string[]>([]);
  const [notifs,setNotifs]=useState<any[]>([]);
  const [gate,setGate]=useState<{fn:(p:string)=>void}|null>(null);
  const [tmp,setTmp]=useState('');
  const [restockStatus,setRestockStatus]=useState<Record<string,boolean>>({});
  const [restockErrors,setRestockErrors]=useState<Record<string,string>>({});

  const load=useCallback(async(key:string)=>{
    if(!key)return;
    const [f,n]=await Promise.all([
      supabase.rpc('get_favorites',{p_client_key:key}),
      supabase.rpc('get_notifications',{p_client_key:key})
    ]);
    if(!f.error)setFavs(Array.isArray(f.data)?f.data:[]);
    if(!n.error)setNotifs(Array.isArray(n.data)?n.data:[]);
  },[]);

  useEffect(()=>{
    try{
      let key=localStorage.getItem('beautyClientKey')||'';
      if(!validKey(key)){
        key=createClientKey();
        localStorage.setItem('beautyClientKey',key);
      }
      setClientKey(key);
      const savedPhone=localStorage.getItem('clientPhone')||JSON.parse(localStorage.getItem('lastOrder')||'null')?.p||'';
      if(savedPhone)setPhoneS(savedPhone);
    }catch{
      try{setClientKey(createClientKey());}catch{}
    }
  },[]);

  useEffect(()=>{
    if(!clientKey)return;
    load(clientKey);
    const timer=setInterval(()=>load(clientKey),60000);
    return()=>clearInterval(timer);
  },[clientKey,load]);

  const setPhone=(value:string)=>{
    setPhoneS(value);
    try{localStorage.setItem('clientPhone',value);}catch{}
  };
  const withPhone=(fn:(p:string)=>void)=>{
    if(phone)fn(phone);
    else setGate({fn});
  };

  const toggleFav=async(id:string)=>{
    if(!clientKey)return;
    const {data,error}=await supabase.rpc('toggle_favorite',{p_client_key:clientKey,p_product:id});
    if(error)return;
    setFavs(current=>data?[...current.filter(x=>x!==id),id]:current.filter(x=>x!==id));
  };

  const subscribeRestock=(productId:string,variant:string|null)=>{
    const key=productId+':'+(variant||'');
    setRestockErrors(e=>({...e,[key]:''}));
    withPhone(async p=>{
      if(!clientKey)return;
      const {error}=await supabase.rpc('subscribe_restock_alert',{
        p_phone:p,p_product:productId,p_variant:variant,p_client_key:clientKey
      });
      if(error){
        setRestockErrors(e=>({...e,[key]:error.message||'Impossible de créer cette alerte. Réessayez.'}));
        return;
      }
      setRestockStatus(s=>({...s,[key]:true}));
      await load(clientKey);
    });
  };

  const markRead=async(id:string|null)=>{
    if(!clientKey)return;
    await supabase.rpc('mark_notifications_read',{p_client_key:clientKey,p_id:id});
    await load(clientKey);
  };

  const claimOrderNotifications=async(orderPhone:string,accessCode:string)=>{
    if(!clientKey)return {error:{message:'Session client indisponible.'}};
    const {error}=await supabase.rpc('claim_order_notifications',{
      p_phone:orderPhone,p_access_code:accessCode,p_client_key:clientKey
    });
    if(!error){
      setPhone(orderPhone);
      await load(clientKey);
    }
    return {error};
  };

  const unread=notifs.filter(n=>!n.read).length;
  return <C.Provider value={{
    clientKey,phone,setPhone,favs,notifs,unread,toggleFav,markRead,
    claimOrderNotifications,subscribeRestock,restockStatus,restockErrors,
    askPhone:()=>setGate({fn:()=>{}})
  }}>
    {children}
    {gate&&<div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={()=>setGate(null)}>
      <form onClick={e=>e.stopPropagation()} onSubmit={e=>{
        e.preventDefault();
        const p=tmp.trim();
        if(p.replace(/\D/g,'').length<8)return;
        setPhone(p);
        const fn=gate.fn;
        setGate(null);
        fn(p);
      }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-serif text-2xl text-plum">Votre numéro</h2>
        <p className="mt-1 text-sm text-ink/60">Votre numéro est utilisé pour les alertes de retour en stock et pour associer une commande avec son code secret.</p>
        <input autoFocus required type="tel" inputMode="tel" autoComplete="tel" value={tmp} onChange={e=>setTmp(e.target.value)} placeholder="Votre téléphone" className="mt-4 w-full rounded-xl border border-sand px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-rose"/>
        <button className="mt-4 w-full rounded-full bg-rose py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white">Continuer</button>
        <button type="button" onClick={()=>setGate(null)} className="mt-2 w-full py-2 text-sm text-ink/60 underline">Annuler</button>
      </form>
    </div>}
  </C.Provider>;
}
