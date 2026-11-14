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
const hasV=vs.length>0;const vst:string=cur?(cur.status||'available'):'';
let mode:'cart'|'pre'|'reserve'|'order'|'notify'='cart';
if(hasV&&cur){if(vst==='arrival')mode='reserve';else if(vst==='preorder')mode='pre';else if(vst==='soldout')mode='notify';else if(cur.stock!=null&&cur.stock<=0&&!pre)mode='pre';else if(arrival)mode='order'}
else if(!hasV){if(p.availability==='soldout'||(!pre&&!arrival&&p.stock<=0))mode='pre';else if(arrival)mode='reserve'}
const left=cur?.stock??p.stock;const max=pre?null:(left??null);
const inCart=(lines||[]).find((l:any)=>l.id===p.id&&l.variant===v)?.qty||0;const full=max!=null&&inCart>=max;
const needV=hasV&&!v;const needAck=pre&&mode==='cart';
const status=mode==='pre'||needAck?`Précommande : ${PREORDER}`:mode==='reserve'?'Prochain arrivage':mode==='notify'?'Épuisé':(vst==='last'||(left!=null&&left>0&&left<=3))?`Dernières pièces (${left} restant${left>1?'s':''})`:`Disponible immédiatement · livraison ${DELIVERY}`;
const label=(x:any)=>{const s=x.status||'available';return s==='arrival'?' · arrivage':s==='preorder'?' · précommande':s==='soldout'?' · épuisé':(!pre&&x.stock!=null&&x.stock<=0)?' · précommande':''};
const wa=(s:string)=>`https://wa.me/${WA}?text=${encodeURIComponent(`Bonjour, ${s} : ${p.name}${v?` (${v})`:''} - ${price} DH`)}`;
const btn="block text-center w-full rounded-full py-4 text-xs tracking-[0.2em] uppercase font-semibold";
const note="mt-3 border border-plum/40 bg-blush/40 p-3 text-sm";
return <div className="grid md:grid-cols-2 gap-8">
<div><div className="aspect-[4/5] bg-sand overflow-hidden">{shown&&<img src={shown} alt={p.name} className="w-full h-full object-cover"/>}</div>
{thumbs.length>1&&<div className="flex gap-2 mt-2 overflow-x-auto">{thumbs.map(u=><button key={u} type="button" onClick={()=>setPic(u)} className={`shrink-0 w-16 h-20 border-2 ${u===shown?'border-rose':'border-transparent'}`}><img src={u} alt="" className="w-full h-full object-cover"/></button>)}</div>}</div>
<div><p className="text-sm text-ink/60">{p.brands?.name}</p><h1 className="font-serif text-3xl">{p.name}</h1>
<p className="text-xl mt-2">{eur(price)} {promo&&<><s className="text-ink/50 ml-2">{eur(p.old_price)}</s> <span className="bg-blush px-2 text-sm">-{Math.round(100-p.price/p.old_price*100)}%</span></>}</p>
{!needV&&<p className="mt-2 text-sm">{status}</p>}
{!needV&&(mode==='pre'||needAck)&&<div className={note}><b>Précommande.</b> Cet article n’est pas en stock : il est commandé pour vous, avec un délai de <b>{PREORDER}</b>, confirmé par WhatsApp.</div>}
{!needV&&mode==='reserve'&&<div className={note}><b>Prochain arrivage.</b> Réservez cet article : nous vous prévenons par WhatsApp dès sa réception.</div>}
{!needV&&mode==='notify'&&<div className={note}><b>Épuisé.</b> Écrivez-nous pour être prévenue de son retour.</div>}
<div className="mt-4 space-y-3">
{hasV&&<div className="flex flex-wrap gap-2">{vs.map(x=>{const on=x.name===v;return <button key={x.name} type="button" onClick={()=>{setV(x.name);setPic(null);setDone(false);setAck(false)}} className={`rounded-full border px-4 py-2 text-xs ${on?'bg-plum text-white border-plum':'border-plum/40 text-plum'}`}>{x.name}{x.price!=null?` · ${eur(Number(x.price))}`:''}{label(x)}</button>})}</div>}
{needV?<p className="text-sm text-plum">Choisissez une variante pour voir ses photos, son prix et sa disponibilité.</p>
:mode==='pre'?<a href={wa('je souhaite précommander')} className={`${btn} bg-rose text-white`}>Précommander sur WhatsApp</a>
:mode==='reserve'?<a href={wa('je souhaite réserver')} className={`${btn} bg-rose text-white`}>Réserver sur WhatsApp</a>
:mode==='notify'?<a href={wa('je souhaite être prévenue du retour de')} className={`${btn} bg-rose text-white`}>Me prévenir sur WhatsApp</a>
:mode==='order'?<a href={wa('je souhaite commander')} className={`${btn} bg-rose text-white`}>Commander sur WhatsApp</a>
:<>{needAck&&<label className="flex gap-2 text-sm"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} className="mt-1"/><span>Je comprends que c’est une précommande et que je dois patienter {PREORDER} avant la livraison.</span></label>}
<button disabled={full||(needAck&&!ack)} onClick={()=>{add({id:p.id,name:p.name,price,qty:1,image:vph[0]||base,variant:v,max,pre});setDone(true)}} className={`${btn} bg-rose text-white disabled:opacity-40`}>{full?'Stock maximum atteint':needAck?'Précommander':'Ajouter au panier'}</button>
{full&&<p className="text-sm text-plum">Vous avez déjà {inCart} article{inCart>1?'s':''} dans votre panier : c’est tout le stock disponible.</p>}
{done&&!full&&<p className="text-sm">Ajouté. <a href="/panier" className="underline">Voir le panier</a></p>}
<a href={wa(needAck?'je souhaite précommander':'je souhaite commander')} className={`${btn} border border-plum text-plum`}>{needAck?'Précommander sur WhatsApp':'Commander sur WhatsApp'}</a></>}</div>
<p className="mt-6 whitespace-pre-line">{p.description}</p></div></div>}
