'use client';

import ProductCard from '@/components/ProductCard';

type Pick={product:any;reason:string};

export default function HomePicks({items}:{items:Pick[]}){
  if(!items.length)return null;
  return (
    <section aria-labelledby="home-picks-title" className="relative left-1/2 mt-8 w-screen -translate-x-1/2 overflow-hidden border-y border-[#ead9df] bg-gradient-to-b from-[#fffdfd] via-[#FCF7F8] to-[#f8eef1] py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#98783b]">La sélection BeautyByPND</p>
          <h2 id="home-picks-title" className="mt-3 font-serif text-3xl text-plum sm:text-4xl">Nos pépites du moment</h2>
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-ink/65 sm:text-sm">Quatre belles découvertes à retrouver pendant votre visite.</p>
          <span className="mx-auto mt-5 block h-px w-16 bg-[#C6A15B]"/>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 sm:gap-y-9 lg:grid-cols-4">
          {items.map(({product,reason},index)=>(
            <article key={product.id} className="min-w-0">
              <div className="mb-3 flex min-h-[34px] items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#C6A15B]/50 bg-white font-serif text-sm text-[#98783b]">{index+1}</span>
                <p className="text-[10px] leading-snug text-plum/75 sm:text-[11px]">{reason}</p>
              </div>
              <ProductCard p={product}/>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
