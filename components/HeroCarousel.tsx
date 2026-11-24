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
  const [paused,setPaused]=useState(false);

  useEffect(()=>{
    if(paused)return;

    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduceMotion)return;

    const timer=setInterval(()=>{
      setActive(current=>(current+1)%3);
    },7000);

    return ()=>clearInterval(timer);
  },[paused]);

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

  const slide=slides[active];

  return (
    <section
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-visible bg-[#14040c] text-white lg:-mt-6"
      aria-label="À la une de BeautyByPND"
      onMouseEnter={()=>setPaused(true)}
      onMouseLeave={()=>setPaused(false)}
      onFocusCapture={()=>setPaused(true)}
      onBlurCapture={event=>{
        if(!event.currentTarget.contains(event.relatedTarget as Node|null)){
          setPaused(false);
        }
      }}
    >
      <div
        className="relative min-h-[520px] overflow-hidden sm:min-h-[540px]"
        role="region"
        aria-roledescription="carrousel"
        aria-label="Sélection à la une"
      >
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:active===2
                ?'radial-gradient(60% 70% at 78% 35%,rgba(198,161,91,.22),transparent 62%),linear-gradient(118deg,#14040c 0%,#3B0F27 45%,#2a0a1b 100%)'
                :'radial-gradient(60% 70% at 78% 35%,rgba(238,111,176,.28),transparent 62%),linear-gradient(118deg,#14040c 0%,#3B0F27 45%,#2a0a1b 100%)'
            }}
          />
          {slide.image?(
            <img
              key={slide.image}
              src={slide.image}
              alt=""
              aria-hidden="true"
              fetchPriority={active===0?'high':'auto'}
              decoding="async"
              className="absolute bottom-0 left-0 h-[245px] w-full object-cover object-center opacity-85 mix-blend-lighten transition-opacity duration-700 motion-reduce:transition-none sm:h-[270px] md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:w-[62%] md:object-center"
            />
          ):(
            <div className="absolute bottom-0 right-0 hidden h-full w-[62%] items-center justify-center md:flex">
              <span className="font-serif text-7xl italic text-[#EE6FB0]/50">
                {active===1?'Nouveautés':'Offres exclusives'}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#14040c]/95 via-[#240817]/65 to-[#240817]/10 md:to-transparent"/>
          <div className="absolute inset-x-0 bottom-0 h-[290px] bg-gradient-to-t from-[#14040c]/35 via-[#14040c]/15 to-transparent md:hidden"/>
        </div>

        <div className="relative mx-auto flex min-h-[520px] max-w-[1500px] items-start px-5 pb-28 pt-9 sm:min-h-[540px] sm:px-6 sm:pt-12 md:items-center md:pb-20 md:pt-14 lg:px-10">
          <div className="w-full md:max-w-[54%]">
            <span className="inline-flex max-w-full items-center rounded-full border border-white/30 bg-white/[0.08] px-4 py-2 text-[9px] uppercase tracking-[0.2em] backdrop-blur-sm sm:px-5 sm:text-[10px] sm:tracking-[0.28em]">
              {slide.eyebrow}
            </span>

            <p className="mt-6 text-[9px] uppercase tracking-[0.22em] text-white/75 sm:mt-7 sm:text-[11px] sm:tracking-[0.32em]">
              Beauté, mode &amp; accessoires
            </p>

            <h1 className="mt-3 max-w-2xl break-words font-serif text-[2.65rem] leading-[1.04] sm:text-5xl md:text-6xl lg:text-7xl">
              {slide.title}
            </h1>

            <div className="mt-4 h-[2px] w-32 bg-gradient-to-r from-[#EE6FB0] to-transparent sm:w-44"/>

            <p className="mt-4 max-w-md font-serif text-base leading-relaxed text-white/90 sm:mt-5 sm:text-xl">
              {slide.subtitle}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 sm:mt-7">
              <Link
                href={slide.href}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#EE6FB0] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#2a0a1b] shadow-[0_0_30px_rgba(238,111,176,.35)] transition hover:brightness-110 active:scale-95 sm:px-7 sm:text-[10px] sm:tracking-[0.14em]"
              >
                {slide.button} →
              </Link>

              <Link
                href={slide.secondHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#EE6FB0]/80 bg-[#14040c]/35 px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-95 sm:px-7 sm:text-[10px] sm:tracking-[0.14em]"
              >
                {slide.second}
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-5 left-0 right-0 z-20 flex items-center justify-center gap-4 md:bottom-7">
          <button
            type="button"
            aria-label="Bannière précédente"
            onClick={()=>setActive(current=>(current+2)%3)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-black/20 text-lg text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EE6FB0]"
          >‹</button>

          <div className="flex items-center gap-2" aria-label={`Bannière ${active+1} sur 3`}>
            {slides.map((_,index)=>(
              <button
                key={index}
                type="button"
                aria-label={`Afficher la bannière ${index+1}`}
                aria-current={active===index?'true':undefined}
                onClick={()=>setActive(index)}
                className={`h-2 rounded-full transition-all duration-300 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EE6FB0] ${
                  active===index?'w-8 bg-[#EE6FB0]':'w-2 bg-white/55 hover:bg-white'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Bannière suivante"
            onClick={()=>setActive(current=>(current+1)%3)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-black/20 text-lg text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EE6FB0]"
          >›</button>
        </div>
      </div>

      <div className="relative mx-auto -mt-1 w-full max-w-2xl px-4 pb-6 sm:px-5 md:pb-7">
        {search}
      </div>
    </section>
  );
}
