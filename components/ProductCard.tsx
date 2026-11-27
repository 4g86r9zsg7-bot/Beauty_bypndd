import Link from 'next/link';
import {eur} from '@/lib/supabase';
import CardBuy from '@/components/CardBuy';
import HeartButton from '@/components/HeartButton';

export default function ProductCard({
  p,
  imageFit='cover',
  highlightPromo=false
}:{
  p:any;
  imageFit?:'cover'|'contain';
  highlightPromo?:boolean;
}){
  const imgs:string[]=p.images||[];
  const variants=Array.isArray(p.variants)?p.variants:[];
  const reservable=p.availability==='preorder'||p.availability==='arrival';
  const available=variants.filter((v:any)=>v&&typeof v==='object'&&['available','last','preorder','arrival'].includes(v.status||'available')&&(v.stock==null||Number(v.stock)>0||reservable));
  const variantPrices=available.map((v:any)=>Number(v.price??p.price)).filter((n:number)=>Number.isFinite(n)&&n>0);
  const basePrice=Number(p.price)||0;
  const startPrice=variantPrices.length?Math.min(...variantPrices):basePrice;
  const differentPrices=variantPrices.length>1&&Math.max(...variantPrices)!==Math.min(...variantPrices);
  const displayPrice=variants.length&&variantPrices.length?startPrice:basePrice;
  const promo=Boolean(p.old_price&&Number(p.old_price)>displayPrice);
  const off=promo?Math.round(100-displayPrice/Number(p.old_price)*100):0;

  const pre=p.availability==='preorder';
  const arr=p.availability==='arrival';
  const sold=p.availability==='soldout'||(!pre&&!arr&&p.stock<=0);
  const inStock=!sold&&!pre&&!arr;

  const badges:{t:string;c:string}[]=[];
  if(sold)badges.push({t:'Épuisé',c:'bg-white/95 text-ink'});
  if(arr)badges.push({t:'Arrivage',c:'bg-plum text-white'});
  if(pre)badges.push({t:'Précommande',c:'bg-plum text-white'});
  if(!sold&&promo)badges.push({t:`PROMO -${off}%`,c:'bg-rose text-white'});
  if(!sold&&p.is_bestseller)badges.push({t:'Best-seller',c:'bg-white/95 text-plum'});
  if(!sold&&p.is_new)badges.push({t:'Nouveau',c:'bg-white/95 text-plum'});

  const imageClass=imageFit==='contain'?'object-contain p-3':'object-cover';
  const brandLine=[
    p.source_name||p.brands?.name,
    p.commercial_range==='petit_prix'?'Petit prix':p.commercial_range==='marques'?'Marques':p.commercial_range==='premium'?'Premium':null
  ].filter(Boolean).join(' · ');

  return (
    <div className="group relative isolate min-w-0">
      <div className="block">
        <div className={`relative overflow-hidden rounded-xl bg-white ring-1 ring-[#eadde2] shadow-sm transition duration-300 group-hover:shadow-md ${
          imageFit==='contain'?'aspect-square':'aspect-[4/5]'
        }`}>
          {imgs[0]?(
            <img
              src={imgs[0]}
              alt={p.name}
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 h-full w-full ${imageClass} transition duration-500 ${
                imgs[1]?'group-hover:opacity-0':'group-hover:scale-105'
              } ${sold?'opacity-60':''}`}
            />
          ):(
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FCF4F6] to-white">
              <span className="font-serif text-4xl text-plum/35">{String(p.name||'B').charAt(0)}</span>
            </div>
          )}

          {imgs[1]&&(
            <img
              src={imgs[1]}
              alt=""
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 h-full w-full ${imageClass} opacity-0 transition duration-500 group-hover:opacity-100`}
            />
          )}

          <div className="absolute left-2 top-2 flex max-w-[85%] flex-col items-start gap-1.5">
            {badges.slice(0,2).map(b=>(
              <span key={b.t} className={`rounded-full px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.1em] shadow-sm ${b.c}`}>
                {b.t}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2.5">
          <p className="truncate text-[9px] font-medium uppercase tracking-[0.14em] text-plum/75">
            {brandLine||'\u00a0'}
          </p>

          <p className="mt-1 min-h-[2.5em] font-serif text-sm leading-snug text-ink line-clamp-2 sm:text-base">
            {p.name}
          </p>

          <div className="mt-2 flex min-h-[25px] flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={`text-[15px] font-bold tracking-tight ${promo&&!sold?'text-rose':'text-plum'}`}>
              {differentPrices?'À partir de ':''}{eur(displayPrice)}
            </span>
            {promo&&(
              <s className="text-[11px] text-ink/45">{eur(p.old_price)}</s>
            )}
          </div>
          {promo&&highlightPromo&&!sold&&(
            <p className="mt-0.5 text-[10px] font-medium text-rose">
              Économisez {eur(Number(p.old_price)-displayPrice)} ({off}%)
            </p>
          )}

          <p className="mt-1 min-h-[16px] text-[10px]">
            {inStock&&(
              p.availability==='last'
                ?<span className="font-medium text-rose">Stock limité</span>
                :<span className="font-medium text-green-700">● En stock</span>
            )}
            {pre&&<span className="font-medium text-plum">Précommande</span>}
            {arr&&<span className="font-medium text-plum">Bientôt disponible</span>}
            {sold&&<span className="text-ink/50">Momentanément indisponible</span>}
          </p>
        </div>
      </div>

      <Link href={`/produit/${p.slug}`} aria-label={`Voir la fiche produit ${p.name}`} className="absolute inset-0 z-[1] cursor-pointer rounded-xl" />

      <div className="relative z-10">
        <CardBuy p={p}/>
      </div>
      <HeartButton id={p.id}/>
    </div>
  );
}
