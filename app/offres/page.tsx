import Link from 'next/link';
import {supabase,eur} from '@/lib/supabase';
import {DELIVERY} from '@/lib/shop';
import OfferBuy from '@/components/OfferBuy';
import ProductCard from '@/components/ProductCard';

export const dynamic='force-dynamic';

const title='Packs & Offres exclusives | Beauty_bypndd';
const description='Packs beauté à prix avantageux, routines visage, cheveux et maquillage, coffrets et offres exclusives chez Beauty_bypndd.';
export const metadata={title,description,alternates:{canonical:'/offres'},openGraph:{title,description,url:'/offres',siteName:'Beauty_bypndd',locale:'fr_FR',type:'website'}};

const TAGS:Record<string,string>={visage:'Routine visage',cheveux:'Routine cheveux',maquillage:'Routine maquillage',coffret:'Coffret',special:'Offre spéciale'};
const GOLD='#C6A15B';

// Seules les variantes « objet » (avec stock et prix) sont gérées côté base.
const vlist=(p:any):any[]=>(Array.isArray(p?.variants)?p.variants:[]).filter((x:any)=>x&&typeof x==='object');
const unitPrice=(it:any)=>Number(vlist(it.products).find((x:any)=>x.name===it.variant)?.price??it.products?.price??0);
const itemOk=(it:any)=>{
  const p=it.products;
  if(!p||!p.active||['soldout','arrival','preorder'].includes(p.availability))return false;
  if(vlist(p).length){const v=vlist(p).find((x:any)=>x.name===it.variant);return !!v&&Number(v.stock??0)>=it.qty}
  return Number(p.stock)>=it.qty;
};

