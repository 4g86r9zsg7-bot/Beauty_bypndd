


import Link from 'next/link';
import {supabase,eur} from '@/lib/supabase';
import {DELIVERY} from '@/lib/shop';
import OfferBuy from '@/components/OfferBuy';
import OfferTypeFilter from '@/components/OfferTypeFilter';
import ProductCard from '@/components/ProductCard';
import {OfferCountdown,OfferDetails} from '@/components/OfferExtras';

export const dynamic='force-dynamic';

const title='Packs & Offres exclusives | Beauty_bypndd';
const description='Découvrez les packs beauté et offres exclusives Beauty_bypndd à prix avantageux.';

export const metadata={
  title,
  description,
  alternates:{canonical:'/offres'},
  openGraph:{title,description,url:'/offres',siteName:'Beauty_bypndd',locale:'fr_FR',type:'website'}
};

const TAGS:Record<string,string>={
  visage:'Routine visage',
  cheveux:'Routine cheveux',
  maquillage:'Routine maquillage',
  coffret:'Coffret',
  special:'Offre spéciale'
};

const vlist=(p:any):any[] =>
  (Array.isArray(p?.variants)?p.variants:[]).filter((x:any)=>x&&typeof x==='object');

const variantFor=(it:any)=>
  vlist(it.products).find((x:any)=>x.name===it.variant);

const itemPhoto=(it:any)=>
  variantFor(it)?.image||
  variantFor(it)?.images?.[0]||
  it.products?.images?.[0]||
  null;

const unitPrice=(it:any)=>
  Number(variantFor(it)?.price??it.products?.price??0);

const itemOk=(it:any)=>{
  const p=it.products;
  if(!p||!p.active||['soldout','arrival','preorder'].includes(p.availability))return false;

  if(vlist(p).length){
    const v=vlist(p).find((x:any)=>x.name===it.variant);
    return !!v&&Number(v.stock??0)>=it.qty;
  }

  return Number(p.stock)>=it.qty;
};

const packSavings=(o:any)=>{
  const items=(o.offer_items||[]).filter((it:any)=>it.products);
  const regular=items.reduce((sum:number,it:any)=>sum+unitPrice(it)*Number(it.qty||1),0);
  const saving=Math.max(0,regular-Number(o.pack_price||0));
  return {saving,rate:regular>0?saving/regular:0};
};

const variantDiscountRate=(o:any)=>{
  const item=(o.offer_items||[]).find((it:any)=>it.products);
  if(!item)return 0;
  const price=unitPrice(item);
  if(price<=0)return 0;
  const value=Number(o.discount_value||0);
  const saving=o.discount_type==='amount'
    ?Math.min(price,value)
    :price*Math.min(value,90)/100;
  return saving/price;
};

