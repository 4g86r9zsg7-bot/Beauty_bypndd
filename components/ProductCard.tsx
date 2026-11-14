import Link from 'next/link';import {eur} from '@/lib/supabase';
export default function ProductCard({p}:{p:any}){
const imgs:string[]=p.images||[];const promo=p.old_price&&p.old_price>p.price;const off=promo?Math.round(100-p.price/p.old_price*100):0;
const pre=p.availability==='preorder',arr=p.availability==='arrival';
const sold=p.availability==='soldout'||(!pre&&!arr&&p.stock<=0);const inStock=!sold&&!pre&&!arr;
const tag="px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase leading-none";
const order=sold||arr||pre;
return <Link href={`/produit/${p.slug}`} className="group block">
<div className="relative aspect-[4/5] overflow-hidden bg-sand">
{imgs[0]&&<img src={imgs[0]} alt={p.name} loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${imgs[1]?'group-hover:opacity-0':'group-hover:scale-105'} ${sold?'opacity-60':''}`}/>}
{imgs[1]&&<img src={imgs[1]} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100"/>}
<div className="absolute left-2 top-2 flex flex-col items-start gap-1">
{sold&&<span className={`${tag} bg-white text-ink`}>Épuisé</span>}
{arr&&<span className={`${tag} bg-deep text-white`}>Arrivage</span>}
{pre&&<span className={`${tag} bg-deep text-white`}>Précommande</span>}
{!sold&&promo&&<span className={`${tag} bg-rose text-white`}>-{off}%</span>}
{!sold&&p.is_new&&<span className={`${tag} bg-white text-plum`}>Nouveau</span>}
{!sold&&p.is_bestseller&&<span className={`${tag} bg-plum text-white`}>Best-seller</span>}
</div></div>
<div className="pt-3">
<p className="truncate text-[10px] uppercase tracking-[0.2em] text-plum/70">{p.brands?.name||'\u00a0'}</p>
<p className="mt-1 min-h-[2.6em] font-serif text-[17px] leading-snug text-ink line-clamp-2">{p.name}</p>
<p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm"><span className={`font-semibold ${promo&&!sold?'text-rose':'text-ink'}`}>{eur(p.price)}</span>{promo&&<s className="text-xs text-ink/50">{eur(p.old_price)}</s>}</p>
<p className="mt-1 h-4 text-[11px]">{inStock&&(p.availability==='last'?<span className="text-rose">Stock limité</span>:<span className="text-green-700">● En stock</span>)}</p>
<span className={`mt-2 block rounded-full border py-2.5 text-center text-[11px] uppercase tracking-[0.18em] transition ${order?'border-plum text-plum group-hover:bg-plum group-hover:text-white':'border-ink text-ink group-hover:bg-ink group-hover:text-white'}`}>{order?'Précommander':'Voir le produit'}</span>
</div></Link>}
