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

function OfferVisual({offer,items}:{offer:any;items:any[]}){
  const photos=items.map((item:any)=>({
    url:imageOf(item),
    name:productOf(item)?.name||'Produit'
  })).filter((item:any)=>item.url).slice(0,4);
  const count=photos.length;

  return(
    <div className="relative h-[104px] overflow-hidden rounded-xl bg-[#f8f0f2] sm:h-[124px]">
      {count===1?(
        <div className="flex h-full items-center justify-center p-2">
          <img src={photos[0].url} alt={photos[0].name} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
        </div>
      ):count>1?(
        <div className={`grid h-full gap-1 p-1.5 ${count===2?'grid-cols-2':count===3?'grid-cols-[1.12fr_1fr] grid-rows-2':'grid-cols-2 grid-rows-2'}`}>
          {photos.map((photo:any,index:number)=>(
            <div key={photo.name+'-'+index} className={`flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-lg bg-white/90 p-1 ${count===3&&index===0?'row-span-2':''}`}>
              <img src={photo.url} alt={photo.name} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
            </div>
          ))}
        </div>
      ):offer.image_url?(
        <div className="flex h-full items-center justify-center p-2">
          <img src={offer.image_url} alt={offer.title} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
        </div>
      ):(
        <div className="flex h-full items-center justify-center font-serif text-4xl text-[#b99a69]/40">✧</div>
      )}
      <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#704657] shadow-sm">
        {offer.kind==='pack'?'Coffret':offer.kind==='buy_x_get_1'?'Offre spéciale':'Promo'}
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
    <article className="min-w-0 rounded-2xl bg-white p-2.5 shadow-[0_3px_14px_rgba(83,48,62,.06)] ring-1 ring-[#eee3e6] sm:p-3">
      <OfferVisual offer={offer} items={items}/>
      <div className="px-0.5 pb-0.5 pt-2.5">
        <h3 className="line-clamp-1 font-serif text-[13px] leading-snug text-[#593b48] sm:text-[15px]">{offer.title}</h3>
        <div className="mt-1.5 flex min-h-[25px] flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {isPack?(
            <>
              <span className="font-serif text-[17px] font-semibold leading-none text-[#8b3f61] sm:text-lg">{eur(packPrice)}</span>
              {saving>0&&<s className="text-[9px] text-[#9c8b90]">{eur(regular)}</s>}
            </>
          ):isFree?(
            <span className="font-serif text-[15px] font-semibold leading-none text-[#8b3f61]">{Number(offer.buy_qty||1)} + 1 offert</span>
          ):(
            <span className="font-serif text-[15px] font-semibold leading-none text-[#8b3f61]">-{discountLabel}</span>
          )}
        </div>
        {isPack&&saving>0?(
          <p className="mt-1 text-[9px] font-medium text-[#80611f]">Économisez {eur(saving)}</p>
        ):isFree?(
          <p className="mt-1 line-clamp-1 text-[9px] text-[#806d70]">Le moins cher offert</p>
        ):(
          <p className="mt-1 line-clamp-1 text-[9px] text-[#806d70]">{items.length} produit{items.length>1?'s':''} concerné{items.length>1?'s':''}</p>
        )}
        <Link href="/offres" className="mt-2 inline-flex items-center gap-1 border-b border-[#c6a15b] pb-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#593b48]">
          Découvrir <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export default function HomeOffers({offers}:{offers:any[]}){
  if(!offers?.length)return null;
  return(
    <section aria-labelledby="home-offers-title" className="mt-8 sm:mt-10">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-[#a1844d]">À ne pas manquer</p>
          <h2 id="home-offers-title" className="mt-0.5 font-serif text-xl text-[#593b48] sm:text-2xl">Promotions & coffrets</h2>
        </div>
        <Link href="/offres" className="shrink-0 border-b border-[#c6a15b] pb-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#593b48]">
          Tout voir <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 items-start gap-2.5 sm:gap-3">
        {offers.map((offer:any)=>(
          <OfferCard key={offer.id} offer={offer}/>
        ))}
      </div>
    </section>
  );
}
