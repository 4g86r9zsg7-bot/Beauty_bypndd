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

function OfferVisual({offer,items,featured=false}:{offer:any;items:any[];featured?:boolean}){
  const photos=items.map((item:any)=>({
    url:imageOf(item),
    name:productOf(item)?.name||'Produit'
  })).filter((item:any)=>item.url).slice(0,4);
  const count=photos.length;
  const frame=featured?'aspect-[5/4] sm:aspect-[4/3]':'aspect-[5/3]';
  return(
    <div className={`relative ${frame} overflow-hidden bg-[#f8eef1] p-2 sm:p-3`}>
      {count===1?(
        <div className="flex h-full items-center justify-center rounded-xl bg-white/80 p-3">
          <img src={photos[0].url} alt={photos[0].name} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
        </div>
      ):count>1?(
        <div className={`grid h-full w-full gap-2 ${count===2?'grid-cols-2':count===3?'grid-cols-[1.12fr_1fr] grid-rows-2':'grid-cols-2 grid-rows-2'}`}>
          {photos.map((photo:any,index:number)=>(
            <div key={photo.name+'-'+index} className={`flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-xl bg-white/90 p-2 ${count===3&&index===0?'row-span-2':''}`}>
              <img src={photo.url} alt={photo.name} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
            </div>
          ))}
        </div>
      ):offer.image_url?(
        <div className="flex h-full items-center justify-center rounded-xl bg-white/80 p-3">
          <img src={offer.image_url} alt={offer.title} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
        </div>
      ):(
        <div className="flex h-full items-center justify-center font-serif text-6xl text-[#b99a69]/50">✧</div>
      )}
      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        {offer.kind==='pack'&&(
          <span className="rounded-full bg-[#7b294e] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white shadow-md">
            Coffret avantageux
          </span>
        )}
        {offer.kind==='buy_x_get_1'&&(
          <span className="rounded-full bg-[#7b294e] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white shadow-md">
            {Number(offer.buy_qty||1)} + 1 offert
          </span>
        )}
        {offer.kind==='variant_discount'&&(
          <span className="rounded-full bg-[#7b294e] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white shadow-md">
            Prix réduit
          </span>
        )}
      </div>
    </div>
  );
}

function OfferCard({offer,featured=false}:{offer:any;featured?:boolean}){
  const items=(offer.offer_items||[]).filter((item:any)=>productOf(item));
  const isPack=offer.kind==='pack';
  const isFree=offer.kind==='buy_x_get_1';
  const regular=items.reduce((sum:number,item:any)=>sum+priceOf(item)*Math.max(1,Number(item.qty||1)),0);
  const packPrice=Number(offer.pack_price||0);
  const saving=isPack?Math.max(0,regular-packPrice):0;
  const percent=regular>0?Math.round(saving/regular*100):0;
  const discountLabel=offer.discount_type==='amount'
    ?eur(Number(offer.discount_value||0))
    :String(Number(offer.discount_value||0))+'%';

  return(
    <article className={`group overflow-hidden rounded-[22px] border border-[#eadce1] bg-white shadow-[0_8px_28px_rgba(77,39,56,.07)] ${featured?'grid grid-cols-1 sm:grid-cols-[1.05fr_.95fr]':''}`}>
      <div className="relative">
        <OfferVisual offer={offer} items={items} featured={featured}/>
        {isPack&&percent>0&&(
          <span className="absolute bottom-4 left-4 rounded-full border border-[#d7bd88] bg-[#fffaf0] px-3 py-1.5 text-[10px] font-bold text-[#765b2d] shadow-sm">
            Économisez {eur(saving)} · -{percent}%
          </span>
        )}
      </div>

      <div className={`flex min-w-0 flex-col ${featured?'justify-center p-5 sm:p-7 lg:p-9':'p-4 sm:p-5'}`}>
        <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#a1844d]">
          {isPack?'La sélection':isFree?'Offre spéciale':'Avantage beauté'}
        </p>
        <h3 className={`mt-2 font-serif leading-tight text-[#593b48] ${featured?'text-2xl sm:text-3xl lg:text-4xl':'text-lg sm:text-xl'}`}>
          {offer.title}
        </h3>
        {offer.description&&(
          <p className={`mt-2 leading-relaxed text-[#806d70] ${featured?'text-xs sm:text-sm':'line-clamp-2 text-[10px] sm:text-xs'}`}>
            {offer.description}
          </p>
        )}

        {isPack?(
          <div className="mt-4 border-y border-[#eee2e5] py-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8c737a]">Le coffret à</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className={`font-serif font-semibold text-[#8b3f61] ${featured?'text-3xl sm:text-4xl':'text-2xl'}`}>{eur(packPrice)}</span>
              {saving>0&&<s className="text-xs text-[#9c8b90]">{eur(regular)}</s>}
            </div>
            {saving>0&&<p className="mt-1 text-[10px] font-semibold text-[#80611f]">Vous gardez {eur(saving)} dans votre poche</p>}
          </div>
        ):isFree?(
          <div className="mt-4 border-y border-[#eee2e5] py-3">
            <p className="font-serif text-xl text-[#8b3f61]">{Number(offer.buy_qty||1)} achetés + 1 offert</p>
            <p className="mt-1 text-[10px] leading-relaxed text-[#806d70]">Le moins cher est offert automatiquement dès {Number(offer.buy_qty||1)+1} produits de cette sélection.</p>
          </div>
        ):(
          <div className="mt-4 border-y border-[#eee2e5] py-3">
            <p className="font-serif text-xl text-[#8b3f61]">{discountLabel} de réduction</p>
            <p className="mt-1 text-[10px] leading-relaxed text-[#806d70]">Sur chaque unité supplémentaire, selon les conditions de l’offre.</p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-[9px] text-[#927f84]">{items.length} produit{items.length>1?'s':''} sélectionné{items.length>1?'s':''}</span>
          <Link href="/offres" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#593b48] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-white transition hover:bg-[#7b294e]">
            Découvrir <span aria-hidden="true">→</span>
          </Link>
        </div>
        {offer.ends_at&&(
          <p className="mt-2 text-[9px] text-[#927f84]">Offre valable jusqu’au {new Date(offer.ends_at).toLocaleDateString('fr-FR')}</p>
        )}
      </div>
    </article>
  );
}

export default function HomeOffers({offers}:{offers:any[]}){
  if(!offers?.length)return null;
  return(
    <section aria-labelledby="home-offers-title" className="mt-14 sm:mt-16">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#a1844d]">Les belles occasions</p>
          <h2 id="home-offers-title" className="mt-1 font-serif text-2xl text-[#593b48] sm:text-3xl">Promotions & coffrets</h2>
          <p className="mt-2 max-w-md text-[11px] leading-relaxed text-[#806d70] sm:text-xs">Vos sélections beauté préférées, à prix doux.</p>
        </div>
        <Link href="/offres" className="shrink-0 border-b border-[#c6a15b] pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#593b48] sm:text-[10px]">
          Toutes les offres <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:gap-5">
        {offers.map((offer:any)=><OfferCard key={offer.id} offer={offer}/>)}
      </div>
    </section>
  );
}
