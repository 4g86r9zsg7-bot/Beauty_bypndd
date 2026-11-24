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

  if(count===1){
    return <img src={photos[0].url} alt={photos[0].name} loading="lazy" decoding="async" className="h-[76px] w-full object-contain"/>;
  }
  if(count>1){
    return (
      <div className={`grid h-[76px] w-full gap-0.5 ${count===2?'grid-cols-2':count===3?'grid-cols-[1.1fr_1fr] grid-rows-2':'grid-cols-2 grid-rows-2'}`}>
        {photos.map((photo:any,index:number)=>(
          <div key={photo.name+'-'+index} className={`flex min-h-0 min-w-0 items-center justify-center overflow-hidden ${count===3&&index===0?'row-span-2':''}`}>
            <img src={photo.url} alt={photo.name} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
          </div>
        ))}
      </div>
    );
  }
  return offer.image_url
    ? <img src={offer.image_url} alt={offer.title} loading="lazy" decoding="async" className="h-[76px] w-full object-contain"/>
    : <div className="flex h-[76px] items-center justify-center font-serif text-3xl text-[#b99a69]/50">✧</div>;
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
    <Link href="/offres" className="block min-w-0 snap-start overflow-hidden rounded-xl bg-white ring-1 ring-[#eee3e6] transition active:scale-[.98]">
      <div className="relative flex h-[88px] items-center justify-center bg-[#faf5f6] px-2">
        <OfferImage offer={offer} items={items}/>
        <span className="absolute left-1.5 top-1.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-[#704657]">
          {isPack?'Coffret':isFree?'Offre':'Promo'}
        </span>
      </div>
      <div className="px-2 pb-2 pt-1.5">
        <h3 className="truncate text-[10px] font-medium leading-tight text-[#593b48]">{offer.title}</h3>
        <div className="mt-1 flex min-h-[17px] items-baseline gap-1">
          {isPack?(
            <>
              <span className="text-[13px] font-semibold leading-none text-[#8b3f61]">{eur(packPrice)}</span>
              {saving>0&&<s className="text-[8px] text-[#9c8b90]">{eur(regular)}</s>}
            </>
          ):isFree?(
            <span className="text-[11px] font-semibold leading-none text-[#8b3f61]">{Number(offer.buy_qty||1)} + 1 offert</span>
          ):(
            <span className="text-[13px] font-semibold leading-none text-[#8b3f61]">-{discountLabel}</span>
          )}
        </div>
        {isPack&&saving>0&&<p className="mt-1 truncate text-[8px] font-medium text-[#80611f]">Économisez {eur(saving)}</p>}
        {isFree&&<p className="mt-1 truncate text-[8px] text-[#806d70]">Le moins cher offert</p>}
      </div>
    </Link>
  );
}

export default function HomeOffers({offers}:{offers:any[]}){
  if(!offers?.length)return null;
  return(
    <section aria-labelledby="home-offers-title" className="mt-7 sm:mt-9">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 id="home-offers-title" className="font-serif text-lg text-[#593b48] sm:text-xl">Promotions & coffrets</h2>
        <Link href="/offres" className="shrink-0 text-[9px] font-semibold text-[#8b3f61]">Tout voir →</Link>
      </div>
      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {offers.map((offer:any)=>(
          <div key={offer.id} className="min-w-0 shrink-0 basis-[calc((100%-10px)/2)]">
            <OfferCard offer={offer}/>
          </div>
        ))}
      </div>
    </section>
  );
}
