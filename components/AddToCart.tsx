'use client';import {useState} from 'react';import {useCart} from '@/lib/cart';import {WA} from '@/lib/supabase';
export default function AddToCart({p}:{p:any}){const {add}=useCart();const vs:string[]=p.variants||[];const [v,setV]=useState(vs[0]||'');const [done,setDone]=useState(false);
const pre=p.availability==='preorder';const arrival=p.availability==='arrival';
const out=p.availability==='soldout'||(!pre&&!arrival&&p.stock<=0);const blocked=out||arrival;
const msg=encodeURIComponent(`Bonjour, ${arrival?'je souhaite être prévenue de l’arrivage de':out?'je souhaite être prévenue du retour de':'je souhaite commander'} : ${p.name}${v?` (${v})`:''} - ${p.price} DH`);
return <div className="mt-4 space-y-3">{vs.length>0&&<select value={v} onChange={e=>setV(e.target.value)} className="border border-sand bg-white p-3 w-full">{vs.map(x=><option key={x}>{x}</option>)}</select>}
<button disabled={blocked} onClick={()=>{add({id:p.id,name:p.name,price:p.price,qty:1,image:p.images?.[0],variant:v});setDone(true)}} className="w-full bg-rose text-white rounded-full py-4 text-xs tracking-[0.2em] uppercase font-semibold disabled:opacity-40">{out?'Stock épuisé':arrival?'Arrivage prochainement':pre?'Précommander':'Ajouter au panier'}</button>
{done&&<p className="text-sm">Ajouté. <a href="/panier" className="underline">Voir le panier</a></p>}
<a href={`https://wa.me/${WA}?text=${msg}`} className="block text-center border border-plum text-plum rounded-full py-4 text-xs tracking-[0.2em] uppercase font-semibold">{blocked?'Me prévenir sur WhatsApp':'Commander sur WhatsApp'}</a></div>}
