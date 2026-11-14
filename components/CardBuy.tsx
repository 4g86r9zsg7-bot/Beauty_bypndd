'use client';import {useState} from 'react';import Link from 'next/link';import {useCart} from '@/lib/cart';
export default function CardBuy({p}:{p:any}){const {add,lines}=useCart();const [ok,setOk]=useState(false);
const pre=p.availability==='preorder',arr=p.availability==='arrival';
const hasV=(p.variants||[]).length>0;const sold=p.availability==='soldout'||(!pre&&!arr&&p.stock<=0);
const base="mt-2 block w-full rounded-full border py-2.5 text-center text-[11px] uppercase tracking-[0.18em] transition";
const href=`/produit/${p.slug}`;
if(sold)return <Link href={href} className={`${base} border-ink/30 text-ink/50`}>Indisponible</Link>;
if(arr)return <Link href={href} className={`${base} border-plum text-plum`}>Réserver</Link>;
if(pre)return <Link href={href} className={`${base} border-plum text-plum`}>Précommander</Link>;
if(hasV)return <Link href={href} className={`${base} border-ink text-ink`}>Choisir les options</Link>;
const inCart=(lines||[]).find((l:any)=>l.id===p.id&&!l.variant)?.qty||0;const full=inCart>=p.stock;
return <button type="button" disabled={full} onClick={()=>{add({id:p.id,name:p.name,price:p.price,qty:1,image:p.images?.[0],variant:'',max:p.stock});setOk(true);setTimeout(()=>setOk(false),1800)}} className={`${base} border-ink ${ok?'bg-plum':'bg-ink'} text-white disabled:opacity-40`}>{full?'Stock maximum atteint':ok?'✓ Ajouté au panier':'Ajouter au panier'}</button>}
