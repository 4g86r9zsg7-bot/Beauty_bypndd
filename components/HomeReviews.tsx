import Link from 'next/link';
import Stars from '@/components/Stars';

function formatDate(value:string){
  const date=new Date(value);
  return Number.isNaN(date.getTime())
    ?''
    :date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
}

export default function HomeReviews({list}:{list:any[]}){
  const reviews=Array.isArray(list)?list:[];
  if(!reviews.length)return null;

  const average=reviews.reduce((sum,review)=>sum+Number(review.rating||0),0)/reviews.length;
  const visibleReviews=reviews.slice(0,3);

  return (
    <section aria-labelledby="home-reviews-title" className="mx-auto mt-14 w-full max-w-[1500px] px-4 sm:px-6 lg:px-10">
      <div className="rounded-3xl border border-[#F0E2E8] bg-gradient-to-b from-[#FCF8F8] to-white px-4 py-8 sm:px-7 sm:py-10">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#98783b]">
            Vos expériences
          </p>
          <h2 id="home-reviews-title" className="mt-2 font-serif text-3xl text-plum sm:text-4xl">
            Elles nous font confiance
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            Les avis partagés par notre communauté.
          </p>
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-[#EAD9E0] bg-white px-5 py-3 shadow-sm">
            <span className="font-serif text-3xl leading-none text-plum">{average.toFixed(1)}<span className="text-base">/5</span></span>
            <span className="flex flex-col items-start gap-1">
              <Stars v={average} size={17}/>
              <span className="text-[10px] text-ink/55">{reviews.length} note{reviews.length>1?'s':''} publiée{reviews.length>1?'s':''}</span>
            </span>
          </div>
        </div>

        <ul className="mt-7 grid gap-3 md:grid-cols-3">
          {visibleReviews.map((review:any,index:number)=>(
            <li key={review.id||review.order_id||index} className="flex min-w-0 flex-col rounded-2xl border border-[#F0E4E8] bg-white p-4 shadow-[0_4px_18px_rgba(42,18,31,0.035)] sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <Stars v={Number(review.rating)||0} size={17}/>
                {review.verified&&(
                  <span className="shrink-0 rounded-full bg-[#F5F0E7] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#80632D]">
                    Achat vérifié
                  </span>
                )}
              </div>
              {review.comment?(
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/80">
                  “{review.comment}”
                </p>
              ):(
                <p className="mt-4 text-sm italic text-ink/55">
                  Note laissée sans commentaire.
                </p>
              )}
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-sand/70 pt-4">
                <p className="truncate text-xs font-semibold text-plum">
                  {review.customer_name||'Cliente BeautyByPND'}
                </p>
                <time className="shrink-0 text-[10px] text-ink/45" dateTime={review.created_at||undefined}>
                  {formatDate(review.created_at)}
                </time>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-7 text-center">
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-plum px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-plum transition hover:bg-plum hover:text-white">
            Une question ? Contactez notre équipe <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
