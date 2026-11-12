'use client';import {useState} from 'react';import {useCart} from '@/lib/cart';import {WA} from '@/lib/supabase';
export default function AddToCart({p}:{p:any}){const {add}=useCart();const vs:string[]=p.variants||[];const [v,setV]=useState(vs[0]||'');const [done,setDone]=useState(false);
const out=p.availability==='soldout';
const msg=encodeURIComponent(`Bonjour, je souhaite commander : ${p.name}${v?` (${v})`:''} - ${p.price}`);
return <div className="mt-4 space-y-3">{vs.length>0&&<select value={v} onChange={e=>setV(e.target.value)} className="border border-sand bg-white p-3 w-full">{vs.map(x=><option key={x}>{x}</option>)}</select>}
<button disabled={out} onClick={()=>{add({id:p.id,name:p.name,price:p.price,qty:1,image:p.images?.[0],variant:v});setDone(true)}} className="w-full bg-ink text-white py-3 disabled:opacity-40">{out?'Stock épuisé':p.availability==='preorder'?'Précommander':'Ajouter au panier'}</button>
{done&&<p className="text-sm">Ajouté. <a href="/panier" className="underline">Voir le panier</a></p>}
<a href={`https://wa.me/${WA}?text=${msg}`} className="block text-center border border-ink py-3">Commander sur WhatsApp</a></div>}
