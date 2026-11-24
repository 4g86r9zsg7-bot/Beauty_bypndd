import Link from 'next/link';
import {eur} from '@/lib/supabase';

function productOf(item:any){
  return Array.isArray(item?.products)?item.products[0]:item?.products;
}
function variantOf(item:any){
  const product=productOf(item);
  return (Array.isArray(product?.variants)?product.variants:[])
    .find((variant:any)=>variant&&typeof variant==='object'&&variant.name===item?.variant);
}
function priceOf(item:any){
  const product=productOf(item);
  return Number(variantOf(item)?.price??product?.price??0);
}
function imageOf(item:any){
  const variant=variantOf(item);
  const product=productOf(item);
  return variant?.image||variant?.images?.[0]||product?.images?.[0]||null;
}

function OfferImage({offer,items}:{offer:any;items:any[]}){
  const photos=items.map((item:any)=>({
    url:imageOf(item),
    name:productOf(item)?.name||'Produit'
  })).filter((item:any)=>item.url).slice(0,4);
  const count=photos.length;

  return(
    <div className="relative aspect-[4/3] overflow-hidden bg-[#f7edf0]">
      {count===1?(
        <div className="flex h-full items-center justify-center bg-white/50 p-4">
          <img src={photos[0].url} alt={photos[0].name} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
        </div>
      ):count>1?(
        <div className={`grid h-full gap-1.5 p-2 ${count===2?'grid-cols-2':count===3?'grid-cols-[1.12fr_1fr] grid-rows-2':'grid-cols-2 grid-rows-2'}`}>
          {photos.map((photo:any,index:number)=>(
            <div key={photo.name+'-'+index} className={`flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-lg bg-white/90 p-2 ${count===3&&index===0?'row-span-2':''}`}>
              <img src={photo.url} alt={photo.name} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
            </div>
          ))}
        </div>
      ):offer.image_url?(
        <div className="flex h-full items-center justify-center bg-white/50 p-4">
          <img src={offer.image_url} alt={offer.title} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
        </div>
      ):(
        <div className="flex h-full items-center justify-center font-serif text-6xl text-[#b99a69]/40">✧</div>
      )}
      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#704657] shadow-sm">
        {offer.kind==='pack'?'Coffret':offer.kind==='buy_x_get_1'?'Offre spéciale':'Prix avantageux'}
      </span>
    </div>
  );
}

function OfferCard({offer}:{offer:any}){
  const items=(offer.offer_items||[]).filter((item:any)=>productOf(item));
  const isPack=offer.kind==='pack';
  const isFree=offer.kind==='buy_x_get_1';
  const regular=items.reduce((sum:number,item:any)=>sum+priceOf(item)*Math.max(1,Number(item.qty||1)),0);
  const packPrice=Number(offer.pack_price||0);
  const saving=isPack?Math.max(0,regular-packPrice):0;
  const discountLabel=offer.discount_type==='amount'
    ?eur(Number(offer.discount_value||0))
    :String(Number(offer.discount_value||0))+'%';

  return(
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_5px_22px_rgba(83,48,62,.08)] ring-1 ring-[#eadde1]">
      <OfferImage offer={offer} items={items}/>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 font-serif text-[17px] leading-snug text-[#593b48] sm:text-lg">{offer.title}</h3>
        {offer.description&&(
          <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-[#806d70] sm:text-xs">{offer.description}</p>
        )}
        <div className="mt-3 border-t border-[#f0e6e9] pt-3">
          {isPack?(
            <>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-serif text-2xl font-semibold text-[#8b3f61]">{eur(packPrice)}</span>
                {saving>0&&<s className="text-xs text-[#9c8b90]">{eur(regular)}</s>}
              </div>
              {saving>0&&<p className="mt-0.5 text-[10px] font-medium text-[#80611f]">Vous économisez {eur(saving)}</p>}
            </>
          ):isFree?(
            <>
              <p className="font-serif text-lg text-[#8b3f61]">{Number(offer.buy_qty||1)} + 1 offert</p>
              <p className="mt-0.5 text-[10px] text-[#806d70]">Le moins cher est offert selon les conditions de l’offre.</p>
            </>
          ):(
            <>
              <p className="font-serif text-lg text-[#8b3f61]">{discountLabel} de réduction</p>
              <p className="mt-0.5 text-[10px] text-[#806d70]">Voir les conditions de cette offre.</p>
            </>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-[9px] text-[#927f84]">{items.length} produit{items.length>1?'s':''}</span>
          <Link href="/offres" className="inline-flex items-center gap-1.5 rounded-full bg-[#593b48] px-3.5 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#7b294e]">
            Découvrir <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function HomeOffers({offers}:{offers:any[]}){
  if(!offers?.length)return null;
  return(
    <section aria-labelledby="home-offers-title" className="mt-12 sm:mt-14">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#a1844d]">À ne pas manquer</p>
          <h2 id="home-offers-title" className="mt-1 font-serif text-2xl text-[#593b48] sm:text-3xl">Promotions & coffrets</h2>
          <p className="mt-1.5 text-[11px] text-[#806d70] sm:text-xs">De jolies attentions à prix doux.</p>
        </div>
        <Link href="/offres" className="shrink-0 border-b border-[#c6a15b] pb-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#593b48] sm:text-[10px]">
          Tout voir <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:gap-4 sm:px-0">
        {offers.map((offer:any)=>(
          <div key={offer.id} className="w-[78vw] max-w-[330px] flex-none snap-start sm:w-[46%] lg:w-[calc((100%-2rem)/3)]">
            <OfferCard offer={offer}/>
          </div>
        ))}
      </div>
      <p className="mt-1 text-center text-[9px] tracking-wide text-[#9a858d] sm:hidden">Faites glisser pour découvrir les autres offres</p>
    </section>
  );
}
