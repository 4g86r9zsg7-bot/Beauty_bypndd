'use client';import {useEffect,useState} from 'react';import {useCart} from '@/lib/cart';import {supabase,eur,WA} from '@/lib/supabase';import Suggestions from '@/components/Suggestions';import {DELIVERY,PREORDER} from '@/lib/shop';
export default function Panier(){const {lines,setQty,remove,clear,subtotal}=useCart();const [cfg,setCfg]=useState<any>(null);const [f,setF]=useState({name:'',phone:'',address:'',city:'',notes:'',promo:''});
const [err,setErr]=useState('');const [ack,setAck]=useState(false);const [busy,setBusy]=useState(false);const [order,setOrder]=useState<any>(null);
useEffect(()=>{supabase.from('settings').select('value').eq('key','delivery').single().then(({data})=>setCfg(data?.value))},[]);
const zones=cfg?.zones||[];const fee0=zones.find((z:any)=>z.city.toLowerCase()===f.city.trim().toLowerCase())?.fee??zones.find((z:any)=>z.city==='*')?.fee??0;
const fee=cfg&&subtotal>=cfg.free_over?0:fee0;const cur=cfg?.currency||'EUR';
const set=(k:string)=>(e:any)=>setF({...f,[k]:e.target.value});
async function submit(e:any){e.preventDefault();setErr('');setBusy(true);
const {data,error}=await supabase.rpc('place_order',{p_c:f,p_items:lines.map((l:any)=>({id:l.id,qty:l.qty,variant:l.variant})),p_promo:f.promo});setBusy(false);
if(error)return setErr(error.message);setOrder(data);clear()}
if(order){const items=(order.items||[]).map((i:any)=>`${i.qty}x ${i.name}${i.variant?` (${i.variant})`:''}${i.preorder?' [PRÉCOMMANDE]':''}`).join(', ');
const txt=encodeURIComponent(`Nouvelle commande #${order.number} - ${order.name} (${order.phone}) - ${order.address}, ${order.city} - ${items} - Total ${order.total} ${cur} - Paiement à la livraison`);
return <><div className="text-center py-10"><h1 className="font-serif text-3xl">Commande #{order.number} enregistrée</h1><p className="mt-2">Total à payer à la livraison : {eur(order.total,cur)}</p>
<a href={`https://wa.me/${WA}?text=${txt}`} className="inline-block mt-6 bg-ink text-white px-6 py-3">Confirmer sur WhatsApp</a></div><Suggestions title="Découvrez aussi" limit={4}/></>}
if(!lines.length)return <><p className="py-10 text-center">Votre panier est vide.</p><Suggestions title="Nos produits en stock" limit={8}/></>;
return <><form onSubmit={submit} className="grid md:grid-cols-2 gap-8"><div><h1 className="font-serif text-3xl mb-4">Panier</h1>
{lines.map((l:any,i:number)=><div key={i} className="flex gap-3 py-3 border-b border-sand">{l.image&&<img src={l.image} alt="" className="w-16 h-20 object-cover"/>}
<div className="flex-1"><p className="font-serif">{l.name}</p>{l.variant&&<p className="text-xs">{l.variant}</p>}{l.pre&&<p className="text-xs text-plum">Précommande : {PREORDER} d’attente</p>}<p className="text-sm">{eur(l.price,cur)}</p>
<div className="flex items-center gap-2 mt-1"><button type="button" onClick={()=>setQty(i,l.qty-1)} className="border px-2">−</button>{l.qty}<button type="button" onClick={()=>setQty(i,l.qty+1)} disabled={l.max!=null&&l.qty>=l.max} className="border px-2 disabled:opacity-30">+</button>
<button type="button" onClick={()=>remove(i)} className="ml-3 text-xs underline">Retirer</button></div>{l.max!=null&&l.qty>=l.max&&<p className="text-xs text-plum mt-1">Quantité maximale disponible</p>}</div></div>)}
<div className="mt-4 text-sm space-y-1"><p>Sous-total : {eur(subtotal,cur)}</p><p>Livraison : {fee?eur(fee,cur):'Offerte'}</p><p className="font-semibold">Total estimé : {eur(subtotal+fee,cur)}</p><p className="text-xs">Le code promo est appliqué à la validation.</p><p className="text-xs">Livraison à domicile en {DELIVERY}.</p></div></div>
<div className="space-y-3"><h2 className="font-serif text-2xl">Livraison</h2>
{[['name','Nom et prénom'],['phone','Téléphone'],['address','Adresse de livraison'],['city','Ville']].map(([k,l])=><input key={k} required placeholder={l} value={(f as any)[k]} onChange={set(k)} className="w-full border border-sand bg-white p-3"/>)}
<textarea placeholder="Instructions de livraison (facultatif)" value={f.notes} onChange={set('notes')} className="w-full border border-sand bg-white p-3"/>
<input placeholder="Code promo" value={f.promo} onChange={set('promo')} className="w-full border border-sand bg-white p-3"/>
{lines.some((l:any)=>l.pre)&&<label className="flex gap-2 border border-plum/40 bg-blush/40 p-3 text-sm"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} required className="mt-1"/><span>Ma commande contient des articles en <b>précommande</b> : je comprends qu’ils ne sont pas en stock et que je dois patienter {PREORDER} avant la livraison. Le délai m’est confirmé par WhatsApp.</span></label>}
<p className="text-sm">Paiement à la livraison (COD)</p>{err&&<p className="text-red-700 text-sm">{err}</p>}
<button disabled={busy} className="w-full bg-ink text-white py-3 disabled:opacity-50">{busy?'Envoi…':'Valider la commande'}</button></div></form>
<Suggestions title="Complétez votre commande" excludeCart limit={4}/></>}
