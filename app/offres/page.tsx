

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

const GOLD='#C6A15B';

const vlist=(p:any):any[] =>
  (Array.isArray(p?.variants)?p.variants:[]).filter((x:any)=>x&&typeof x==='object');

const unitPrice=(it:any)=>
  Number(vlist(it.products).find((x:any)=>x.name===it.variant)?.price??it.products?.price??0);

const itemOk=(it:any)=>{
  const p=it.products;
  if(!p||!p.active||['soldout','arrival','preorder'].includes(p.availability))return false;
  if(vlist(p).length){
    const v=vlist(p).find((x:any)=>x.name===it.variant);
    return !!v&&Number(v.stock??0)>=it.qty;
  }
  return Number(p.stock)>=it.qty;
};

// Rotation stable pendant 24 h, puis nouvel ordre.
const dailyRotate=(items:any[],seed:string)=>{
  const hash=(value:string)=>{
    let h=2166136261;
    for(let i=0;i<value.length;i++){
      h^=value.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return h>>>0;
  };

  return [...items].sort((a,b)=>{
    const diff=hash(`${seed}:${a.id}`)-hash(`${seed}:${b.id}`);
    return diff||String(a.id).localeCompare(String(b.id));
  });
};

const Divider=()=>(
  <div className="mx-auto mt-4 flex items-center justify-center gap-2" aria-hidden="true">
    <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#C6A15B]"/>
    <span className="h-1.5 w-1.5 rotate-45 bg-[#C6A15B]"/>
    <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#C6A15B]"/>
  </div>
);

export default async function Offres(){
  const now=new Date().toISOString();

  const {data}=await supabase.from('offers')
    .select('*, offer_items(id,variant,qty, products(*,brands(name)))')
    .eq('active',true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('position',{nullsFirst:false});

  const offers=data||[];
  const packs=dailyRotate(
    offers.filter((o:any)=>o.kind==='pack'),
    new Intl.DateTimeFormat('en-CA',{
      timeZone:'Africa/Casablanca',
      year:'numeric',
      month:'2-digit',
      day:'2-digit'
    }).format(new Date())
  );

  const free=dailyRotate(
    offers.filter((o:any)=>
      o.kind==='buy_x_get_1'&&!(o.stock!=null&&o.stock-o.sold<=0)
    ),
    new Intl.DateTimeFormat('en-CA',{
      timeZone:'Africa/Casablanca',
      year:'numeric',
      month:'2-digit',
      day:'2-digit'
    }).format(new Date())
  );

  const packSection=(
    <>
      {packs.length>0&&(
        <section id="packs" className="mx-auto max-w-7xl scroll-mt-24 px-3 py-5 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-3 border-b border-[#f0dce4] pb-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a17b39]">Sélection beauté</p>
              <h2 className="mt-1 font-serif text-2xl text-plum sm:text-3xl">Packs & coffrets</h2>
            </div>
            <span className="rounded-full border border-[#ead9df] bg-white px-3 py-1.5 text-[10px] text-plum/70">
              {packs.length} offre{packs.length>1?'s':''}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {packs.map((o:any)=>{
              const its:any[]=(o.offer_items||[]).filter((it:any)=>it.products);
              const value=its.reduce((s:number,it:any)=>s+unitPrice(it)*it.qty,0);
              const price=Number(o.pack_price);
              const saving=value-price;
              const pct=value>0?Math.round(saving/value*100):0;
              const rest=o.stock!=null?o.stock-o.sold:null;
              const available=its.length>0&&its.every(itemOk)&&(rest==null||rest>0);
              const photo=o.image_url||its.find((it:any)=>it.products?.images?.[0])?.products?.images?.[0];

              const detailItems=its.map((it:any)=>({
                id:String(it.id),
                name:it.products.name,
                image:it.products.images?.[0]||null,
                qty:Number(it.qty)||1,
                variant:it.variant||null,
                priceLabel:eur(unitPrice(it)*it.qty)
              }));

              return (
                <article key={o.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#f0dce4] bg-white shadow-[0_4px_18px_rgba(122,31,74,.06)] transition duration-300 hover:shadow-[0_10px_28px_rgba(122,31,74,.12)]">
                  <div className="relative aspect-square overflow-hidden bg-[#fdf3f7]">
                    {photo
                      ?<img src={photo} alt={o.title} loading="lazy" decoding="async" className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${available?'':'opacity-50 grayscale'}`}/>
                      :<div className="flex h-full items-center justify-center font-serif text-5xl text-[#C6A15B]/60">✧</div>
                    }

                    <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
                      {available&&saving>0&&pct>0&&(
                        <span className="rounded-full bg-[#963e66] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">-{pct}%</span>
                      )}
                      {!available&&(
                        <span className="rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-semibold text-ink shadow-sm">Indisponible</span>
                      )}
                    </div>

                    {o.tag&&TAGS[o.tag]&&(
                      <span className="absolute bottom-2 left-2 max-w-[90%] truncate rounded-full bg-white/95 px-2.5 py-1 text-[9px] text-plum shadow-sm">{TAGS[o.tag]}</span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-3 sm:p-5">
                    <h3 className="line-clamp-2 font-serif text-base leading-snug text-plum sm:text-xl">{o.title}</h3>
                    {o.description&&<p className="mt-1 line-clamp-2 text-[11px] leading-5 text-ink/60 sm:text-sm">{o.description}</p>}

                    <div className="mt-3 border-t border-[#f0dce4] pt-3">
                      <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-plum/55">Composition</p>
                      <ul className="space-y-2">
                        {its.map((it:any)=>(
                          <li key={it.id}>
                            <Link href={`/produit/${it.products.slug}`} className="flex min-w-0 items-center gap-2 hover:opacity-75">
                              <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#fdf3f7]">
                                {it.products.images?.[0]&&<img src={it.products.images[0]} alt="" loading="lazy" className="h-full w-full object-cover"/>}
                              </span>
                              <span className="min-w-0 flex-1 line-clamp-2 text-[10px] leading-4 text-plum sm:text-xs">
                                {it.qty>1?`${it.qty} × `:''}{it.products.name}
                                {it.variant?` (${it.variant})`:''}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <OfferDetails title={o.title} description={o.description} items={detailItems}/>

                    <div className="mt-3 rounded-xl bg-[#fdf3f7] p-3">
                      <p className="text-[9px] uppercase tracking-wider text-plum/60">Prix du pack</p>
                      <div className="mt-1 flex flex-wrap items-baseline gap-2">
                        <span className="font-serif text-2xl text-rose sm:text-3xl">{eur(price)}</span>
                        {saving>0&&<s className="text-xs text-ink/45">{eur(value)}</s>}
                      </div>
                      {saving>0&&(
                        <p className="mt-1 text-[10px] font-semibold text-[#8a6a22]">
                          Économisez {eur(saving)}{pct>0?` · -${pct}%`:''}
                        </p>
                      )}
                    </div>

                    {o.ends_at&&(
                      <>
                        <p className="mt-2 text-[10px] text-ink/60">
                          Jusqu'au {new Date(o.ends_at).toLocaleDateString('fr-FR')}
                          {rest!=null&&rest>0&&rest<=10?` · Plus que ${rest}`:''}
                        </p>
                        <OfferCountdown endsAt={o.ends_at}/>
                      </>
                    )}
                    {!o.ends_at&&rest!=null&&rest>0&&rest<=10&&(
                      <p className="mt-2 text-[10px] text-ink/60">Plus que {rest} disponible{rest>1?'s':''}</p>
                    )}

                    <div className="mt-auto pt-3">
                      {available
                        ?<OfferBuy o={{id:o.id,title:o.title,price,image:photo,max:rest}}/>
                        :<p className="rounded-full border border-sand py-3 text-center text-[9px] uppercase tracking-wider text-ink/50">Momentanément indisponible</p>
                      }
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

  const specialSection=(
    <>
      {free.length>0&&(
        <section id="offres-speciales" className="mx-auto max-w-7xl scroll-mt-24 px-3 py-5 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-3 border-b border-[#f0dce4] pb-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a17b39]">À saisir</p>
              <h2 className="mt-1 font-serif text-2xl text-plum sm:text-3xl">Offres spéciales</h2>
            </div>
            <span className="rounded-full border border-[#ead9df] bg-white px-3 py-1.5 text-[10px] text-plum/70">
              {free.length} offre{free.length>1?'s':''}
            </span>
          </div>

          <div className="space-y-6">
            {free.map((o:any)=>{
              const its:any[]=(o.offer_items||[]).filter((it:any)=>it.products&&it.products.active);
              const rest=o.stock!=null?o.stock-o.sold:null;

              return (
                <div key={o.id} className="overflow-hidden rounded-2xl border border-[#ead9df] bg-white shadow-[0_4px_18px_rgba(122,31,74,.05)]">
                  <div className="flex flex-col gap-3 bg-gradient-to-r from-[#fdf0f5] to-[#faf5ed] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8a6a22]">Offre spéciale</p>
                      <h3 className="mt-1 font-serif text-xl text-plum sm:text-2xl">{o.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-ink/70">
                        {o.buy_qty} achetés = 1 offert. Pour {o.buy_qty+1} produits de cette sélection dans votre panier, le moins cher est offert automatiquement.
                      </p>
                      {o.description&&<p className="mt-1 text-xs text-ink/60">{o.description}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C6A15B] bg-white font-serif text-xl text-[#8a6a22]">{o.buy_qty}+1</span>
                      {o.ends_at&&<div className="text-[10px] text-ink/60">Jusqu'au {new Date(o.ends_at).toLocaleDateString('fr-FR')}</div>}
                    </div>
                  </div>

                  {o.ends_at&&<div className="px-4 pt-2 sm:px-6"><OfferCountdown endsAt={o.ends_at}/></div>}
                  {rest!=null&&rest<=10&&rest>0&&(
                    <p className="px-4 pt-2 text-[10px] text-[#8a6a22]">Plus que {rest} produit{rest>1?'s':''} offert{rest>1?'s':''} disponible{rest>1?'s':''}</p>
                  )}

                  <div className="p-3 sm:p-5">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 md:gap-x-5">
                      {its.map((it:any)=><ProductCard key={it.id} p={it.products}/>)}
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
    <main className="min-h-screen overflow-hidden bg-[#fffdfd] pb-12">

      {/* EN-TÊTE COMPACT */}
      <section className="border-b border-[#f0dce4] bg-gradient-to-r from-[#fdf0f5] via-[#fffdfd] to-[#faf5ed] px-4 py-7 text-center sm:py-9">
        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#9a773c]">Beauty_bypndd</p>
        <h1 className="mt-2 font-serif text-3xl text-plum sm:text-4xl">Offres & bons plans</h1>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-ink/65 sm:text-sm">
          Retrouvez nos packs beauté et nos offres exclusives à prix doux.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-[9px] uppercase tracking-wider text-plum/70">
          <span className="rounded-full border border-[#ead9df] bg-white/80 px-3 py-1.5">Prix avantageux</span>
          <span className="rounded-full border border-[#ead9df] bg-white/80 px-3 py-1.5">Livraison {DELIVERY}</span>
        </div>
      </section>

      {!offers.length?(
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#C6A15B]/40 bg-[#fdf3f7] font-serif text-3xl text-[#ad7890]">✧</div>
          <p className="mt-6 font-serif text-3xl text-plum">De belles surprises arrivent</p>
          <p className="mt-3 text-sm leading-6 text-ink/60">Aucune offre disponible pour le moment. Revenez bientôt découvrir nos prochaines sélections.</p>
          <Link href="/categorie/nouveautes" className="mt-7 inline-block rounded-full bg-plum px-7 py-3.5 text-xs uppercase tracking-wider text-white">Découvrir les nouveautés</Link>
        </div>
      ):(
        <>
          <div className="mx-auto max-w-7xl px-3 pt-6 sm:px-6 lg:px-8">
            <OfferTypeFilter packs={packSection} specials={specialSection}/>
          </div>
        </>
      )}

      <div className="mx-auto mt-8 max-w-7xl px-4 text-center">
        <div className="mx-auto h-px max-w-xs bg-gradient-to-r from-transparent via-[#C6A15B]/60 to-transparent"/>
        <p className="mt-5 font-serif text-xl text-plum">Un peu de beauté, beaucoup de plaisir.</p>
        <Link href="/" className="mt-4 inline-flex rounded-full border border-[#C6A15B] px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-plum transition hover:bg-[#fdf3f7]">Continuer la découverte</Link>
      </div>
    </main>
  );
}
