'use client';

import {useState} from 'react';

export default function ProductImage({
  src,
  alt,
  className
}:{src:string;alt:string;className:string}){
  const [loaded,setLoaded]=useState(false);
  const [failed,setFailed]=useState(false);

  if(failed){
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FCF4F6] to-white">
        <span className="font-serif text-4xl text-plum/35">{String(alt||'B').charAt(0)}</span>
      </div>
    );
  }

  return (
    <>
      {!loaded&&(
        <div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#FCF4F6] via-[#fffafb] to-[#f7edf1]"
        >
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 via-white/55 to-transparent"/>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={()=>setLoaded(true)}
        onError={()=>setFailed(true)}
        className={`${className} transition-opacity duration-500 motion-reduce:transition-none ${loaded?'opacity-100':'opacity-0'}`}
      />
    </>
  );
}
