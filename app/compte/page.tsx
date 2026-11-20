'use client';

import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase,eur} from '@/lib/supabase';

export default function ComptePage(){
  const [session,setSession]=useState<any>(null);
  const [mode,setMode]=useState<'login'|'signup'>('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [orders,setOrders]=useState<any[]>([]);
  const [loadingOrders,setLoadingOrders]=useState(false);

  const loadOrders=useCallback(async()=>{
    setLoadingOrders(true);
    const {data,error}=await supabase.rpc('get_my_account_orders');
    if(error)setError('Impossible de charger vos commandes pour le moment.');
    else setOrders(Array.isArray(data)?data:[]);
    setLoadingOrders(false);
  },[]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(session?.user)loadOrders();
    else setOrders([]);
  },[session,loadOrders]);

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try{
      if(mode==='signup'){
        const {data,error}=await supabase.auth.signUp({email:email.trim(),password});
        if(error)throw error;
        if(data.session)setSession(data.session);
        else setMessage('Votre compte a été créé. Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous.');
      }else{
        const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
        if(error)throw error;
        setSession(data.session);
        setMessage('Connexion réussie.');
      }
    }catch(err:any){
      setError(err?.message||'Une erreur est survenue.');
    }finally{
      setBusy(false);
    }
  };

  const signOut=async()=>{
    await supabase.auth.signOut();
    setSession(null);
    setOrders([]);
    setMessage('Vous êtes déconnecté.');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-rose">Beauty_bypndd</p>
      <h1 className="mt-2 font-serif text-4xl text-plum">Mon compte</h1>
      <p className="mt-2 text-sm text-ink/60">Retrouvez vos commandes et vos informations en toute simplicité.</p>

      {error&&<p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message&&<p role="status" className="mt-5 rounded-xl border border-rose/20 bg-blush/40 p-3 text-sm text-plum">{message}</p>}

      {!session?(
        <section className="mt-7 rounded-2xl border border-sand bg-white p-5 shadow-sm sm:p-7">
          <div className="flex gap-2 rounded-full bg-blush/40 p-1">
            <button type="button" onClick={()=>{setMode('login');setError('');setMessage('');}} className={`flex-1 rounded-full py-3 text-xs font-semibold uppercase tracking-wider ${mode==='login'?'bg-white text-plum shadow-sm':'text-ink/55'}`}>Connexion</button>
            <button type="button" onClick={()=>{setMode('signup');setError('');setMessage('');}} className={`flex-1 rounded-full py-3 text-xs font-semibold uppercase tracking-wider ${mode==='signup'?'bg-white text-plum shadow-sm':'text-ink/55'}`}>Créer un compte</button>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm text-ink/75">Adresse e-mail
              <input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-sand px-4 py-3.5 outline-none focus:border-rose"/>
            </label>
            <label className="block text-sm text-ink/75">Mot de passe
              <input required minLength={6} type="password" autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-sand px-4 py-3.5 outline-none focus:border-rose"/>
            </label>
            <button disabled={busy} className="w-full rounded-full bg-rose py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-md transition hover:bg-plum disabled:opacity-50">{busy?'Veuillez patienter…':mode==='signup'?'Créer mon compte':'Me connecter'}</button>
          </form>
          <p className="mt-4 text-center text-xs leading-relaxed text-ink/50">Vos données et commandes restent accessibles uniquement après connexion à votre compte.</p>
        </section>
      ):(
        <section className="mt-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand bg-white p-5">
            <div><p className="text-xs uppercase tracking-wider text-ink/50">Connecté avec</p><p className="mt-1 font-medium text-plum">{session.user.email}</p></div>
            <button type="button" onClick={signOut} className="rounded-full border border-sand px-4 py-2 text-xs font-semibold text-plum hover:bg-blush">Déconnexion</button>
          </div>
          <div className="rounded-2xl border border-sand bg-white p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3"><h2 className="font-serif text-2xl text-plum">Mes commandes</h2><button type="button" onClick={loadOrders} className="text-xs text-rose underline">Actualiser</button></div>
            {loadingOrders?(
              <p className="py-8 text-center text-sm text-ink/55">Chargement de vos commandes…</p>
            ):orders.length===0?(
              <div className="py-8 text-center"><p className="text-sm text-ink/60">Aucune commande associée à ce compte pour le moment.</p><Link href="/" className="mt-4 inline-block rounded-full bg-rose px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white">Découvrir la boutique</Link></div>
            ):(
              <div className="mt-5 space-y-4">
                {orders.map(o=>(
                  <article key={o.id} className="rounded-xl border border-sand p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div><p className="text-xs text-ink/50">Commande #{o.number}</p><p className="mt-1 text-sm font-semibold text-plum">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p></div>
                      <span className="rounded-full bg-blush px-3 py-1 text-xs text-plum">{o.status||'En cours'}</span>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-ink/65">
                      {(Array.isArray(o.items)?o.items:[]).map((it:any,i:number)=>(
                        <p key={i}>{it.qty||1} × {it.name||it.title||'Article'}{it.variant? ` · ${it.variant}` : ''}</p>
                      ))}
                    </div>
                    <p className="mt-3 text-right font-semibold text-plum">{eur(o.total)}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
