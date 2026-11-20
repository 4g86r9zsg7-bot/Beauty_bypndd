
'use client';

import type {ReactNode} from 'react';
import {useEffect,useState} from 'react';
import Link from 'next/link';

export default function HeroCarousel({
  src,
  newSrc,
  pleasureSrc,
  search
}:{
  src:string;
  newSrc:string;
  pleasureSrc:string;
  search:ReactNode;
}){
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
      secondHref:'/categorie/promotions',
      image:src
    },
    {
      eyebrow:'Les dernières tendances',
      title:'Nouveautés',
      subtitle:'Découvrez toutes nos dernières nouveautés : beauté, mode et accessoires.',
      button:'Découvrir les nouveautés',
      href:'/categorie/nouveautes',
      second:'Nos coups de cœur',
      secondHref:'/categorie/coups-de-coeur',
      image:newSrc
    },
    {
      eyebrow:'Des offres à ne pas manquer',
      title:'Faites-vous plaisir',
      subtitle:'Découvrez nos packs et nos offres exclusives à prix avantageux.',
      button:'Découvrir les offres',
      href:'/offres',
      second:'Voir les promotions',
      secondHref:'/categorie/promotions',
      image:pleasureSrc
    }
  ];

  return (
    <section className="relative left-1/2 z-40 w-screen -translate-x-1/2 bg-[#14040c] text-white lg:-mt-6">
      <div className="relative min-h-[610px] overflow-hidden md:min-h-[540px]">

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
            <div
              className="absolute inset-0"
              style={{
                background:index===2
                  ?'radial-gradient(60% 70% at 78% 35%,rgba(198,161,91,.22),transparent 62%),linear-gradient(118deg,#14040c 0%,#3B0F27 45%,#2a0a1b 100%)'
                  :'radial-gradient(60% 70% at 78% 35%,rgba(238,111,176,.28),transparent 62%),linear-gradient(118deg,#14040c 0%,#3B0F27 45%,#2a0a1b 100%)'
              }}
            />

            {slide.image?(
              <img
                src={slide.image}
                alt=""
                aria-hidden="true"
                fetchPriority={index===0?'high':'auto'}
                decoding="async"
                className="absolute bottom-0 left-0 h-[280px] w-full object-cover object-center opacity-90 mix-blend-lighten md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:w-[62%] md:object-center"
              />
            ):(
              <div className="absolute bottom-0 right-0 hidden h-full w-[62%] items-center justify-center md:flex">
                <span className="font-serif text-7xl italic text-[#EE6FB0]/50">
                  {index===1?'Nouveautés':'Offres exclusives'}
                </span>
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
                  <Link
                    href={slide.href}
                    tabIndex={active===index?0:-1}
                    className="rounded-full bg-[#EE6FB0] px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2a0a1b] shadow-[0_0_30px_rgba(238,111,176,.35)] transition hover:brightness-110 active:scale-95"
                  >
                    {slide.button} →
                  </Link>

                  <Link
                    href={slide.secondHref}
                    tabIndex={active===index?0:-1}
                    className="rounded-full border border-[#EE6FB0]/80 bg-white/5 px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-95"
                  >
                    {slide.second}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-7 left-0 right-0 z-20 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Bannière précédente"
            onClick={()=>setActive(current=>(current+2)%3)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/15 text-white transition hover:bg-white/15"
          >‹</button>

          <div className="flex items-center gap-2">
            {slides.map((_,index)=>(
              <button
                key={index}
                type="button"
                aria-label={`Afficher la bannière ${index+1}`}
                aria-current={active===index?'true':undefined}
                onClick={()=>setActive(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  active===index?'w-8 bg-[#EE6FB0]':'w-2 bg-white/55 hover:bg-white'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Bannière suivante"
            onClick={()=>setActive(current=>(current+1)%3)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/15 text-white transition hover:bg-white/15"
          >›</button>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-1 max-w-2xl px-5 pb-5 md:-mt-0 md:pb-7">
        {search}
      </div>
    </section>
  );
}
