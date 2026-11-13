'use client';import {useState} from 'react';import {useCart} from '@/lib/cart';import {WA} from '@/lib/supabase';
export default function AddToCart({p}:{p:any}){const {add}=useCart();const vs:string[]=p.variants||[];const [v,setV]=useState(vs[0]||'');const [done,setDone]=useState(false);
const pre=p.availability==='preorder';const arrival=p.availability==='arrival';
const out=p.availability==='soldout'||(!pre&&!arrival&&p.stock<=0);const blocked=out||arrival;
const wa=(s:string)=>`https://wa.me/${WA}?text=${encodeURIComponent(`Bonjour, ${s} : ${p.name}${v?` (${v})`:''} - ${p.price} DH`)}`;
const btn="block text-center w-full rounded-full py-4 text-xs tracking-[0.2em] uppercase font-semibold";
return <div className="mt-4 space-y-3">{vs.length>0&&<select value={v} onChange={e=>setV(e.target.value)} className="border border-sand bg-white p-3 w-full">{vs.map(x=><option key={x}>{x}</option>)}</select>}
{blocked?<><p className="text-sm text-plum">{arrival?'Arrivage prochainement. Réservez le vôtre dès maintenant.':'Produit momentanément épuisé. Réservez le vôtre dès maintenant.'}</p><a href={wa('je souhaite précommander')} className={`${btn} bg-rose text-white`}>Précommander sur WhatsApp</a></>
:<><button onClick={()=>{add({id:p.id,name:p.name,price:p.price,qty:1,image:p.images?.[0],variant:v});setDone(true)}} className={`${btn} bg-rose text-white`}>{pre?'Précommander':'Ajouter au panier'}</button>
{done&&<p className="text-sm">Ajouté. <a href="/panier" className="underline">Voir le panier</a></p>}
<a href={wa('je souhaite commander')} className={`${btn} border border-plum text-plum`}>Commander sur WhatsApp</a></>}</div>}
