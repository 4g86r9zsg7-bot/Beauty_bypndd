'use client';import {useState} from 'react';import {WA} from '@/lib/supabase';
const dh=(n:number)=>new Intl.NumberFormat('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+' DH';
export default function SheinForm(){
const [link,setLink]=useState('');const [price,setPrice]=useState('');const [r,setR]=useState<any>(null);const [err,setErr]=useState('');const [busy,setBusy]=useState(false);
const inp="w-full rounded-xl border border-sand bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-rose";const card="rounded-2xl bg-white p-5 shadow-sm";
async function calc(e:any){e.preventDefault();setErr('');setR(null);
if(!/^https?:\/\//i.test(link.trim())||!/shein/i.test(link))return setErr('Collez un lien de panier SHEIN valide (il doit commencer par https://).');
setBusy(true);const res=await fetch('/api/shein',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({price})});setBusy(false);
if(!res.ok)return setErr('Montant invalide. Indiquez le prix de vente de votre panier en euros.');setR(await res.json())}
const msg=r?`Bonjour, je souhaite faire une précommande SHEIN.\nLien du panier : ${link.trim()}\nTotal de mon panier : ${dh(r.total)}\nAcompte à verser : ${dh(r.avance)}\nSolde à la réception : ${dh(r.solde)}\nLivraison estimée : ${r.delai}\nJe joins une capture d’écran de mon panier.`:'';
return <div className="mx-auto max-w-xl"><h1 className="font-serif text-4xl text-plum">Précommande SHEIN</h1><p className="mt-2 text-sm text-ink/70">Collez le lien de votre panier SHEIN et découvrez immédiatement votre prix final en dirhams.</p>
<form onSubmit={calc} className={`${card} mt-5 grid gap-4`}>
<label className="text-sm font-medium text-plum">Lien de votre panier SHEIN<input required type="url" inputMode="url" placeholder="https://…" value={link} onChange={e=>setLink(e.target.value)} className={`${inp} mt-1`}/></label>
<label className="text-sm font-medium text-plum">Prix de vente de votre panier (en €)<input required type="text" inputMode="decimal" placeholder="Ex : 150" value={price} onChange={e=>setPrice(e.target.value)} className={`${inp} mt-1`}/>
<span className="mt-1 block text-xs font-normal text-ink/60">Indiquez le <b>prix de vente (Selling Price)</b> de vos articles, <b>avant coupons et réductions</b>. Envoyez-nous aussi une capture d’écran de votre panier sur WhatsApp.</span></label>
<button disabled={busy} className="rounded-full bg-rose py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50">{busy?'Calcul…':'Calculer mon prix'}</button>{err&&<p className="text-sm text-red-700">{err}</p>}</form>
{r&&<div className={`${card} mt-5`}><h2 className="font-serif text-2xl text-plum">Votre précommande</h2>
<p className="mt-4 flex items-baseline justify-between border-b border-sand pb-3"><span>Total de votre panier</span><b className="font-serif text-3xl text-plum">{dh(r.total)}</b></p>
<p className="flex justify-between border-b border-sand py-3 text-sm"><span>Acompte à verser</span><b>{dh(r.avance)}</b></p><p className="flex justify-between border-b border-sand py-3 text-sm"><span>Solde à la réception</span><b>{dh(r.solde)}</b></p><p className="flex justify-between py-3 text-sm"><span>Livraison estimée</span><b>{r.delai}</b></p>
<ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-ink/70"><li>Un acompte de 50 % est obligatoire pour valider la précommande.</li><li>Votre commande SHEIN n’est passée qu’après réception de l’acompte.</li><li>Le solde est à régler à la réception du colis.</li><li>L’envoi du message WhatsApp ne vaut pas confirmation : la précommande est validée après réception de l’acompte.</li></ul>
<div className="mt-5 grid gap-3 sm:grid-cols-2"><a href={`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`} className="rounded-full bg-rose py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white">J’accepte, continuer sur WhatsApp</a><button type="button" onClick={()=>{setR(null);setPrice('')}} className="rounded-full border border-plum py-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum">Refuser</button></div></div>}</div>}
