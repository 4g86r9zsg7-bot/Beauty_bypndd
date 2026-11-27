import Stars from '@/components/Stars';

export default function HomeReviews({list}:{list:any[]}) {
  const reviews = Array.isArray(list) ? list : [];
  if (!reviews.length) return null;

  const average = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  const items = reviews.slice(0, 8);

  const ReviewItems = () => items.map((review:any, index:number) => (
    <li key={`${review.id || index}-${index}`} className="flex h-12 shrink-0 items-center gap-2 rounded-full border border-[#F0E4E8] bg-white px-3 shadow-sm">
      <Stars v={Number(review.rating) || 0} size={13}/>
      {review.comment ? (
        <span className="max-w-[220px] truncate text-xs text-ink/75">{review.comment}</span>
      ) : (
        <span className="text-[11px] text-ink/55">Note uniquement</span>
      )}
      <span className="max-w-[92px] truncate text-[10px] font-semibold text-plum">
        {review.customer_name || 'Cliente'}
      </span>
    </li>
  ));

  return (
    <section aria-label="Avis clients" className="mt-8 w-full min-w-0 px-0">
      <div className="flex min-h-[48px] w-full min-w-0 flex-col gap-3 py-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex shrink-0 items-center gap-2 px-1">
          <span className="text-xs font-semibold text-plum">Avis clients</span>
          <span className="text-sm font-semibold tabular-nums text-plum">{average.toFixed(1)}/5</span>
          <Stars v={average} size={13}/>
          <span className="text-[10px] text-ink/50">({reviews.length})</span>
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="home-reviews-track flex w-max items-center gap-2">
            <ReviewItems/>
            <ReviewItems/>
          </ul>
        </div>
      </div>
    </section>
  );
}
