'use client';import {useState} from 'react';import {useCart} from '@/lib/cart';import {WA} from '@/lib/supabase';
export default function AddToCart({p}:{p:any}){const {add}=useCart();
const vs:{name:string;stock:number|null}[]=(p.variants||[]).map((x:any)=>typeof x==='string'?{name:x,stock:null}:{name:x.name,stock:x.stock??null});
const first=vs.find(x=>x.stock===null||x.stock>0)||vs[0];const [v,setV]=useState(first?.name||'');const [done,setDone]=useState(false);
const pre=p.availability==='preorder';const arrival=p.availability==='arrival';
const cur=vs.find(x=>x.name===v);const vOut=!pre&&!!cur&&cur.stock!==null&&cur.stock<=0;
const out=p.availability==='soldout'||vOut||(!pre&&!arrival&&p.stock<=0);const blocked=out||arrival;
const wa=(s:string)=>`https://wa.me/${WA}?text=${encodeURIComponent(`Bonjour, ${s} : ${p.name}${v?` (${v})`:''} - ${p.price} DH`)}`;
const btn="block text-center w-full rounded-full py-4 text-xs tracking-[0.2em] uppercase font-semibold";
return <div className="mt-4 space-y-3">{vs.length>0&&<select value={v} onChange={e=>{setV(e.target.value);setDone(false)}} className="border border-sand bg-white p-3 w-full">{vs.map(x=><option key={x.name} value={x.name}>{x.name}{x.stock!==null&&x.stock<=0&&!pre?' (épuisé)':''}</option>)}</select>}
{blocked?<><p className="text-sm text-plum">{arrival?'Arrivage prochainement. Réservez le vôtre dès maintenant.':vOut?'Cette variante est momentanément épuisée. Réservez-la dès maintenant.':'Produit momentanément épuisé. Réservez le vôtre dès maintenant.'}</p><a href={wa('je souhaite précommander')} className={`${btn} bg-rose text-white`}>Précommander sur WhatsApp</a></>
:<><button onClick={()=>{add({id:p.id,name:p.name,price:p.price,qty:1,image:p.images?.[0],variant:v});setDone(true)}} className={`${btn} bg-rose text-white`}>{pre?'Précommander':'Ajouter au panier'}</button>
{done&&<p className="text-sm">Ajouté. <a href="/panier" className="underline">Voir le panier</a></p>}
<a href={wa('je souhaite commander')} className={`${btn} border border-plum text-plum`}>Commander sur WhatsApp</a></>}</div>}
