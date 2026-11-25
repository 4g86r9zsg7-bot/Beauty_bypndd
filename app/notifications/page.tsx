'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useClient} from '@/components/ClientProvider';

export default function Notifications(){
  const {clientKey,notifs,unread,markRead,claimOrderNotifications}=useClient();
  const [phone,setPhone]=useState('');
  const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const claim=async(e:any)=>{
    e.preventDefault();setBusy(true);setMessage('');setError('');
    const result=await claimOrderNotifications(phone,code);
    setBusy(false);
    if(result.error)setError('Numéro ou code secret incorrect. Vérifiez les informations de votre commande.');
    else{setMessage('Commande associée. Vos notifications disponibles ont été actualisées.');setCode('');}
  };
  const bell=<span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blush text-plum"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 17h12l-1.6-2.2V10a4.4 4.4 0 0 0-8.8 0v4.8z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></span>;
  return <div className="mx-auto max-w-xl">
    <div className="flex items-end justify-between">
      <h1 className="font-serif text-4xl text-plum">Mes notifications</h1>
      {unread>0&&<button type="button" onClick={()=>markRead(null)} className="text-xs text-plum underline">Tout marquer comme lu</button>}
    </div>
    {!clientKey?
      <div className="py-14 text-center text-sm text-ink/60">Préparation de votre espace sécurisé…</div>
    :notifs.length===0?
      <div className="py-10 text-center">{bell}<p className="mt-5 font-serif text-2xl text-plum">Aucune notification disponible</p><p className="mt-1 text-sm text-ink/60">Pour retrouver les notifications d’une commande passée, associez-la avec votre numéro et son code secret.</p></div>
    :
      <ul className="mt-6 space-y-3">
        {notifs.map((n:any)=><li key={n.id}>
          {n.notification_type==='restock'&&n.product_slug?
            <Link href={'/produit/'+n.product_slug} onClick={()=>markRead(n.id)} className={'block w-full rounded-2xl p-4 text-left shadow-sm '+(n.read?'bg-white':'bg-blush/50')}>
              <span className="flex items-center justify-between gap-2"><b className="font-serif text-lg text-plum">{n.title}</b>{!n.read&&<span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose"/>}</span>
              <span className="mt-1 block text-sm">{n.body}</span>
              <span className="mt-1 block text-xs font-semibold text-rose">Voir le produit →</span>
              <span className="mt-1 block text-xs text-ink/50">{new Date(n.created_at).toLocaleString('fr-FR')}</span>
            </Link>
          :
            <button type="button" onClick={()=>markRead(n.id)} className={'w-full rounded-2xl p-4 text-left shadow-sm '+(n.read?'bg-white':'bg-blush/50')}>
              <span className="flex items-center justify-between gap-2"><b className="font-serif text-lg text-plum">{n.title}</b>{!n.read&&<span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose"/>}</span>
              <span className="mt-1 block text-sm">{n.body}</span>
              <span className="mt-1 block text-xs text-ink/50">{new Date(n.created_at).toLocaleString('fr-FR')}</span>
            </button>
          }
        </li>)}
      </ul>
    }
    <section className="mt-8 rounded-2xl border border-sand bg-white p-5">
      <h2 className="font-serif text-xl text-plum">Retrouver une ancienne commande</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">Le numéro seul ne donne jamais accès aux notifications. Saisissez le numéro de la commande et le code secret de 24 caractères remis après son enregistrement.</p>
      <form onSubmit={claim} className="mt-4 space-y-3">
        <label className="block text-sm text-ink/70">Numéro de téléphone
          <input required type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-sand px-4 py-3 text-base"/>
        </label>
        <label className="block text-sm text-ink/70">Code secret de la commande
          <input required minLength={24} maxLength={24} autoCapitalize="characters" autoComplete="off" value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g,''))} placeholder="24 caractères" className="mt-1 w-full rounded-xl border border-sand px-4 py-3 font-mono text-base tracking-wider"/>
        </label>
        {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
        {message&&<p role="status" className="text-sm text-green-700">{message}</p>}
        <button disabled={busy||code.length!==24||!clientKey} className="w-full rounded-full bg-rose py-3.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50">{busy?'Vérification…':'Associer ma commande'}</button>
      </form>
    </section>
    <p className="mt-8 text-center text-sm"><Link href="/suivi" className="underline">Suivre ma commande</Link></p>
  </div>;
}
