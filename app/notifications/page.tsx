'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useClient} from '@/components/ClientProvider';

export default function Notifications(){
  const {clientKey,notifs,unread,markRead,claimOrderNotifications}=useClient();
  const [phone,setPhone]=useState('');
  const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [showClaim,setShowClaim]=useState(false);
  const bell=<span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blush text-plum"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 17h12l-1.6-2.2V10a4.4 4.4 0 0 0-8.8 0v4.8z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></span>;

  const linkOrder=async(e:React.FormEvent)=>{
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      const {error:claimError}=await claimOrderNotifications(phone,code.trim().toUpperCase());
      if(claimError)throw claimError;
      setMessage('Commande associée à cet appareil. Ses notifications sécurisées sont chargées.');
      setCode('');
      setShowClaim(false);
    }catch(err:any){
      setError(err?.message||'Impossible de vérifier cette commande.');
    }finally{setBusy(false);}
  };

  return <div className="mx-auto max-w-xl">
    <div className="flex items-end justify-between gap-3">
      <h1 className="font-serif text-4xl text-plum">Mes notifications</h1>
      {unread>0&&<button type="button" onClick={()=>markRead(null)} className="text-xs text-plum underline">Tout marquer comme lu</button>}
    </div>

    {!clientKey?<p className="py-14 text-center text-sm text-ink/60" role="status">Chargement sécurisé…</p>:<>
      {notifs.length===0&&<div className="py-12 text-center">{bell}<p className="mt-5 font-serif text-2xl text-plum">Suivez vos commandes et alertes</p><p className="mt-1 text-sm text-ink/60">Les nouvelles notifications de vos commandes apparaîtront ici.</p></div>}

      {message&&<p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">{message}</p>}

      <section className="mt-5 rounded-2xl border border-sand bg-white p-4 sm:p-5">
        <button type="button" onClick={()=>setShowClaim(v=>!v)} aria-expanded={showClaim} className="text-sm font-semibold text-plum underline">
          Associer une commande déjà passée
        </button>
        <p className="mt-1 text-xs leading-5 text-ink/60">Pour protéger vos notifications, vérifiez votre numéro avec le code secret affiché après la commande.</p>
        {showClaim&&<form onSubmit={linkOrder} className="mt-4 space-y-3">
          <label className="block text-sm">Téléphone de la commande<input required type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-sand px-4 py-3 text-base"/></label>
          <label className="block text-sm">Code secret de suivi<input required minLength={24} maxLength={24} autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^0-9A-F]/g,''))} className="mt-1 w-full rounded-xl border border-sand px-4 py-3 font-mono text-base tracking-wider"/></label>
          {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy||!clientKey} className="w-full rounded-full bg-rose py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50">{busy?'Vérification…':'Vérifier et associer'}</button>
        </form>}
      </section>

      {notifs.length>0&&<ul className="mt-6 space-y-3">
        {notifs.map((n:any)=><li key={n.id}>
          {n.notification_type==='restock'&&n.product_slug?
            <Link href={`/produit/${n.product_slug}`} onClick={()=>markRead(n.id)} className={`block w-full rounded-2xl p-4 text-left shadow-sm ${n.read?'bg-white':'bg-blush/50'}`}>
              <span className="flex items-center justify-between gap-2"><b className="font-serif text-lg text-plum">{n.title}</b>{!n.read&&<span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose"/>}</span>
              <span className="mt-1 block text-sm">{n.body}</span>
              <span className="mt-1 block text-xs font-semibold text-rose">Voir le produit →</span>
              <span className="mt-1 block text-xs text-ink/50">{new Date(n.created_at).toLocaleString('fr-FR')}</span>
            </Link>
          :
            <button type="button" onClick={()=>markRead(n.id)} className={`w-full rounded-2xl p-4 text-left shadow-sm ${n.read?'bg-white':'bg-blush/50'}`}>
              <span className="flex items-center justify-between gap-2"><b className="font-serif text-lg text-plum">{n.title}</b>{!n.read&&<span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose"/>}</span>
              <span className="mt-1 block text-sm">{n.body}</span>
              <span className="mt-1 block text-xs text-ink/50">{new Date(n.created_at).toLocaleString('fr-FR')}</span>
            </button>
          }
        </li>)}
      </ul>}
    </>}
    <p className="mt-8 text-center text-sm"><Link href="/suivi" className="underline">Suivre ma commande</Link></p>
  </div>;
}
