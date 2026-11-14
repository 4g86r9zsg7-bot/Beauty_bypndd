'use client';import {useState} from 'react';import {useCart} from '@/lib/cart';import {WA,eur} from '@/lib/supabase';import {DELIVERY,PREORDER} from '@/lib/shop';
export default function ProductBuy({p}:{p:any}){const {add,lines}=useCart();
const vs:any[]=(p.variants||[]).map((x:any)=>typeof x==='string'?{name:x}:x);
const vimgs=(x:any):string[]=>x?(x.images?.length?x.images:x.image?[x.image]:[]):[];
const imgs:string[]=p.images||[];const used=new Set(vs.flatMap(vimgs));
const gen=imgs.filter(u=>!used.has(u));const base=gen[0]||imgs[0]||vs.flatMap(vimgs)[0]||'';
const [v,setV]=useState('');const [pic,setPic]=useState<string|null>(null);const [done,setDone]=useState(false);const [ack,setAck]=useState(false);
const cur=vs.find(x=>x.name===v);const vph=vimgs(cur);const thumbs=vph.length>0?vph:gen;
const shown=(pic&&thumbs.includes(pic)?pic:null)||vph[0]||base;
const price=Number(cur?.price??p.price);const promo=cur?.price==null&&p.old_price&&p.old_price>p.price;
const pre=p.availability==='preorder';const arrival=p.availability==='arrival';
const vZero=!pre&&cur?.stock!=null&&cur.stock<=0;
const soldAll=p.availability==='soldout'||(!pre&&!arrival&&vs.length===0&&p.stock<=0);
const preWA=vZero||soldAll;const reserve=arrival&&!preWA&&(vs.length===0||cur?.stock==null);const waOrder=arrival&&!preWA&&cur?.stock!=null&&cur.stock>0;
const left=cur?.stock??p.stock;const max=pre?null:(left??null);
const inCart=(lines||[]).find((l:any)=>l.id===p.id&&l.variant===v)?.qty||0;const full=max!=null&&inCart>=max;
const needV=vs.length>0&&!v;
const status=(preWA||pre)?`Précommande : ${PREORDER}`:reserve?'Prochain arrivage':left!=null&&left>0&&left<=3?`Dernières pièces (${left} restant${left>1?'s':''})`:`Disponible immédiatement · livraison ${DELIVERY}`;
const wa=(s:string)=>`https://wa.me/${WA}?text=${encodeURIComponent(`Bonjour, ${s} : ${p.name}${v?` (${v})`:''} - ${price} DH`)}`;
const btn="block text-center w-full rounded-full py-4 text-xs tracking-[0.2em] uppercase font-semibold";
const note="mt-3 border border-plum/40 bg-blush/40 p-3 text-sm";
return <div className="grid md:grid-cols-2 gap-8">
<div><div className="aspect-[4/5] bg-sand overflow-hidden">{shown&&<img src={shown} alt={p.name} className="w-full h-full object-cover"/>}</div>
{thumbs.length>1&&<div className="flex gap-2 mt-2 overflow-x-auto">{thumbs.map(u=><button key={u} type="button" onClick={()=>setPic(u)} className={`shrink-0 w-16 h-20 border-2 ${u===shown?'border-rose':'border-transparent'}`}><img src={u} alt="" className="w-full h-full object-cover"/></button>)}</div>}</div>
<div><p className="text-sm text-ink/60">{p.brands?.name}</p><h1 className="font-serif text-3xl">{p.name}</h1>
<p className="text-xl mt-2">{eur(price)} {promo&&<><s className="text-ink/50 ml-2">{eur(p.old_price)}</s> <span className="bg-blush px-2 text-sm">-{Math.round(100-p.price/p.old_price*100)}%</span></>}</p>
<p className="mt-2 text-sm">{status}</p>
{pre&&<div className={note}><b>Précommande.</b> Cet article n’est pas en stock : il est commandé pour vous et livré après réception, avec un délai de <b>{PREORDER}</b>, confirmé par WhatsApp.</div>}
{preWA&&!needV&&<div className={note}><b>Précommande.</b> Cet article n’est pas en stock : il est commandé pour vous, avec un délai de <b>{PREORDER}</b>, confirmé par WhatsApp.</div>}
{reserve&&<div className={note}><b>Prochain arrivage.</b> Réservez cet article : nous vous prévenons par WhatsApp dès sa réception.</div>}
<div className="mt-4 space-y-3">
{vs.length>0&&<div className="flex flex-wrap gap-2">{vs.map(x=>{const off=!pre&&x.stock!=null&&x.stock<=0;const on=x.name===v;return <button key={x.name} type="button" onClick={()=>{setV(x.name);setPic(null);setDone(false)}} className={`rounded-full border px-4 py-2 text-xs ${on?'bg-plum text-white border-plum':'border-plum/40 text-plum'} ${off&&!on?'opacity-70':''}`}>{x.name}{x.price!=null?` · ${eur(Number(x.price))}`:''}{off?' · précommande':''}</button>})}</div>}
{needV?<p className="text-sm text-plum">Choisissez une variante pour voir ses photos et son prix.</p>
:preWA?<a href={wa('je souhaite précommander')} className={`${btn} bg-rose text-white`}>Précommander sur WhatsApp</a>
:reserve?<a href={wa('je souhaite réserver')} className={`${btn} bg-rose text-white`}>Réserver sur WhatsApp</a>
:waOrder?<a href={wa('je souhaite commander')} className={`${btn} bg-rose text-white`}>Commander sur WhatsApp</a>
:<>{pre&&<label className="flex gap-2 text-sm"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} className="mt-1"/><span>Je comprends que c’est une précommande et que je dois patienter {PREORDER} avant la livraison.</span></label>}
<button disabled={full||(pre&&!ack)} onClick={()=>{add({id:p.id,name:p.name,price,qty:1,image:vph[0]||base,variant:v,max,pre});setDone(true)}} className={`${btn} bg-rose text-white disabled:opacity-40`}>{full?'Stock maximum atteint':pre?'Précommander':'Ajouter au panier'}</button>
{full&&<p className="text-sm text-plum">Vous avez déjà {inCart} article{inCart>1?'s':''} dans votre panier : c’est tout le stock disponible.</p>}
{done&&!full&&<p className="text-sm">Ajouté. <a href="/panier" className="underline">Voir le panier</a></p>}
<a href={wa(pre?'je souhaite précommander':'je souhaite commander')} className={`${btn} border border-plum text-plum`}>{pre?'Précommander sur WhatsApp':'Commander sur WhatsApp'}</a></>}</div>
<p className="mt-6 whitespace-pre-line">{p.description}</p></div></div>}
