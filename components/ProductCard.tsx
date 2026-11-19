
import Link from 'next/link';
import {eur} from '@/lib/supabase';
import CardBuy from '@/components/CardBuy';
import HeartButton from '@/components/HeartButton';

export default function ProductCard({
  p,
  imageFit='cover'
}:{
  p:any;
  imageFit?:'cover'|'contain';
}){
  const imgs:string[]=p.images||[];
  const promo=p.old_price&&p.old_price>p.price;
  const off=promo?Math.round(100-p.price/p.old_price*100):0;

  const pre=p.availability==='preorder';
  const arr=p.availability==='arrival';
  const sold=p.availability==='soldout'||(!pre&&!arr&&p.stock<=0);
  const inStock=!sold&&!pre&&!arr;

  const tag="px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase leading-none";
  const badges:{t:string;c:string}[]=[];

  if(sold)badges.push({t:'Épuisé',c:'bg-white text-ink'});
  if(arr)badges.push({t:'Arrivage',c:'bg-deep text-white'});
  if(pre)badges.push({t:'Précommande',c:'bg-deep text-white'});
  if(!sold&&promo)badges.push({t:`-${off}%`,c:'bg-rose text-white'});
  if(!sold&&p.is_bestseller)badges.push({t:'Best-seller',c:'bg-plum text-white'});
  if(!sold&&p.is_new)badges.push({t:'Nouveau',c:'bg-white text-plum'});

  const imageClass=imageFit==='contain'
    ?'object-contain p-2'
    :'object-cover';

  return (
    <div className="group relative min-w-0">
      <Link href={`/produit/${p.slug}`} className="block">
        <div className={`relative overflow-hidden bg-sand ${
          imageFit==='contain'?'aspect-square':'aspect-[4/5]'
        }`}>
          {imgs[0]&&(
            <img
              src={imgs[0]}
              alt={p.name}
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 h-full w-full ${imageClass} transition duration-500 ${
                imgs[1]?'group-hover:opacity-0':'group-hover:scale-105'
              } ${sold?'opacity-60':''}`}
            />
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

          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {badges.slice(0,2).map(b=>(
              <span key={b.t} className={`${tag} ${b.c}`}>
                {b.t}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <p className="truncate text-[9px] uppercase tracking-[0.16em] text-plum/70">
            {p.brands?.name||'\u00a0'}
          </p>

          <p className="mt-1 min-h-[2.5em] font-serif text-sm leading-snug text-ink line-clamp-2 sm:text-base">
            {p.name}
          </p>

          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className={`font-semibold ${promo&&!sold?'text-rose':'text-ink'}`}>
              {eur(p.price)}
            </span>
            {promo&&(
              <s className="text-xs text-ink/50">{eur(p.old_price)}</s>
            )}
          </p>

          <p className="mt-1 h-4 text-[10px]">
            {inStock&&(
              p.availability==='last'
                ?<span className="text-rose">Stock limité</span>
                :<span className="text-green-700">● En stock</span>
            )}
          </p>
        </div>
      </Link>

      <CardBuy p={p}/>
      <HeartButton id={p.id}/>
    </div>
  );
}
