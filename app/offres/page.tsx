import Link from 'next/link';
import {supabase,eur} from '@/lib/supabase';
import OfferBuy from '@/components/OfferBuy';
import ProductCard from '@/components/ProductCard';

export const dynamic='force-dynamic';

const title='Packs & Offres exclusives | Beauty_bypndd';
const description='Packs beauté à prix avantageux, routines visage, cheveux et maquillage, coffrets et offres exclusives chez Beauty_bypndd.';
export const metadata={title,description,alternates:{canonical:'/offres'},openGraph:{title,description,url:'/offres',siteName:'Beauty_bypndd',locale:'fr_FR',type:'website'}};

const TAGS:Record<string,string>={visage:'Routine visage',cheveux:'Routine cheveux',maquillage:'Routine maquillage',coffret:'Coffret',special:'Offre spéciale'};

// Seules les variantes « objet » (avec stock et prix) sont gérées côté base.
const vlist=(p:any):any[]=>(Array.isArray(p?.variants)?p.variants:[]).filter((x:any)=>x&&typeof x==='object');
const unitPrice=(it:any)=>Number(vlist(it.products).find((x:any)=>x.name===it.variant)?.price??it.products?.price??0);
const itemOk=(it:any)=>{
  const p=it.products;
  if(!p||!p.active||['soldout','arrival','preorder'].includes(p.availability))return false;
  if(vlist(p).length){const v=vlist(p).find((x:any)=>x.name===it.variant);return !!v&&Number(v.stock??0)>=it.qty}
  return Number(p.stock)>=it.qty;
};

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
  const free=offers.filter((o:any)=>o.kind==='buy_x_get_1');

  return <>
    <h1 className="font-serif text-4xl text-plum md:text-5xl">Packs &amp; Offres exclusives</h1>
    <p className="mt-2 max-w-2xl text-ink/70">Des sélections de produits à prix avantageux et des offres à durée limitée.</p>

    {!offers.length&&<div className="mx-auto max-w-md py-14 text-center"><p className="font-serif text-2xl text-plum">Aucune offre pour le moment</p><p className="mt-2 text-sm text-ink/60">Revenez bientôt : de nouvelles offres arrivent régulièrement.</p><Link href="/categorie/nouveautes" className="mt-5 inline-block rounded-full border border-plum px-6 py-3 text-xs uppercase tracking-[0.18em] text-plum">Voir les nouveautés</Link></div>}

    {packs.length>0&&<section className="mt-8"><div className="grid gap-5 md:grid-cols-2">
      {packs.map((o:any)=>{
        const its:any[]=o.offer_items||[];
        const value=its.reduce((s:number,it:any)=>s+unitPrice(it)*it.qty,0);
        const price=Number(o.pack_price);
        const saving=value-price;const pct=value>0?Math.round(saving/value*100):0;
        const rest=o.stock!=null?o.stock-o.sold:null;
        const available=its.length>0&&its.every(itemOk)&&(rest==null||rest>0);
        return <article key={o.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="relative aspect-[4/3] bg-sand">
            {o.image_url&&<img src={o.image_url} alt={o.title} loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full object-cover ${available?'':'opacity-60'}`}/>}
            <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
              {o.tag&&TAGS[o.tag]&&<span className="bg-white px-2.5 py-1 text-[10px] uppercase leading-none tracking-[0.14em] text-plum">{TAGS[o.tag]}</span>}
              {available&&saving>0&&<span className="bg-rose px-2.5 py-1 text-[10px] uppercase leading-none tracking-[0.14em] text-white">-{pct}%</span>}
              {!available&&<span className="bg-white px-2.5 py-1 text-[10px] uppercase leading-none tracking-[0.14em] text-ink">Indisponible</span>}
            </div>
          </div>
          <div className="p-5">
            <h2 className="font-serif text-2xl text-plum">{o.title}</h2>
            {o.description&&<p className="mt-1 text-sm text-ink/70">{o.description}</p>}
            <ul className="mt-3 space-y-1 text-sm">{its.map((it:any)=>it.products&&<li key={it.id} className="flex justify-between gap-3"><Link href={`/produit/${it.products.slug}`} className="min-w-0 truncate underline decoration-sand underline-offset-2">{it.qty>1?`${it.qty} × `:''}{it.products.name}{it.variant?` (${it.variant})`:''}</Link><span className="shrink-0 text-ink/60">{eur(unitPrice(it)*it.qty)}</span></li>)}</ul>
            <div className="mt-4 border-t border-sand pt-4">
              <p className="flex flex-wrap items-baseline gap-x-3"><span className="font-serif text-3xl text-rose">{eur(price)}</span>{saving>0&&<s className="text-sm text-ink/50">{eur(value)}</s>}</p>
              {saving>0&&<p className="mt-1 text-sm text-plum">Vous économisez {eur(saving)}</p>}
              <p className="mt-2 text-xs text-ink/60">{o.ends_at?`Offre valable jusqu’au ${new Date(o.ends_at).toLocaleDateString('fr-FR')}`:'Offre à durée limitée'}{rest!=null&&rest>0&&rest<=10?` · Plus que ${rest} disponible${rest>1?'s':''}`:''}</p>
            </div>
            {available
              ?<OfferBuy o={{id:o.id,title:o.title,price,image:o.image_url,max:rest}}/>
              :<p className="mt-4 rounded-full border border-sand py-4 text-center text-xs uppercase tracking-[0.2em] text-ink/50">Momentanément indisponible</p>}
          </div>
        </article>})}
    </div></section>}

    {free.map((o:any)=>{
      const its:any[]=(o.offer_items||[]).filter((it:any)=>it.products&&it.products.active);
      const rest=o.stock!=null?o.stock-o.sold:null;
      if(rest!=null&&rest<=0)return null;
      return <section key={o.id} className="mt-12">
        <div className="rounded-2xl bg-[#f6efe6] p-5 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-rose">Offre exclusive</p>
          <h2 className="mt-1 font-serif text-3xl text-plum">{o.title}</h2>
          <p className="mt-2 text-sm text-ink/80">{o.buy_qty} achetés = 1 offert : pour {o.buy_qty+1} produits de cette sélection dans votre panier, le moins cher est offert. La remise s’applique automatiquement.</p>
          {o.description&&<p className="mt-1 text-sm text-ink/70">{o.description}</p>}
          <p className="mt-2 text-xs text-ink/60">{o.ends_at?`Offre valable jusqu’au ${new Date(o.ends_at).toLocaleDateString('fr-FR')}`:'Offre à durée limitée'}{rest!=null&&rest<=10?` · Plus que ${rest} produit${rest>1?'s':''} offert${rest>1?'s':''}`:''}</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">{its.map((it:any)=><ProductCard key={it.id} p={it.products}/>)}</div>
      </section>})}
  </>;
}
