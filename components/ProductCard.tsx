import Link from 'next/link';import {eur} from '@/lib/supabase';
export default function ProductCard({p}:{p:any}){const promo=p.old_price&&p.old_price>p.price;const off=promo?Math.round(100-p.price/p.old_price*100):0;
const pre=p.availability==='preorder',arr=p.availability==='arrival';
const sold=p.availability==='soldout'||(!pre&&!arr&&p.stock<=0);const inStock=!sold&&!pre&&!arr;
const badges=[sold&&'Épuisé',arr&&'Arrivage',pre&&'Précommande',!sold&&p.is_new&&'Nouveau',!sold&&p.is_bestseller&&'Best-seller',!sold&&promo&&`Promo -${off}%`,inStock&&p.availability==='last'&&'Stock limité'].filter(Boolean);
return <Link href={`/produit/${p.slug}`} className={`block ${sold?'opacity-60':''}`}><div className="relative aspect-[4/5] bg-sand overflow-hidden rounded-sm">
{p.images?.[0]&&<img src={p.images[0]} alt={p.name} loading="lazy" className="w-full h-full object-cover"/>}
<div className="absolute top-2 left-2 flex flex-col gap-1">{badges.map((b:any)=><span key={b} className="bg-blush text-ink text-xs px-2 py-0.5">{b}</span>)}</div></div>
<p className="text-xs mt-2 text-ink/60">{p.brands?.name}</p><p className="font-serif leading-tight">{p.name}</p>
<p className="text-sm">{eur(p.price)} {promo&&<s className="text-ink/50 ml-1">{eur(p.old_price)}</s>}</p>
{inStock&&<p className="text-[11px] mt-0.5 text-green-700">● En stock</p>}</Link>}
