'use client';import {useState} from 'react';
export default function HeroPhoto(){const [ok,setOk]=useState(true);
if(!ok)return null;
return <section className="-mx-4 -mt-6 overflow-hidden bg-sand"><div className="aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
<img src="/banniere.jpg.jpg" alt="Maquillage, soins et parfums de grandes marques" loading="eager" decoding="async" onError={()=>setOk(false)} className="h-full w-full object-cover"/></div></section>}
