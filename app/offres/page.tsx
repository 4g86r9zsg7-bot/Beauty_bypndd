
import Link from 'next/link';
import {supabase,eur} from '@/lib/supabase';
import {DELIVERY} from '@/lib/shop';
import OfferBuy from '@/components/OfferBuy';
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

const Divider=()=>(
  <div className="mx-auto mt-4 flex items-center justify-center gap-2" aria-hidden="true">
    <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#C6A15B]"/>
    <span className="h-1.5 w-1.5 rotate-45 bg-[#C6A15B]"/>
    <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#C6A15B]"/>
  </div>
);

export default async function Offres(){
  const now=new Date().toISOString();

  const {data}=await supabase.from('offers')
    .select('*, offer_items(id,variant,qty, products(*,brands(name)))')
    .eq('active',true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('position',{nullsFirst:false})
    .order('created_at',{ascending:false});

  const offers=data||[];
  const packs=offers.filter((o:any)=>o.kind==='pack');
  const free=offers.filter((o:any)=>
    o.kind==='buy_x_get_1'&&!(o.stock!=null&&o.stock-o.sold<=0)
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdfd] pb-16">

      {/* BANNIÈRE */}
      <section className="relative left-1/2 -mt-6 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-br from-[#f8e3eb] via-[#fdf3f6] to-[#f8f1e9] px-4 pb-12 pt-14 text-center md:pb-16 md:pt-20">
        <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#edb9cc]/40 blur-3xl"/>
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[#C6A15B]/20 blur-3xl"/>

        <div className="relative mx-auto max-w-4xl">
          <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-[#C6A15B]/40 bg-white/60 px-5 py-2 backdrop-blur-sm">
            <span className="h-1 w-1 rotate-45 bg-[#C6A15B]"/>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6a22]">Beauty_bypndd</p>
            <span className="h-1 w-1 rotate-45 bg-[#C6A15B]"/>
          </div>

          <h1 className="mt-6 font-serif text-4xl leading-tight text-plum sm:text-5xl md:text-6xl">
            L'art de se faire plaisir
          </h1>
          <p className="mt-2 font-serif text-2xl italic text-[#ad7890] sm:text-3xl">
            à prix privilégiés
          </p>
          <Divider/>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-ink/75 md:text-base">
            Découvrez nos sélections beauté, nos coffrets et nos offres exclusives. Des petites attentions pour vous, à prix tout doux.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3 text-[10px] uppercase tracking-[0.14em] text-plum/80">
            <span className="rounded-full border border-white/80 bg-white/60 px-4 py-2.5">Prix avantageux</span>
            <span className="rounded-full border border-white/80 bg-white/60 px-4 py-2.5">Sélections beauté</span>
            <span className="rounded-full border border-white/80 bg-white/60 px-4 py-2.5">Livraison {DELIVERY}</span>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {packs.length>0&&<a href="#packs" className="rounded-full bg-plum px-7 py-3.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-white shadow-lg transition hover:-translate-y-0.5">Découvrir les packs</a>}
            {free.length>0&&<a href="#offres-speciales" className="rounded-full border border-[#C6A15B] bg-white/80 px-7 py-3.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-plum transition hover:-translate-y-0.5">Offres spéciales</a>}
          </div>
        </div>
      </section>

      {/* AUCUNE OFFRE */}
      {!offers.length&&(
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#C6A15B]/40 bg-[#fdf3f7] font-serif text-3xl text-[#ad7890]">✧</div>
          <p className="mt-6 font-serif text-3xl text-plum">De belles surprises arrivent</p>
          <p className="mt-3 text-sm leading-6 text-ink/60">Aucune offre disponible pour le moment. Revenez bientôt découvrir nos prochaines sélections.</p>
          <Link href="/categorie/nouveautes" className="mt-7 inline-block rounded-full bg-plum px-7 py-3.5 text-xs uppercase tracking-[0.16em] text-white">Découvrir les nouveautés</Link>
        </div>
      )}

      {/* PACKS */}
      {packs.length>0&&(
        <section id="packs" className="mx-auto mt-14 max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.38em]" style={{color:GOLD}}>La sélection Beauty_bypndd</p>
            <h2 className="mt-3 font-serif text-3xl text-plum md:text-4xl">Nos packs exclusifs</h2>
            <Divider/>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-ink/60">Des associations de produits soigneusement sélectionnées pour prendre soin de vous tout en profitant de prix avantageux.</p>
          </div>

          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <article key={o.id} className="group flex flex-col overflow-hidden rounded-[26px] border border-[#f0dce4] bg-white shadow-[0_6px_28px_rgba(122,31,74,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_42px_rgba(122,31,74,.12)]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#f9eaf0] to-[#faf6f1]">
                    {photo?<img src={photo} alt={o.title} loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 ${available?'':'opacity-50 grayscale'}`}/>:<div className="flex h-full items-center justify-center font-serif text-5xl text-[#C6A15B]/60">✧</div>}

                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                      <div className="flex flex-col items-start gap-2">
                        {available&&saving>0&&pct>0&&<span className="rounded-full bg-[#9b426a] px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-md">-{pct} %</span>}
                        {available&&<span className="rounded-full border border-[#C6A15B]/70 bg-white/95 px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-[#8a6a22] shadow-sm">Offre exclusive</span>}
                        {!available&&<span className="rounded-full bg-white/95 px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-ink shadow-sm">Indisponible</span>}
                      </div>
                      {o.tag&&TAGS[o.tag]&&<span className="rounded-full bg-white/90 px-3 py-1.5 text-[9px] uppercase tracking-wider text-plum shadow-sm">{TAGS[o.tag]}</span>}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="font-serif text-2xl leading-snug text-plum">{o.title}</h3>
                    {o.description&&<p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/65">{o.description}</p>}

                    <div className="mt-5 border-t border-[#f0dce4] pt-4">
                      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-plum/55">Composition du pack</p>
                      <ul className="space-y-3">
                        {its.map((it:any)=>(
                          <li key={it.id}>
                            <Link href={`/produit/${it.products.slug}`} className="flex items-center gap-3 transition hover:opacity-75">
                              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#fdf3f7] ring-1 ring-[#f0dce4]">
                                {it.products.images?.[0]&&<img src={it.products.images[0]} alt="" loading="lazy" className="h-full w-full object-cover"/>}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-sm text-plum">{it.qty>1?`${it.qty} × `:''}{it.products.name}{it.variant?<span className="text-ink/55"> ({it.variant})</span>:null}</span>
                              <span className="shrink-0 text-xs text-ink/50">{eur(unitPrice(it)*it.qty)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <OfferDetails title={o.title} description={o.description} items={detailItems}/>

                    <div className="mt-5 rounded-2xl border border-[#f0dce4] bg-gradient-to-br from-[#fdf3f7] to-[#fffaf7] p-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.2em] text-plum/60">Prix du pack</p>
                          <p className="mt-1 font-serif text-4xl leading-none text-rose">{eur(price)}</p>
                        </div>
                        {saving>0&&<div className="text-right"><p className="text-[9px] uppercase tracking-[0.2em] text-plum/60">Au lieu de</p><s className="text-lg text-ink/45">{eur(value)}</s></div>}
                      </div>
                      {saving>0&&<p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#C6A15B]/70 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#8a6a22]"><span className="h-1.5 w-1.5 rotate-45 bg-[#C6A15B]"/>Économisez {eur(saving)}{pct>0?` · -${pct} %`:''}</p>}
                    </div>

                    {o.ends_at&&(
                      <>
                        <p className="mt-3 text-xs text-ink/60">Offre valable jusqu’au {new Date(o.ends_at).toLocaleDateString('fr-FR')}{rest!=null&&rest>0&&rest<=10?` · Plus que ${rest} disponible${rest>1?'s':''}`:''}</p>
                        <OfferCountdown endsAt={o.ends_at}/>
                      </>
                    )}
                    {!o.ends_at&&rest!=null&&rest>0&&rest<=10&&<p className="mt-3 text-xs text-ink/60">Plus que {rest} disponible{rest>1?'s':''}</p>}

                    <div className="mt-auto pt-4">
                      {available?<OfferBuy o={{id:o.id,title:o.title,price,image:photo,max:rest}}/>:<p className="rounded-full border border-sand py-4 text-center text-xs uppercase tracking-[0.2em] text-ink/50">Momentanément indisponible</p>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* OFFRES SPÉCIALES */}
      {free.length>0&&(
        <section id="offres-speciales" className="mx-auto mt-20 max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.38em]" style={{color:GOLD}}>À ne pas manquer</p>
            <h2 className="mt-3 font-serif text-3xl text-plum md:text-4xl">Nos offres spéciales</h2>
            <Divider/>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-ink/60">Profitez de nos promotions et découvrez les produits sélectionnés pour vous.</p>
          </div>

          <div className="mt-9 space-y-10">
            {free.map((o:any)=>{
              const its:any[]=(o.offer_items||[]).filter((it:any)=>it.products&&it.products.active);
              const rest=o.stock!=null?o.stock-o.sold:null;

              return (
                <div key={o.id} className="overflow-hidden rounded-[28px] border border-[#ead9df] bg-white shadow-[0_8px_30px_rgba(122,31,74,.06)]">
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#fbeaf1] via-white to-[#f6efe6] px-5 py-8 text-center md:px-8 md:py-10">
                    <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#C6A15B]/15 blur-3xl"/>
                    <div className="relative">
                      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#C6A15B] bg-white font-serif text-3xl text-[#8a6a22] shadow-sm">{o.buy_qty}+1</span>
                      <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-[#8a6a22]">Offre spéciale</p>
                      <h3 className="mt-2 font-serif text-3xl text-plum">{o.title}</h3>
                      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink/75">{o.buy_qty} achetés = 1 offert : pour {o.buy_qty+1} produits de cette sélection dans votre panier, le moins cher est offert. La remise s’applique automatiquement.</p>
                      {o.description&&<p className="mx-auto mt-2 max-w-xl text-sm text-ink/65">{o.description}</p>}

                      {o.ends_at&&(
                        <>
                          <p className="mt-4 text-xs text-ink/60">Offre valable jusqu’au {new Date(o.ends_at).toLocaleDateString('fr-FR')}</p>
                          <div className="mx-auto max-w-sm"><OfferCountdown endsAt={o.ends_at}/></div>
                        </>
                      )}

                      {rest!=null&&rest<=10&&rest>0&&<p className="mt-3 text-xs text-[#8a6a22]">Plus que {rest} produit{rest>1?'s':''} offert{rest>1?'s':''} disponible{rest>1?'s':''}</p>}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <p className="mb-5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-plum/60">Découvrez les produits participants</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-5">
                      {its.map((it:any)=><ProductCard key={it.id} p={it.products}/>)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* RETOUR BOUTIQUE */}
      <div className="mx-auto mt-16 max-w-7xl px-4 text-center">
        <div className="mx-auto h-px max-w-xs bg-gradient-to-r from-transparent via-[#C6A15B]/60 to-transparent"/>
        <p className="mt-6 font-serif text-2xl text-plum">Un peu de beauté, beaucoup de plaisir.</p>
        <Link href="/" className="mt-5 inline-flex rounded-full border border-[#C6A15B] px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-plum transition hover:bg-[#fdf3f7]">Continuer la découverte</Link>
      </div>
    </main>
  );
}
