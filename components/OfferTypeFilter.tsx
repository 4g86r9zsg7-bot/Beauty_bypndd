
'use client';

import {useState, type ReactNode} from 'react';

export default function OfferTypeFilter({
  packs,
  specials
}:{
  packs:ReactNode;
  specials:ReactNode;
}) {
  const [active,setActive]=useState('all');

  const filters=[
    {id:'all',label:'Tout voir'},
    {id:'packs',label:'Packs & coffrets'},
    {id:'specials',label:'Offres spéciales'}
  ];

  return (
    <div>
      <div className="mx-auto mb-8 flex flex-wrap justify-center gap-2 px-2">
        {filters.map(filter=>(
          <button
            key={filter.id}
            type="button"
            onClick={()=>setActive(filter.id)}
            className={`rounded-full border px-5 py-3 text-[11px] font-semibold transition ${
              active===filter.id
                ? 'border-[#762d4c] bg-[#762d4c] text-white shadow-md'
                : 'border-[#ead9df] bg-white text-[#762d4c] hover:border-[#C6A15B]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {active!=='specials'&&packs}
      {active!=='packs'&&specials}
    </div>
  );
}
