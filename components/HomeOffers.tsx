import Link from 'next/link';
import {eur} from '@/lib/supabase';

function itemProduct(item:any){
  return Array.isArray(item?.products)?item.products[0]:item?.products;
}

function itemVariant(item:any){
  const product=itemProduct(item);
  return (Array.isArray(product?.variants)?product.variants:[])
    .find((variant:any)=>variant&&typeof variant==='object'&&variant.name===item?.variant);
}

function itemPrice(item:any){
  const product=itemProduct(item);
  return Number(itemVariant(item)?.price??product?.price??0);
}

function itemImage(item:any){
  const product=itemProduct(item);
  const variant=itemVariant(item);
  return variant?.image||variant?.images?.[0]||product?.images?.[0]||null;
}

export default function HomeOffers({offers}:{offers:any[]}){
  if(!offers?.length)return null;

  return(
    <section aria-labelledby="home-offers-title" className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#98783b]">
            À ne pas manquer
          </p>
          <h2 id="home-offers-title" className="mt-1 font-serif text-2xl text-plum sm:text-3xl">
            Promotions & coffrets
          </h2>
          <p className="mt-1 max-w-md text-[11px] leading-relaxed text-ink/60 sm:text-xs">
            De belles sélections et des avantages exclusifs, disponibles en ce moment.
          </p>
        </div>
        <Link href="/offres" className="shrink-0 border-b border-[#C6A15B] pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-plum sm:text-[10px]">
          Toutes les offres →
        </Link>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer:any)=>{
          const items=(offer.offer_items||[]).filter((item:any)=>itemProduct(item));
          const isPack=offer.kind==='pack';
          const isFree=offer.kind==='buy_x_get_1';
          const photos=items.map((item:any)=>({
            url:itemImage(item),
            name:itemProduct(item)?.name||'Produit'
          })).filter((item:any)=>item.url).slice(0,4);
          const photoCount=photos.length;
          const regular=items.reduce((sum:number,item:any)=>sum+itemPrice(item)*Math.max(1,Number(item.qty||1)),0);
          const packPrice=Number(offer.pack_price||0);
          const saving=isPack?Math.max(0,regular-packPrice):0;
          const percent=regular>0?Math.round(saving/regular*100):0;
          const discountLabel=offer.discount_type==='amount'
            ?eur(Number(offer.discount_value||0))
            :String(Number(offer.discount_value||0))+'%';

          return(
            <article key={offer.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ead9df] bg-white shadow-[0_5px_18px_rgba(89,59,72,.06)]">
              <div className="relative aspect-[5/3] overflow-hidden bg-[#fff8fa] p-2">
                {photoCount>1?(
                  <div className={`grid h-full w-full gap-1.5 ${photoCount===2?'grid-cols-2':photoCount===3?'grid-cols-[1.1fr_1fr] grid-rows-2':'grid-cols-2 grid-rows-2'}`}>
                    {photos.map((photo:any,index:number)=>(
                      <div key={photo.name+'-'+index} className={`flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 ${photoCount===3&&index===0?'row-span-2':''}`}>
                        <img src={photo.url} alt={photo.name} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
                      </div>
                    ))}
                  </div>
                ):photos[0]?.url?(
                  <div className="flex h-full items-center justify-center rounded-lg bg-white p-2">
                    <img src={photos[0].url} alt={photos[0].name} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
                  </div>
                ):offer.image_url?(
                  <img src={offer.image_url} alt={offer.title} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
                ):(
                  <div className="flex h-full items-center justify-center font-serif text-5xl text-[#C6A15B]/60">✧</div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-[#963e66] px-2.5 py-1 text-[9px] font-bold text-white shadow-sm">
                  {isPack&&percent>0?'-'+percent+'%':isFree?'1 offert':offer.kind==='variant_discount'?'Prix réduit':'Offre exclusive'}
                </span>
                {offer.ends_at&&(
                  <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[8px] font-medium text-plum shadow-sm">
                    Jusqu'au {new Date(offer.ends_at).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                <h3 className="line-clamp-2 font-serif text-lg leading-snug text-plum">{offer.title}</h3>
                {offer.description&&(
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-ink/60 sm:text-xs">{offer.description}</p>
                )}
                {isPack?(
                  <div className="mt-3 rounded-xl bg-[#fff4f8] px-3 py-2.5">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-plum/60">Prix du pack</p>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                      <span className="font-serif text-2xl font-semibold text-rose">{eur(packPrice)}</span>
                      {saving>0&&<s className="text-[11px] text-ink/45">{eur(regular)}</s>}
                    </div>
                    {saving>0&&<p className="mt-1 text-[10px] font-semibold text-[#80611f]">Vous économisez {eur(saving)}</p>}
                  </div>
                ):isFree?(
                  <p className="mt-3 rounded-xl bg-[#fff4f8] px-3 py-2.5 text-[10px] leading-relaxed text-plum">
                    Achetez {Number(offer.buy_qty||1)} produit(s) de cette sélection : le moins cher est offert automatiquement dès {Number(offer.buy_qty||1)+1} produits.
                  </p>
                ):(
                  <p className="mt-3 rounded-xl bg-[#fff4f8] px-3 py-2.5 text-[10px] leading-relaxed text-plum">
                    {discountLabel} de réduction sur les unités supplémentaires.
                  </p>
                )}
                <p className="mt-auto pt-3 text-[9px] text-ink/55">
                  {items.length} produit{items.length>1?'s':''} dans cette sélection
                </p>
                <Link href="/offres" className="mt-2 inline-flex items-center justify-center rounded-full bg-plum px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#71334f]">
                  Voir les détails
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
