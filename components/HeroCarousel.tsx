
'use client';

import type {ReactNode} from 'react';
import {useEffect,useState} from 'react';
import Link from 'next/link';

export default function HeroCarousel({src,search}:{src:string;search:ReactNode}){
  const [active,setActive]=useState(0);

  useEffect(()=>{
    const timer=setInterval(()=>{
      setActive(current=>(current+1)%3);
    },5000);
    return ()=>clearInterval(timer);
  },[]);

  const slides=[
    {
      eyebrow:'Nouveauté exclusive',
      title:'Le luxe à petit prix',
      subtitle:'Votre beauté, vos marques préférées, vos petits prix.',
      button:'Voir les nouveautés',
      href:'/categorie/nouveautes',
      second:'Voir les bonnes affaires',
      secondHref:'/categorie/promotions'
    },
    {
      eyebrow:'Les dernières tendances',
      title:'Vos nouveautés beauté',
      subtitle:'Découvrez les dernières pépites et trouvez vos prochains coups de cœur.',
      button:'Découvrir les nouveautés',
      href:'/categorie/nouveautes',
      second:'Nos coups de cœur',
      secondHref:'/categorie/coups-de-coeur'
    },
    {
      eyebrow:'Des offres à ne pas manquer',
      title:'Faites-vous plaisir',
      subtitle:'Découvrez nos packs et nos offres exclusives à prix avantageux.',
      button:'Découvrir les offres',
      href:'/offres',
      second:'Voir les promotions',
      secondHref:'/categorie/promotions'
    }
  ];

  return (
    <section className="relative left-1/2 z-10 w-screen -translate-x-1/2 overflow-hidden bg-[#14040c] text-white lg:-mt-6">
      <div className="relative min-h-[610px] md:min-h-[540px]">
        {slides.map((slide,index)=>(
          <div
            key={index}
            aria-hidden={active!==index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              active===index
                ?'translate-x-0 opacity-100'
                :index<active
                  ?'-translate-x-8 opacity-0'
                  :'translate-x-8 opacity-0'
            }`}
            style={{pointerEvents:active===index?'auto':'none'}}
          >
            {index===0?(
              <>
                <div className="absolute inset-0" style={{background:'radial-gradient(60% 70% at 78% 35%,rgba(238,111,176,.28),transparent 62%),radial-gradient(45% 55% at 12% 90%,rgba(142,63,104,.5),transparent 65%),linear-gradient(118deg,#14040c 0%,#3B0F27 38%,#5b1239 58%,#2a0a1b 80%,#12040b 100%)'}}/>
                <img src={src} alt="" aria-hidden="true" fetchPriority="high" decoding="async" className="absolute bottom-0 left-0 h-[280px] w-full object-cover object-[50%_40%] opacity-80 mix-blend-lighten md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:w-[62%] md:object-[55%_50%]"/>
              </>
            ):index===1?(
              <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#26091b] via-[#6b2147] to-[#17050e]">
                <div className="absolute -right-16 top-4 h-72 w-72 rounded-full border border-[#EE6FB0]/30 md:right-[8%] md:top-[-5rem] md:h-[32rem] md:w-[32rem]"/>
                <div className="absolute -right-5 top-16 h-56 w-56 rounded-full bg-[#EE6FB0]/20 blur-3xl md:right-[15%] md:top-20 md:h-80 md:w-80"/>
                <div className="absolute bottom-[-6rem] right-[10%] h-72 w-72 rounded-full border border-white/15"/>
                <div className="absolute right-[12%] top-[28%] hidden -rotate-12 font-serif text-[13rem] text-white/10 md:block">✧</div>
                <div className="absolute bottom-12 right-[12%] hidden font-serif text-7xl italic text-[#EE6FB0]/70 md:block">Beauty</div>
              </div>
            ):(
              <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#18050f] via-[#4a1532] to-[#210817]">
                <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#C6A15B]/20 blur-3xl md:right-[8%] md:top-[-8rem] md:h-[34rem] md:w-[34rem]"/>
                <div className="absolute bottom-[-8rem] right-[5%] h-96 w-96 rounded-full border border-[#C6A15B]/30"/>
                <div className="absolute right-[12%] top-[22%] hidden font-serif text-[12rem] text-[#C6A15B]/20 md:block">✧</div>
                <div className="absolute bottom-12 right-[12%] hidden font-serif text-6xl italic text-[#C6A15B]/70 md:block">Offres exclusives</div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-[#14040c]/90 via-[#240817]/55 to-transparent"/>

            <div className="relative mx-auto flex min-h-[610px] max-w-[1500px] items-start px-6 pb-28 pt-12 md:min-h-[540px] md:items-center md:pb-16 md:pt-14 lg:px-10">
              <div className="w-full md:max-w-[54%]">
                <span className="inline-block rounded-full border border-white/30 bg-white/5 px-5 py-2 text-[10px] uppercase tracking-[0.3em] backdrop-blur-sm">
                  {slide.eyebrow}
                </span>
                <p className="mt-8 text-[11px] uppercase tracking-[0.35em] text-white/75">
                  Beauté, mode &amp; accessoires
                </p>
                <h1 className="mt-3 max-w-2xl font-serif text-5xl leading-[1.05] md:text-6xl lg:text-7xl">
                  {slide.title}
                </h1>
                <div className="mt-4 h-[2px] w-44 bg-gradient-to-r from-[#EE6FB0] to-transparent"/>
                <p className="mt-5 max-w-md font-serif text-xl leading-relaxed text-white/90">
                  {slide.subtitle}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={slide.href} tabIndex={active===index?0:-1} className="rounded-full bg-[#EE6FB0] px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2a0a1b] shadow-[0_0_30px_rgba(238,111,176,.35)] transition hover:brightness-110 active:scale-95">
                    {slide.button} →
                  </Link>
                  <Link href={slide.secondHref} tabIndex={active===index?0:-1} className="rounded-full border border-[#EE6FB0]/80 bg-white/5 px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-95">
                    {slide.second}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-7 left-0 right-0 z-20 flex items-center justify-center gap-4">
          <button type="button" aria-label="Bannière précédente" onClick={()=>setActive(current=>(current+2)%3)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/15 text-white transition hover:bg-white/15">‹</button>
          <div className="flex items-center gap-2">
            {slides.map((_,index)=>(
              <button key={index} type="button" aria-label={`Afficher la bannière ${index+1}`} aria-current={active===index?'true':undefined} onClick={()=>setActive(index)} className={`h-2 rounded-full transition-all duration-300 ${active===index?'w-8 bg-[#EE6FB0]':'w-2 bg-white/55 hover:bg-white'}`}/>
            ))}
          </div>
          <button type="button" aria-label="Bannière suivante" onClick={()=>setActive(current=>(current+1)%3)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/15 text-white transition hover:bg-white/15">›</button>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-1 max-w-2xl px-5 pb-5 md:-mt-0 md:pb-7">
        {search}
      </div>
    </section>
  );
}
