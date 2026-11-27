import Stars from '@/components/Stars';
import Link from 'next/link';

function formatDate(value:string){
  const date=new Date(value);
  return Number.isNaN(date.getTime())
    ?''
    :date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
}

export default function Reviews({list,avg}:{list:any[];avg:number}){
  const reviews=Array.isArray(list)?list:[];
  const count=reviews.length;

  return (
    <section id="avis" aria-labelledby="reviews-title" className="mx-auto mt-12 w-full max-w-6xl scroll-mt-24 px-4 pb-4 md:px-8">
      <div className="border-t border-sand pt-8 sm:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#98783b]">
              Vos expériences
            </p>
            <h2 id="reviews-title" className="mt-2 font-serif text-3xl text-plum sm:text-4xl">
              Avis clients
            </h2>
            <p className="mt-2 text-sm text-ink/60">
              Les retours de nos clientes sur ce produit.
            </p>
          </div>
          {count>0&&(
            <div className="flex items-center gap-3 rounded-2xl border border-[#C6A15B]/30 bg-[#FCF8F5] px-4 py-3">
              <span className="font-serif text-3xl leading-none text-plum">{avg.toFixed(1)}</span>
              <div>
                <Stars v={avg} size={17}/>
                <p className="mt-1 text-[10px] text-ink/60">{count} avis publié{count>1?'s':''}</p>
              </div>
            </div>
          )}
        </div>

        {count===0?(
          <div className="mt-6 rounded-2xl border border-dashed border-[#DCC8CE] bg-[#FCF8F8] px-5 py-8 text-center sm:py-10">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-[#C6A15B] shadow-sm" aria-hidden="true">♡</span>
            <h3 className="mt-4 font-serif text-xl text-plum">Votre avis compte</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/65">
              Aucun avis pour le moment. Après votre achat et la réception de votre commande, partagez votre expérience avec nous.
            </p>
            <p className="mt-4 text-[11px] text-ink/45">
              Les avis sont recueillis par notre service client après livraison.
            </p>
          </div>
        ):(
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {reviews.map((review:any,index:number)=>(
              <li key={review.id||review.order_id||index} className="rounded-2xl border border-sand/80 bg-white p-4 shadow-[0_4px_18px_rgba(42,18,31,0.035)] sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars v={Number(review.rating)||0} size={16}/>
                  {review.verified&&(
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E7] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#80632D]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 3 19 6v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3Z"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                      Achat vérifié
                    </span>
                  )}
                </div>
                {review.comment&&(
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/80">
                    “{review.comment}”
                  </p>
                )}
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-sand/70 pt-3">
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
        )}
        <div className="mt-5 text-center">
          <Link href="/contact" className="text-xs font-medium text-plum underline decoration-[#C6A15B] underline-offset-4 transition hover:text-rose">
            Une question ? Contactez notre équipe
          </Link>
        </div>
      </div>
    </section>
  );
}