export default async function Offres(){export default async function Offres(){
  const now=new Date().toISOString();

  const {data}=await supabase.from('offers')
    .select('*, offer_items(id,variant,qty, products(*,brands(name)))')
    .eq('active',true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('position',{nullsFirst:false});

  const offers=data||[];

  // Mettre d'abord en avant les offres qui apportent la plus forte économie réelle.
  const packs=offers
    .filter((o:any)=>o.kind==='pack')
    .sort((a:any,b:any)=>{
      const sa=packSavings(a);
      const sb=packSavings(b);
      return sb.rate-sa.rate||sb.saving-sa.saving;
    });

  const free=offers.filter((o:any)=>
    o.kind==='buy_x_get_1'&&!(o.stock!=null&&o.stock-o.sold<=0)
  );

  const variantDiscounts=offers
    .filter((o:any)=>
      o.kind==='variant_discount'&&
      o.discount_value>0&&
      !(o.stock!=null&&o.stock-o.sold<=0)
    )
    .sort((a:any,b:any)=>variantDiscountRate(b)-variantDiscountRate(a));

  const packSection=(
    <>
      {packs.length>0&&(
        <section id="packs" className="mx-auto max-w-7xl scroll-mt-24 px-3 py-5 sm:px-6 lg:px-8">

          <div className="mb-5 flex items-end justify-between gap-3 border-b border-[#f0dce4] pb-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a17b39]">
                Sélection beauté
              </p>
              <h2 className="mt-1 font-serif text-2xl text-plum sm:text-3xl">
                Packs & coffrets
              </h2>
            </div>
            <span className="rounded-full border border-[#ead9df] bg-white px-3 py-1.5 text-[10px] text-plum/70">
              {packs.length} offre{packs.length>1?'s':''}
            </span>
          </div>

          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {packs.map((o:any)=>{
              const its:any[]=(o.offer_items||[]).filter((it:any)=>it.products);
              const value=its.reduce((s:number,it:any)=>s+unitPrice(it)*it.qty,0);
              const price=Number(o.pack_price);
              const saving=value-price;
              const pct=value>0?Math.round(saving/value*100):0;
              const rest=o.stock!=null?o.stock-o.sold:null;
              const available=its.length>0&&its.every(itemOk)&&(rest==null||rest>0);

              const packPhotos=its.map((it:any)=>({
                url:itemPhoto(it),
                name:it.products.name,
                variant:it.variant||''
              })).filter((x:any)=>x.url).slice(0,4);
              const photo=o.image_url||packPhotos[0]?.url||null;
              const photoCount=packPhotos.length;
              // Composition adaptative : 2 photos côte à côte, 3 en mosaïque équilibrée,
              // 4 en grille 2×2. Les images restent entièrement visibles.
              const photoGridClass=photoCount===2
                ?'grid-cols-2 grid-rows-1'
                :photoCount===3
                  ?'grid-cols-[1.15fr_1fr] grid-rows-2'
                  :'grid-cols-2 grid-rows-2';
              const photoFrameClass=photoCount===2?'aspect-[2/1]':'aspect-square';

              const detailItems=its.map((it:any)=>({
                id:String(it.id),
                name:it.products.name,
                image:itemPhoto(it),
                qty:Number(it.qty)||1,
                variant:it.variant||null,
                priceLabel:eur(unitPrice(it)*it.qty)
              }));

              return (
                <article
                  key={o.id}
                  className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#f0dce4] bg-white shadow-[0_4px_16px_rgba(122,31,74,.06)]"
                >
                  {/* PHOTO ENTIÈRE */}
                  <div className={`relative ${photoFrameClass} overflow-hidden bg-[#fffafb] p-1.5 sm:p-2`}>
                    {photoCount>1?(
                      <div className={`grid h-full w-full ${photoGridClass} gap-1.5 sm:gap-2 ${available?'':'opacity-50 grayscale'}`}>
                        {packPhotos.map((item:any,index:number)=>(
                          <div
                            key={item.variant+'-'+index}
                            className={`flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 sm:p-2 ${photoCount===3&&index===0?'row-span-2':''}`}
                          >
                            <img src={item.url} alt={item.name+(item.variant?' - '+item.variant:'')} loading="lazy" decoding="async" className="h-full w-full object-contain"/>
                          </div>
                        ))}
                      </div>
                    ):photo?(
                      <img
                        src={photo}
                        alt={o.title}
                        loading="lazy"
                        decoding="async"
                        className={`h-full w-full object-contain p-2 sm:p-3 ${available?'':'opacity-50 grayscale'}`}
                      />
                    ):(
                      <div className="flex h-full items-center justify-center font-serif text-5xl text-[#C6A15B]/60">
                        ✧
                      </div>
                    )}

                    <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
                      {available&&saving>0&&pct>0&&(
                        <span className="rounded-full bg-[#963e66] px-2 py-1 text-[9px] font-bold text-white shadow-sm">
                          -{pct}%
                        </span>
                      )}

                      {!available&&(
                        <span className="rounded-full bg-white/95 px-2 py-1 text-[9px] font-semibold text-ink shadow-sm">
                          Indisponible
                        </span>
                      )}
                    </div>

                    {o.tag&&TAGS[o.tag]&&(
                      <span className="absolute bottom-2 left-2 max-w-[90%] truncate rounded-full bg-white/95 px-2 py-1 text-[9px] text-plum shadow-sm">
                        {TAGS[o.tag]}
                      </span>
                    )}
                  </div>

                  {/* INFORMATIONS COMPACTES */}
                  <div className="flex flex-1 flex-col p-2.5 sm:p-4">
                    <h3 className="line-clamp-2 min-h-[2.6em] font-serif text-sm leading-snug text-plum sm:text-lg">
                      {o.title}
                    </h3>

                    {o.description&&(
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-ink/60 sm:text-xs">
                        {o.description}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-1 border-t border-[#f0dce4] pt-2">
                      <span className="text-[9px] text-plum/60">
                        {its.reduce((sum:number,it:any)=>sum+Number(it.qty||1),0)} article{its.reduce((sum:number,it:any)=>sum+Number(it.qty||1),0)>1?'s':''} inclus
                      </span>
                      <OfferDetails
                        title={o.title}
                        description={o.description}
                        items={detailItems}
                      />
                    </div>

                    {/* PRIX */}
                    <div className="mt-2 rounded-xl border border-[#f1dce5] bg-gradient-to-br from-[#fff4f8] to-[#fcf7f0] px-3 py-3 sm:px-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-plum/65">
                          Prix du pack
                        </p>
                        {saving>0&&pct>0&&(
                          <span className="rounded-full bg-[#963e66] px-2 py-1 text-[9px] font-bold text-white">
                            -{pct}%
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-serif text-2xl font-semibold leading-none text-rose sm:text-3xl">
                          {eur(price)}
                        </span>
                        {saving>0&&(
                          <s className="text-xs text-ink/45">
                            {eur(value)}
                          </s>
                        )}
                      </div>

                      {saving>0&&(
                        <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#80611f]">
                          <span aria-hidden="true">✦</span>
                          Vous économisez {eur(saving)}
                        </p>
                      )}
                    </div>

                    {o.ends_at&&(
                      <div className="mt-2">
                        <p className="text-[9px] text-ink/60">
                          Jusqu'au {new Date(o.ends_at).toLocaleDateString('fr-FR')}
                        </p>
                        <OfferCountdown endsAt={o.ends_at}/>
                      </div>
                    )}

                    {!o.ends_at&&rest!=null&&rest>0&&rest<=10&&(
                      <p className="mt-2 text-[9px] text-ink/60">
                        Plus que {rest} disponible{rest>1?'s':''}
                      </p>
                    )}

                    <div className="mt-auto pt-3">
                      {available?(
                        <OfferBuy o={{
                          id:o.id,
                          title:o.title,
                          price,
                          image:photo,
                          max:rest
                        }}/>
                      ):(
                        <p className="rounded-full border border-sand px-1 py-2.5 text-center text-[8px] uppercase tracking-wider text-ink/50 sm:text-[9px]">
                          Momentanément indisponible
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );

  const variantDiscountSection=(
    <>
      {variantDiscounts.length>0&&(
        <section id="variantes-reduites" className="mx-auto max-w-7xl scroll-mt-24 px-3 py-5 sm:px-6 lg:px-8">
          <div className="mb-5 border-b border-[#f0dce4] pb-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a17b39]">Avantage supplémentaire</p>
            <h2 className="mt-1 font-serif text-2xl text-plum sm:text-3xl">Vos variantes à prix réduit</h2>
            <p className="mt-1 text-xs text-ink/60">La première unité reste au tarif normal, les suivantes profitent de la réduction.</p>
          </div>
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {variantDiscounts.map((o:any)=>{
              const its:any[]=(o.offer_items||[]).filter((it:any)=>it.products&&it.products.active);
              const rest=o.stock!=null?o.stock-o.sold:null;
              const discountLabel=o.discount_type==='amount'?eur(o.discount_value):String(o.discount_value)+'%';
              return its.map((it:any)=>{
                const p=it.products;
                const variants=vlist(p);
                const variant=it.variant?variants.find((v:any)=>v.name===it.variant):null;
                const price=Number(variant?.price??p.price??0);
                const discounted=o.discount_type==='amount'?Math.max(0,price-Number(o.discount_value)):price*(1-Number(o.discount_value)/100);
                return (
                  <article key={o.id+'-'+it.id} className="overflow-hidden rounded-2xl border border-[#f0dce4] bg-white shadow-[0_4px_16px_rgba(122,31,74,.06)]">
                    <div className="aspect-square bg-[#fdf3f7]">
                      {p.images?.[0]?<img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-contain p-3"/>:<div className="flex h-full items-center justify-center font-serif text-5xl text-[#C6A15B]/60">✧</div>}
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-[#8a6a22]">{o.title}</p>
                      <h3 className="mt-1 line-clamp-2 font-serif text-base text-plum sm:text-lg">{p.name}</h3>
                      {it.variant&&<p className="mt-1 text-[10px] text-ink/60">Variante : {it.variant}</p>}
                      <p className="mt-2 text-[9px] text-ink/60">1re unité : {eur(price)}</p>
                      <p className="mt-0.5 font-serif text-xl text-rose">{eur(discounted)} <span className="font-sans text-[9px] text-ink/60">dès la 2e unité</span></p>
                      <p className="mt-1 text-[10px] font-semibold text-[#8a6a22]">{discountLabel} de réduction sur chaque unité supplémentaire</p>
                      {o.description&&<p className="mt-2 line-clamp-2 text-[10px] text-ink/60">{o.description}</p>}
                      {rest!=null&&<p className="mt-2 text-[9px] text-ink/60">{Math.max(rest,0)} réduction(s) restante(s)</p>}
                      <Link href={'/produit/'+(p.slug||p.id)} className="mt-3 block rounded-full bg-plum px-3 py-2.5 text-center text-[9px] uppercase tracking-wider text-white">Choisir ce produit</Link>
                    </div>
                  </article>
                );
              });
            })}
          </div>
        </section>
      )}
    </>
  );
  const specialSection=(
    <>
      {free.length>0&&(
        <section id="offres-speciales" className="mx-auto max-w-7xl scroll-mt-24 px-3 py-5 sm:px-6 lg:px-8">

          <div className="mb-5 flex items-end justify-between gap-3 border-b border-[#f0dce4] pb-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a17b39]">
                À saisir
              </p>
              <h2 className="mt-1 font-serif text-2xl text-plum sm:text-3xl">
                Offres spéciales
              </h2>
            </div>
            <span className="rounded-full border border-[#ead9df] bg-white px-3 py-1.5 text-[10px] text-plum/70">
              {free.length} offre{free.length>1?'s':''}
            </span>
          </div>

          <div className="space-y-4">
            {free.map((o:any)=>{
              const its:any[]=(o.offer_items||[]).filter((it:any)=>it.products&&it.products.active);
              const rest=o.stock!=null?o.stock-o.sold:null;

              return (
                <div
                  key={o.id}
                  className="overflow-hidden rounded-2xl border border-[#ead9df] bg-white shadow-[0_4px_16px_rgba(122,31,74,.05)]"
                >
                  <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#fdf0f5] to-[#faf5ed] p-3 sm:px-5 sm:py-4">
                    <div className="min-w-0">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#8a6a22]">
                        Offre spéciale
                      </p>
                      <h3 className="mt-1 font-serif text-lg leading-snug text-plum sm:text-2xl">
                        {o.title}
                      </h3>
                      <p className="mt-1 text-[10px] leading-4 text-ink/70 sm:text-xs">
                        {o.buy_qty} achetés = 1 offert. Le moins cher est offert automatiquement pour {o.buy_qty+1} produits de cette sélection.
                      </p>
                      {o.description&&(
                        <p className="mt-1 line-clamp-2 text-[10px] text-ink/60">
                          {o.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C6A15B] bg-white font-serif text-lg text-[#8a6a22] sm:h-12 sm:w-12 sm:text-xl">
                        {o.buy_qty}+1
                      </span>
                      {o.ends_at&&(
                        <span className="text-[8px] text-ink/60">
                          Jusqu'au {new Date(o.ends_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {o.ends_at&&(
                    <div className="px-3 pt-2 sm:px-5">
                      <OfferCountdown endsAt={o.ends_at}/>
                    </div>
                  )}

                  {rest!=null&&rest<=10&&rest>0&&(
                    <p className="px-3 pt-2 text-[9px] text-[#8a6a22] sm:px-5">
                      Plus que {rest} produit{rest>1?'s':''} offert{rest>1?'s':''} disponible{rest>1?'s':''}
                    </p>
                  )}

                  <div className="p-3 sm:p-5">
                    <div className="grid grid-cols-2 items-start gap-x-3 gap-y-4 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
                      {its.map((it:any)=>(
                        <ProductCard
                          key={it.id}
                          p={it.products}
                          imageFit="contain"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdfd] pb-10">

      <section className="border-b border-[#f0dce4] bg-gradient-to-r from-[#fdf0f5] via-[#fffdfd] to-[#faf5ed] px-4 py-6 text-center sm:py-9">
        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#9a773c]">
          Beauty_bypndd
        </p>
        <h1 className="mt-2 font-serif text-3xl text-plum sm:text-4xl">
          Offres & bons plans
        </h1>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-ink/65 sm:text-sm">
          Retrouvez nos packs beauté, variantes à prix réduit et offres exclusives à prix doux.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-[9px] uppercase tracking-wider text-plum/70">
          <span className="rounded-full border border-[#ead9df] bg-white/80 px-3 py-1.5">
            Prix avantageux
          </span>
          <span className="rounded-full border border-[#ead9df] bg-white/80 px-3 py-1.5">
            Livraison {DELIVERY}
          </span>
        </div>
      </section>

      {!offers.length?(
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#C6A15B]/40 bg-[#fdf3f7] font-serif text-3xl text-[#ad7890]">
            ✧
          </div>
          <p className="mt-6 font-serif text-3xl text-plum">
            De belles surprises arrivent
          </p>
          <p className="mt-3 text-sm leading-6 text-ink/60">
            Aucune offre disponible pour le moment. Revenez bientôt découvrir nos prochaines sélections.
          </p>
          <Link href="/categorie/nouveautes" className="mt-7 inline-block rounded-full bg-plum px-7 py-3.5 text-xs uppercase tracking-wider text-white">
            Découvrir les nouveautés
          </Link>
        </div>
      ):(
        <div className="mx-auto max-w-7xl px-3 pt-5 sm:px-6 lg:px-8">
          <OfferTypeFilter packs={packSection} variants={variantDiscountSection} buyOneGetOne={specialSection}/>
        </div>
      )}

      <div className="mx-auto mt-7 max-w-7xl px-4 text-center">
        <div className="mx-auto h-px max-w-xs bg-gradient-to-r from-transparent via-[#C6A15B]/60 to-transparent"/>
        <p className="mt-5 font-serif text-xl text-plum">
          Un peu de beauté, beaucoup de plaisir.
        </p>
        <Link href="/" className="mt-4 inline-flex rounded-full border border-[#C6A15B] px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-plum transition hover:bg-[#fdf3f7]">
          Continuer la découverte
        </Link>
      </div>
    </main>
  );
}
