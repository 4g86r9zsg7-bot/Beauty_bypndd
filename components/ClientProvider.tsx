'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';

const C=createContext<any>(null);
export const useClient=()=>useContext(C);

export function ClientProvider({children}:{children:React.ReactNode}){
  const [phone,setPhoneS]=useState('');
  const [favs,setFavs]=useState<string[]>([]);
  const [notifs,setNotifs]=useState<any[]>([]);
  const [gate,setGate]=useState<{fn:(p:string)=>void}|null>(null);
  const [tmp,setTmp]=useState('');
  const [restockStatus,setRestockStatus]=useState<Record<string,boolean>>({});
  const [restockErrors,setRestockErrors]=useState<Record<string,string>>({});

  const load=useCallback(async(p:string)=>{
    if(!p)return;
    const [f,n]=await Promise.all([
      supabase.rpc('get_favorites',{p_phone:p}),
      supabase.rpc('get_notifications',{p_phone:p})
    ]);
    setFavs(f.data||[]);
    setNotifs(n.data||[]);
  },[]);

  useEffect(()=>{
    try{
      const s=localStorage.getItem('clientPhone')||JSON.parse(localStorage.getItem('lastOrder')||'null')?.p||'';
      if(s){setPhoneS(s);load(s);}
    }catch{}
  },[load]);

  useEffect(()=>{
    if(!phone)return;
    const t=setInterval(()=>load(phone),60000);
    return ()=>clearInterval(t);
  },[phone,load]);

  const setPhone=(p:string)=>{
    setPhoneS(p);
    try{localStorage.setItem('clientPhone',p);}catch{}
    load(p);
  };

  const withPhone=(fn:(p:string)=>void)=>{
    if(phone)fn(phone);
    else setGate({fn});
  };

  const toggleFav=(id:string)=>withPhone(async p=>{
    const {data,error}=await supabase.rpc('toggle_favorite',{p_phone:p,p_product:id});
    if(error)return;
    setFavs(f=>data?[...f.filter(x=>x!==id),id]:f.filter(x=>x!==id));
  });

  const subscribeRestock=(productId:string,variant:string|null)=>{
    const key=`${productId}:${variant||''}`;
    setRestockErrors(e=>({...e,[key]:''}));
    withPhone(async p=>{
      const {data,error}=await supabase.rpc('subscribe_restock_alert',{
        p_phone:p,p_product:productId,p_variant:variant
      });
      if(error){
        setRestockErrors(e=>({...e,[key]:error.message||'Impossible de créer cette alerte. Réessayez.'}));
        return;
      }
      setRestockStatus(s=>({...s,[key]:true}));
      setRestockErrors(e=>({...e,[key]:''}));
      await load(p);
    });
  };

  const markRead=async(id:string|null)=>{
    if(!phone)return;
    await supabase.rpc('mark_notifications_read',{p_phone:phone,p_id:id});
    load(phone);
  };

  const unread=notifs.filter(n=>!n.read).length;

  return <C.Provider value={{
    phone,favs,notifs,unread,toggleFav,markRead,
    subscribeRestock,restockStatus,restockErrors,
    askPhone:()=>setGate({fn:()=>{}})
  }}>
    {children}
    {gate&&<div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={()=>setGate(null)}>
      <form onClick={e=>e.stopPropagation()} onSubmit={e=>{
        e.preventDefault();
        const p=tmp.trim();
        if(p.replace(/\\D/g,'').length<8)return;
        setPhone(p);
        const f=gate.fn;
        setGate(null);
        f(p);
      }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-serif text-2xl text-plum">Votre numéro</h2>
        <p className="mt-1 text-sm text-ink/60">Entrez votre numéro de téléphone pour retrouver vos favoris et recevoir vos alertes de retour en stock sur tous vos appareils.</p>
        <input autoFocus required type="tel" inputMode="tel" autoComplete="tel" value={tmp} onChange={e=>setTmp(e.target.value)} placeholder="Votre téléphone" className="mt-4 w-full rounded-xl border border-sand px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-rose"/>
        <button className="mt-4 w-full rounded-full bg-rose py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white">Continuer</button>
        <button type="button" onClick={()=>setGate(null)} className="mt-2 w-full py-2 text-sm text-ink/60 underline">Annuler</button>
      </form>
    </div>}
  </C.Provider>;
}
