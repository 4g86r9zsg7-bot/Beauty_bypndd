'use client';import {useState} from 'react';import {useCart} from '@/lib/cart';import {WA,eur} from '@/lib/supabase';
export default function ProductBuy({p}:{p:any}){const {add}=useCart();
const vs:any[]=(p.variants||[]).map((x:any)=>typeof x==='string'?{name:x}:x);
const first=vs.find(x=>x.stock==null||x.stock>0)||vs[0];
const [v,setV]=useState<string>(first?.name||'');const [pic,setPic]=useState<string|null>(null);const [done,setDone]=useState(false);
const cur=vs.find(x=>x.name===v);const imgs:string[]=p.images||[];const shown=pic||cur?.image||imgs[0]||'';
const price=Number(cur?.price??p.price);const promo=cur?.price==null&&p.old_price&&p.old_price>p.price;
const pre=p.availability==='preorder';const arrival=p.availability==='arrival';
const left=cur?.stock??p.stock;const vOut=!pre&&cur?.stock!=null&&cur.stock<=0;
const out=p.availability==='soldout'||vOut||(!pre&&!arrival&&p.stock<=0);const blocked=out||arrival;
const status=arrival?'Arrivage prochainement':out?'Épuisé, précommande possible':pre?'Précommande':left<=3?`Dernières pièces (${left} restant${left>1?'s':''})`:'Disponible immédiatement';
const wa=(s:string)=>`https://wa.me/${WA}?text=${encodeURIComponent(`Bonjour, ${s} : ${p.name}${v?` (${v})`:''} - ${price} DH`)}`;
const btn="block text-center w-full rounded-full py-4 text-xs tracking-[0.2em] uppercase font-semibold";
return <div className="grid md:grid-cols-2 gap-8">
<div><div className="aspect-[4/5] bg-sand overflow-hidden">{shown&&<img src={shown} alt={p.name} className="w-full h-full object-cover"/>}</div>
{imgs.length>1&&<div className="flex gap-2 mt-2 overflow-x-auto">{imgs.map(u=><button key={u} type="button" onClick={()=>setPic(u)} className={`shrink-0 w-16 h-20 border-2 ${u===shown?'border-rose':'border-transparent'}`}><img src={u} alt="" className="w-full h-full object-cover"/></button>)}</div>}</div>
<div><p className="text-sm text-ink/60">{p.brands?.name}</p><h1 className="font-serif text-3xl">{p.name}</h1>
<p className="text-xl mt-2">{eur(price)} {promo&&<><s className="text-ink/50 ml-2">{eur(p.old_price)}</s> <span className="bg-blush px-2 text-sm">-{Math.round(100-p.price/p.old_price*100)}%</span></>}</p>
<p className="mt-2 text-sm">{status}</p>
<div className="mt-4 space-y-3">{vs.length>0&&<select value={v} onChange={e=>{setV(e.target.value);setPic(null);setDone(false)}} className="border border-sand bg-white p-3 w-full">{vs.map(x=><option key={x.name} value={x.name}>{x.name}{x.price!=null?` · ${eur(Number(x.price))}`:''}{x.stock!=null&&x.stock<=0&&!pre?' (épuisé)':''}</option>)}</select>}
{blocked?<a href={wa('je souhaite précommander')} className={`${btn} bg-rose text-white`}>Précommander sur WhatsApp</a>
:<><button onClick={()=>{add({id:p.id,name:p.name,price,qty:1,image:cur?.image||imgs[0],variant:v});setDone(true)}} className={`${btn} bg-rose text-white`}>{pre?'Précommander':'Ajouter au panier'}</button>
{done&&<p className="text-sm">Ajouté. <a href="/panier" className="underline">Voir le panier</a></p>}
<a href={wa('je souhaite commander')} className={`${btn} border border-plum text-plum`}>Commander sur WhatsApp</a></>}</div>
<p className="mt-6 whitespace-pre-line">{p.description}</p></div></div>}