const Divider=()=><div className="mx-auto mt-3 flex items-center justify-center gap-2" aria-hidden="true"><span className="h-px w-12 bg-gradient-to-r from-transparent to-[#C6A15B]"/><span className="h-1.5 w-1.5 rotate-45 bg-[#C6A15B]"/><span className="h-px w-12 bg-gradient-to-l from-transparent to-[#C6A15B]"/></div>;

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
  const free=offers.filter((o:any)=>o.kind==='buy_x_get_1'&&!(o.stock!=null&&o.stock-o.sold<=0));

  return <>
    {/* Bannière */}
    <section className="relative left-1/2 -mt-6 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-b from-[#f9e6ee] via-[#fdf3f7] to-white px-4 pb-10 pt-12 text-center md:pb-14 md:pt-16">
      <div className="pointer-events-none absolute -left-16 top-6 h-48 w-48 rounded-full bg-[#f3c9d9]/40 blur-3xl" aria-hidden="true"/>
      <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-[#C6A15B]/15 blur-3xl" aria-hidden="true"/>
      <div className="relative mx-auto max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.4em]" style={{color:GOLD}}>Beauty_bypndd</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-plum md:text-6xl">Offres exclusives &amp; Packs</h1>
        <Divider/>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink/75 md:text-lg">Des sélections beauté pensées pour vous, à prix avantageux, pendant une durée limitée.</p>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-plum/80">
          <li className="flex items-center gap-2"><span className="h-1 w-1 rotate-45 bg-[#C6A15B]"/>Prix avantageux</li>
          <li className="flex items-center gap-2"><span className="h-1 w-1 rotate-45 bg-[#C6A15B]"/>Offres à durée limitée</li>
          <li className="flex items-center gap-2"><span className="h-1 w-1 rotate-45 bg-[#C6A15B]"/>Livraison en {DELIVERY}</li>
        </ul>
        {packs.length>0&&free.length>0&&<div className="mt-7 flex flex-wrap justify-center gap-3">
          <a href="#packs" className="rounded-full bg-plum px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-white">Nos packs exclusifs</a>
          <a href="#offres-speciales" className="rounded-full border border-[#C6A15B] bg-white px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-plum">Nos offres spéciales</a>
        </div>}
      </div>
    </section>

    {!offers.length&&<div className="mx-auto max-w-md py-16 text-center"><p className="font-serif text-3xl text-plum">Aucune offre pour le moment</p><p className="mt-2 text-sm text-ink/60">Revenez bientôt : de nouvelles offres arrivent régulièrement.</p><Link href="/categorie/nouveautes" className="mt-6 inline-block rounded-full border border-plum px-6 py-3 text-xs uppercase tracking-[0.18em] text-plum">Voir les nouveautés</Link></div>}

    {/* Packs exclusifs */}
    {packs.length>0&&<section id="packs" className="mt-12 scroll-mt-24">
      <div className="text-center"><p className="text-[11px] uppercase tracking-[0.35em]" style={{color:GOLD}}>Sélection premium</p><h2 className="mt-2 font-serif text-3xl text-plum md:text-4xl">Nos packs exclusifs</h2><Divider/></div>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packs.map((o:any)=>{
          const its:any[]=(o.offer_items||[]).filter((it:any)=>it.products);
          const value=its.reduce((s:number,it:any)=>s+unitPrice(it)*it.qty,0);
          const price=Number(o.pack_price);
          const saving=value-price;const pct=value>0?Math.round(saving/value*100):0;
          const rest=o.stock!=null?o.stock-o.sold:null;
          const available=its.length>0&&its.every(itemOk)&&(rest==null||rest>0);
          const photo=o.image_url||its.find((it:any)=>it.products?.images?.[0])?.products?.images?.[0];
          return <article key={o.id} className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(122,31,74,.07)] ring-1 ring-[#f0dce4] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(122,31,74,.14)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#fbeff3] to-white">
              {photo&&<img src={photo} alt={o.title} loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 ${available?'':'opacity-50 grayscale'}`}/>}
              <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                {available&&saving>0&&pct>0&&<span className="rounded-full bg-rose px-3 py-1.5 text-[11px] font-semibold leading-none text-white shadow">-{pct} %</span>}
                {available&&<span className="rounded-full border border-[#C6A15B] bg-white/95 px-3 py-1.5 text-[10px] uppercase leading-none tracking-[0.16em] text-[#8a6a22] shadow-sm">Offre exclusive</span>}
                {!available&&<span className="rounded-full bg-white px-3 py-1.5 text-[10px] uppercase leading-none tracking-[0.16em] text-ink shadow-sm">Indisponible</span>}
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              {o.tag&&TAGS[o.tag]&&<p className="text-[10px] uppercase tracking-[0.25em]" style={{color:GOLD}}>{TAGS[o.tag]}</p>}
              <h3 className="mt-1 font-serif text-2xl leading-snug text-plum">{o.title}</h3>
              {o.description&&<p className="mt-1 line-clamp-2 text-sm text-ink/70">{o.description}</p>}

              <ul className="mt-4 space-y-2 text-sm">{its.map((it:any)=><li key={it.id}>
                <Link href={`/produit/${it.products.slug}`} className="flex items-center gap-3">
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-sand ring-1 ring-[#f0dce4]">{it.products.images?.[0]&&<img src={it.products.images[0]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover"/>}</span>
                  <span className="min-w-0 flex-1 truncate">{it.qty>1?`${it.qty} × `:''}{it.products.name}{it.variant?<span className="text-ink/60"> ({it.variant})</span>:null}</span>
                  <span className="shrink-0 text-xs text-ink/50">{eur(unitPrice(it)*it.qty)}</span>
                </Link></li>)}</ul>

              <div className="mt-5 rounded-2xl bg-[#fdf3f7] p-4">
                <div className="flex items-end justify-between gap-3">
                  <div><p className="text-[10px] uppercase tracking-[0.2em] text-plum/60">Prix du pack</p><p className="font-serif text-4xl leading-none text-rose">{eur(price)}</p></div>
                  {saving>0&&<div className="text-right"><p className="text-[10px] uppercase tracking-[0.2em] text-plum/60">Au lieu de</p><s className="text-lg text-ink/45">{eur(value)}</s></div>}
                </div>
                {saving>0&&<p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#C6A15B]/70 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#8a6a22]"><span className="h-1.5 w-1.5 rotate-45 bg-[#C6A15B]"/>Économisez {eur(saving)}{pct>0?` · -${pct} %`:''}</p>}
              </div>
              <p className="mt-3 text-xs text-ink/60">{o.ends_at?`Offre valable jusqu’au ${new Date(o.ends_at).toLocaleDateString('fr-FR')}`:'Offre à durée limitée'}{rest!=null&&rest>0&&rest<=10?` · Plus que ${rest} disponible${rest>1?'s':''}`:''}</p>

              <div className="mt-auto pt-2">{available
                ?<OfferBuy o={{id:o.id,title:o.title,price,image:photo,max:rest}}/>
                :<p className="mt-4 rounded-full border border-sand py-4 text-center text-xs uppercase tracking-[0.2em] text-ink/50">Momentanément indisponible</p>}</div>
            </div>
          </article>})}
      </div>
    </section>}

    {/* Offres spéciales (2+1, 3+1…) */}
    {free.length>0&&<section id="offres-speciales" className="mt-16 scroll-mt-24">
      <div className="text-center"><p className="text-[11px] uppercase tracking-[0.35em]" style={{color:GOLD}}>À ne pas manquer</p><h2 className="mt-2 font-serif text-3xl text-plum md:text-4xl">Nos offres spéciales</h2><Divider/></div>
      {free.map((o:any)=>{
        const its:any[]=(o.offer_items||[]).filter((it:any)=>it.products&&it.products.active);
        const rest=o.stock!=null?o.stock-o.sold:null;
        return <div key={o.id} className="mt-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#fbeff3] via-white to-[#f6efe6] p-6 text-center ring-1 ring-[#C6A15B]/40 md:p-8">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#C6A15B] bg-white font-serif text-3xl text-[#8a6a22] shadow-sm">{o.buy_qty}+1</span>
            <h3 className="mt-4 font-serif text-3xl text-plum">{o.title}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink/80">{o.buy_qty} achetés = 1 offert : pour {o.buy_qty+1} produits de cette sélection dans votre panier, le moins cher est offert. La remise s’applique automatiquement.</p>
            {o.description&&<p className="mx-auto mt-1 max-w-xl text-sm text-ink/70">{o.description}</p>}
            <p className="mt-3 inline-block rounded-full border border-[#C6A15B]/60 bg-white px-4 py-1.5 text-xs text-[#8a6a22]">{o.ends_at?`Valable jusqu’au ${new Date(o.ends_at).toLocaleDateString('fr-FR')}`:'Offre à durée limitée'}{rest!=null&&rest<=10?` · Plus que ${rest} produit${rest>1?'s':''} offert${rest>1?'s':''}`:''}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">{its.map((it:any)=><ProductCard key={it.id} p={it.products}/>)}</div>
        </div>})}
    </section>}
  </>;
}
