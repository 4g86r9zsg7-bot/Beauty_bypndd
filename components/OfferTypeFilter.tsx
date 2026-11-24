'use client';

import {useState,type ReactNode} from 'react';

export default function OfferTypeFilter({
  packs,
  variants,
  buyOneGetOne
}:{
  packs:ReactNode;
  variants:ReactNode;
  buyOneGetOne:ReactNode;
}) {
  const [active,setActive]=useState('all');

  const filters=[
    {id:'all',label:'Tout voir'},
    {id:'packs',label:'Packs & coffrets'},
    {id:'bogo',label:'2 achetés = 1 offert'},
    {id:'variants',label:'Variantes à prix réduit'}
  ];

  return (
    <div>
      <div className="-mx-3 mb-7 flex gap-2 overflow-x-auto px-3 pb-2 sm:mx-0 sm:justify-center sm:overflow-visible sm:px-2">
        {filters.map(item=>(
          <button
            key={item.id}
            type="button"
            aria-pressed={active===item.id}
            onClick={()=>setActive(item.id)}
            className={`shrink-0 rounded-full border px-4 py-3 text-[11px] font-semibold transition sm:px-5 ${
              active===item.id
                ?'border-[#762d4c] bg-[#762d4c] text-white shadow-md'
                :'border-[#ead9df] bg-white text-[#762d4c] hover:border-[#C6A15B]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {(active==='all'||active==='packs')&&packs}
      {(active==='all'||active==='bogo')&&buyOneGetOne}
      {(active==='all'||active==='variants')&&variants}
    </div>
  );
}
