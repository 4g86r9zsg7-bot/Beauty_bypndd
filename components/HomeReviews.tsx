import Link from 'next/link';

type Review = {
  id: string;
  customer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  products?: { name?: string; slug?: string } | null;
};

export default function HomeReviews({reviews}:{reviews:Review[]}) {
  if (!reviews?.length) return null;

  return (
    <section aria-labelledby="home-reviews-title" className="mx-auto mt-14 w-full max-w-[1500px] px-4 sm:px-6 lg:px-10">
      <div className="rounded-3xl border border-[#F0E4E8] bg-gradient-to-b from-[#FCF8F8] to-white px-4 py-9 sm:px-6 md:py-11">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-rose">Vos expériences</p>
          <h2 id="home-reviews-title" className="mt-2 font-serif text-3xl text-plum md:text-4xl">Avis de nos clientes</h2>
          <p className="mt-2 text-xs text-ink/60">Leurs retours après leur expérience BeautyByPND.</p>
          <div className="mx-auto mt-4 h-px w-14 bg-[#C6A15B]"/>
        </div>

        <div className="-mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] sm:mx-0 sm:px-0">
          {reviews.map((review) => {
            const firstName = (review.customer_name || 'Cliente').trim().split(/\\s+/)[0];
            return (
              <article key={review.id} className="flex w-[78vw] max-w-[300px] shrink-0 snap-start flex-col rounded-2xl border border-[#EAD9E0] bg-white p-4 shadow-sm sm:w-[260px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-plum">{firstName}</span>
                  <span aria-label={review.rating + ' sur 5 étoiles'} className="shrink-0 text-sm tracking-[0.08em] text-[#B58B43]">{'★'.repeat(Math.max(0,Math.min(5,review.rating)))}</span>
                </div>
                <p className="mt-3 line-clamp-3 min-h-[3.75rem] text-xs leading-relaxed text-ink/75">{review.comment}</p>
                {review.products?.name && (
                  <p className="mt-3 truncate border-t border-[#F2E8EC] pt-3 text-[10px] text-ink/50">
                    À propos de : {review.products.name}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
