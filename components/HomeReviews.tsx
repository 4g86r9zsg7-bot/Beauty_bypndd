'use client';

import { useRef } from 'react';

type Product = { name?: string; slug?: string };
type Review = {
  id: string;
  customer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  products?: Product | Product[] | null;
};

export default function HomeReviews({ reviews }: { reviews: Review[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  if (!reviews?.length) return null;

  const scrollReviews = (direction: 'left' | 'right') => {
    if (!railRef.current) return;
    const distance = Math.max(railRef.current.clientWidth * 0.78, 260);
    railRef.current.scrollBy({
      left: direction === 'right' ? distance : -distance,
      behavior: 'smooth',
    });
  };

  return (
    <section aria-labelledby="home-reviews-title" className="mx-auto mt-12 w-full max-w-[1500px] px-4 sm:mt-16 sm:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-[28px] border border-[#F0E4E8] bg-[linear-gradient(135deg,#FCF7F8_0%,#FFFDFB_52%,#F8F1EC_100%)] px-4 py-8 sm:px-7 sm:py-10 lg:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border border-[#E8D6D0]/60" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#A56C78]">Vos mots, notre plus belle récompense</p>
            <h2 id="home-reviews-title" className="mt-2 font-serif text-3xl text-[#563746] sm:text-4xl">Elles en parlent mieux que nous</h2>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-[#725F67] sm:text-sm">Découvrez les retours de clientes après leur expérience BeautyByPND.</p>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#8A747C]">Avis clients</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => scrollReviews('left')} aria-label="Avis précédents" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5D2D8] bg-white/80 text-lg text-[#654454] transition hover:border-[#B88B72] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B72]">‹</button>
              <button type="button" onClick={() => scrollReviews('right')} aria-label="Avis suivants" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5D2D8] bg-white/80 text-lg text-[#654454] transition hover:border-[#B88B72] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B72]">›</button>
            </div>
          </div>
        </div>

        <div
          ref={railRef}
          aria-label="Défilement des avis clients"
          className="-mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-3 [scrollbar-width:thin] [scrollbar-color:#D8BFC7_transparent] sm:mx-0 sm:gap-4 sm:px-0"
        >
          {reviews.map((review) => {
            const firstName = (review.customer_name || 'Cliente').trim().split(/\s+/)[0];
            const product = Array.isArray(review.products) ? review.products[0] : review.products;
            const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));

            return (
              <article key={review.id} className="group flex w-[82vw] max-w-[320px] shrink-0 snap-start flex-col rounded-[22px] border border-[#EDE1E3] bg-white/95 p-5 shadow-[0_5px_22px_rgba(87,54,70,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(87,54,70,0.09)] sm:w-[290px] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F8EEF0] font-serif text-sm text-[#805A6A]">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <span aria-label={rating + ' sur 5 étoiles'} className="text-sm tracking-[0.12em] text-[#B58B43]">{'★'.repeat(rating)}<span className="sr-only"> {rating} sur 5</span></span>
                </div>
                <span aria-hidden="true" className="mt-4 font-serif text-3xl leading-none text-[#D7B7BE]">“</span>
                <p className="mt-1 min-h-[4.5rem] text-sm leading-6 text-[#5F5057]">{review.comment}</p>
                <div className="mt-auto border-t border-[#F1E8E9] pt-4">
                  <p className="text-sm font-semibold text-[#563746]">{firstName}</p>
                  {product?.name && <p className="mt-1 truncate text-[11px] text-[#927D85]">À propos de {product.name}</p>}
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-1 text-center text-[10px] text-[#927D85] sm:hidden">Faites glisser pour découvrir les autres avis</p>
      </div>
    </section>
  );
}
