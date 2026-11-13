'use client';import {useEffect,useRef} from 'react';import Link from 'next/link';import {eur} from '@/lib/supabase';
export default function ProductScroller({items}:{items:any[]}){
const ref=useRef<HTMLDivElement>(null);const pause=useRef(false);
useEffect(()=>{const el=ref.current;if(!el)return;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const id=setInterval(()=>{if(pause.current)return;const first=el.firstElementChild as HTMLElement|null;const step=first?first.offsetWidth+12:156;
if(el.scrollLeft+el.clientWidth>=el.scrollWidth-4)el.scrollTo({left:0,behavior:'smooth'});else el.scrollBy({left:step,behavior:'smooth'})},2500);
return()=>clearInterval(id)},[]);
const hold=()=>{pause.current=true};const release=()=>{setTimeout(()=>{pause.current=false},4000)};
return <div ref={ref} onTouchStart={hold} onTouchEnd={release} onMouseEnter={hold} onMouseLeave={release} className="mt-6 -mx-6 px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
{items.map(p=><Link key={p.id} href={`/produit/${p.slug}`} className="snap-start shrink-0 w-36">
<div className="aspect-[4/5] bg-white/10 overflow-hidden rounded-sm">{p.images?.[0]&&<img src={p.images[0]} alt={p.name} loading="lazy" className="w-full h-full object-cover"/>}</div>
<p className="mt-2 text-xs line-clamp-2">{p.name}</p><p className="text-sm font-semibold">{eur(p.price)}</p></Link>)}</div>}
