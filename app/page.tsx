

import Link from 'next/link';
import {supabase,eur} from '@/lib/supabase';
import Shortcuts from '@/components/Shortcuts';
import Hero from '@/components/Hero';
import HomeShelves from '@/components/HomeShelves';
import Suggestions from '@/components/Suggestions';
import PersonalizedPromo from '@/components/PersonalizedPromo';

export const revalidate=30;

export const metadata={
  title:'BeautyByPND | Le luxe à petit prix',
  description:'Découvrez BeautyByPND : maquillage, soins, parfums et mode avec de grandes marques à prix accessibles. Livraison partout au Maroc et paiement à la livraison.',
  openGraph:{
    title:'BeautyByPND | Le luxe à petit prix',
    description:'Beauté, soins, parfums et mode : grandes marques authentiques à prix accessibles.',
    url:'/',
    siteName:'BeautyByPND',
    locale:'fr_FR',
    type:'website'
  },
  alternates:{canonical:'/'},
  twitter:{
    card:'summary_large_image',
    title:'BeautyByPND | Le luxe à petit prix',
    description:'Maquillage, soins, parfums et mode avec livraison partout au Maroc.'
  }
};

const uniq=(a:any[]|null)=>{
  const s=new Set<string>();
  return (a||[]).filter(x=>{
    const k=x.name.trim().toLowerCase();
    if(s.has(k))return false;
    s.add(k);
    return true;
  });
};

export default async function Home(){

  const [{data:c},{data:b},{data:promoData},{data:promoProducts}]=await Promise.all([
    supabase.from('categories')
      .select('*')
      .order('position',{nullsFirst:false})
      .order('name'),
    supabase.from('brands')
      .select('*')
      .order('name'),
    supabase.from('promo_codes')
      .select('*')
      .eq('active',true)
      .order('created_at',{ascending:false}),
    supabase.from('products').select('id,name')
  ]);

  const cats=uniq(c);
  const brands=uniq(b);
  const top=cats.filter((x:any)=>!x.parent_id&&x.slug!=='sacs-accessoires');

  const now=new Date();
  const promoProductRows=promoProducts||[];
  const promoTargetLabel=(p:any)=>{
    if(p.target_type==='category')return 'Catégorie · '+(cats.find((x:any)=>x.id===p.target_id)?.name||'Catégorie');
    if(p.target_type==='brand')return 'Marque · '+(brands.find((x:any)=>x.id===p.target_id)?.name||'Marque');
    if(p.target_type==='product'||p.target_type==='variant'){
      const product=promoProductRows.find((x:any)=>x.id===p.target_id);
      return (p.target_type==='variant'?'Variante · ':'Produit · ')+(product?.name||'Produit')+(p.target_type==='variant'&&p.target_variant?' · '+p.target_variant:'');
    }
    return 'Valable sur tout le catalogue';
  };

  const promoCodes=(promoData||[]).filter((p:any)=>{
    const starts=p.starts_at?new Date(p.starts_at):null;
    const ends=p.expires_at?new Date(p.expires_at):null;
    const max=p.max_uses==null?null:Number(p.max_uses);
    const uses=Number(p.uses||0);
    const value=p.kind==='percent'?Number(p.percent):Number(p.amount);

    return (!starts||starts<=now)
      &&(!ends||ends>now)
      &&(max===null||uses<max)
      &&value>0;
  });

  const nowIso=now.toISOString();

  const {count:offerCount}=await supabase
    .from('offers')
    .select('id',{count:'exact',head:true})
    .eq('active',true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`);

  const coffretsId=
    cats.find((x:any)=>x.slug==='coffrets-cadeaux')?.id
    ??'00000000-0000-0000-0000-000000000000';

  // Vitrines classées par priorité : nouveautés, bonnes affaires et disponibilité immédiate d'abord.
  const defs:{tone:string;title:string;href:string;f:(q:any)=>any}[]=[
    {
      tone:'ventes',
      title:'Meilleures ventes',
      href:'/categorie/meilleures-ventes',
      f:q=>q.eq('is_bestseller',true).in('availability',['available','last']).gt('stock',0)
    },
    {
      tone:'nouveautes',
      title:'Nouveautés',
      href:'/categorie/nouveautes',
      f:q=>q.eq('is_new',true).not('availability','in','(arrival,preorder)')
    },
    {
      tone:'promo',
      title:'Promotions et bonnes affaires',
      href:'/categorie/promotions',
      f:q=>q.not('old_price','is',null).not('availability','in','(arrival,preorder)')
    },
    {
      tone:'immediat',
      title:'Disponibles immédiatement',
      href:'/categorie/tous',
      f:q=>q.in('availability',['available','last']).gt('stock',0)
    },
    {
      tone:'coeur',
      title:'Coups de cœur',
      href:'/categorie/coups-de-coeur',
      f:q=>q.eq('featured',true)
    },
    {
      tone:'precommandes',
      title:'Précommandes',
      href:'/categorie/precommandes',
      f:q=>q.eq('availability','preorder')
    },
    {
      tone:'arrivages',
      title:'Prochains arrivages',
      href:'/categorie/arrivages',
      f:q=>q.eq('availability','arrival')
    },
    {
      tone:'cadeaux',
      title:'Coffrets cadeaux',
      href:'/categorie/coffrets-cadeaux',
      f:q=>q.eq('category_id',coffretsId).not('availability','in','(arrival,preorder)')
    }
  ];

  const fetched=await Promise.all(
    defs.map(d=>
      d.f(
        supabase.from('products')
          .select('id,name,slug,price,old_price,images,variants,availability,stock,is_bestseller,is_new,source_name,commercial_range,created_at,brands(name)')
          .eq('active',true)
          .order('created_at',{ascending:false})
          .limit(40)
      )
    )
  );

  const groups=defs.map((d,i)=>({
    tone:d.tone,
    title:d.title,
    href:d.href,
    items:(((fetched[i] as any).data)||[])
      .filter((p:any)=>p.availability!=='soldout')
  }));

  // Réserve de produits plus anciens pour compléter la découverte sans doublons.
  const {data:olderData}=await supabase.from('products')
    .select('id,name,slug,price,old_price,images,variants,availability,stock,is_bestseller,is_new,source_name,commercial_range,created_at,brands(name)')
    .eq('active',true)
    .order('created_at',{ascending:true})
    .limit(40);
  const olderItems=(olderData||[])
    .filter((p:any)=>p.availability!=='soldout');

  return (
    <>
      <Shortcuts/>
      <Hero/>

      {/* PRODUITS À DÉCOUVRIR : placés tôt pour faciliter le premier achat */}
      <HomeShelves groups={groups} olderItems={olderItems}/>

      <main className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-10">

        {/* OFFRES ET PRECOMMANDES */}
        <div className="mt-7 grid gap-4 md:grid-cols-2">

          {(offerCount||0)>0&&(
            <Link
              href="/offres"
              className="group relative flex min-h-[150px] items-center justify-between overflow-hidden rounded-2xl border border-[#C6A15B]/50 bg-gradient-to-br from-[#fff8fa] via-white to-[#f8e8ee] p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative z-10 max-w-[85%]">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#98783b]">
                  Offres exclusives
                </span>
                <span className="mt-2 block font-serif text-2xl text-plum sm:text-3xl">
                  Packs &amp; Offres exclusives
                </span>
                <span className="mt-2 block text-xs leading-relaxed text-ink/70">
                  Des sélections à prix avantageux, pour une durée limitée
                </span>
                <span className="mt-4 inline-block border-b border-[#C6A15B] pb-1 text-[10px] uppercase tracking-[0.18em] text-plum">
                  Découvrir les offres
                </span>
              </div>
              <span className="absolute -right-5 -bottom-8 font-serif text-8xl text-[#C6A15B]/15 transition duration-500 group-hover:scale-110">
                ✧
              </span>
              <span className="relative z-10 text-3xl text-[#C6A15B] transition group-hover:translate-x-1">
                →
              </span>
            </Link>
          )}

          <Link
            href="/precommande-shein"
            className="group relative flex min-h-[150px] items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#14040c] via-[#351126] to-[#501b37] p-6 text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative z-10 max-w-[85%]">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#EE6FB0]">
                SHEIN
              </span>
              <span className="mt-2 block font-serif text-2xl italic sm:text-3xl">
                Précommande SHEIN
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-white/75">
                Collez votre panier, obtenez votre prix final en dirhams
              </span>
              <span className="mt-4 inline-block border-b border-[#EE6FB0] pb-1 text-[10px] uppercase tracking-[0.18em] text-white">
                Commander maintenant
              </span>
            </div>
            <span className="absolute -right-5 -bottom-8 font-serif text-8xl text-[#EE6FB0]/15 transition duration-500 group-hover:scale-110">
              ✧
            </span>
            <span className="relative z-10 text-3xl text-[#EE6FB0] transition group-hover:translate-x-1">
              →
            </span>
          </Link>

        </div>

        <PersonalizedPromo codes={promoCodes.map((p:any)=>({...p,target_label:promoTargetLabel(p)}))}/>

        {/* CATEGORIES */}
        <section className="mt-16 rounded-3xl bg-[#FCF8F8] px-3 py-10 sm:px-6 md:py-12">

          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-rose">
              Inspiration élégante
            </p>
            <h2 className="mt-3 font-serif text-3xl text-plum md:text-4xl">
              Achetez par catégorie
            </h2>
            <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-ink/60">
              Découvrez notre sélection beauté, mode et accessoires.
            </p>
            <div className="mx-auto mt-4 h-px w-16 bg-[#C6A15B]"/>
          </div>

          <div className="mt-9 -mx-3 flex gap-4 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(112px,1fr))] lg:gap-5 lg:overflow-visible lg:px-0">

            {top.map((x:any)=>(
              <Link
                key={x.id}
                href={`/categorie/${x.slug}`}
                className="group w-[108px] shrink-0 md:w-[118px] lg:w-auto"
              >
                <span className="relative mx-auto block h-[92px] w-[92px] overflow-hidden rounded-full bg-gradient-to-br from-[#f4e6eb] to-white ring-1 ring-[#ead8df] shadow-sm transition duration-500 group-hover:scale-105 group-hover:ring-[#C6A15B] group-hover:shadow-md md:h-[108px] md:w-[108px]">

                  <span className="absolute inset-0 flex items-center justify-center font-serif text-4xl text-plum/40">
                    {x.name.charAt(0)}
                  </span>

                  <img
                    src={x.image_url||`/categories/${x.slug}.jpg`}
                    alt={x.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </span>

                <span className="mt-3 block text-center text-xs font-medium leading-tight text-ink transition group-hover:text-plum">
                  {x.name}
                </span>
              </Link>
            ))}

          </div>
        </section>

      </main>

      {/* MARQUES */}
      {brands.length>0&&(
        <section className="relative left-1/2 mt-16 w-screen -translate-x-1/2 overflow-hidden border-y border-[#f0e4e8] bg-gradient-to-b from-white to-[#FCF8F8] py-14 text-center">

          <div className="mx-auto max-w-6xl px-4">

            <p className="text-[10px] uppercase tracking-[0.35em] text-rose">
              Nos partenaires
            </p>

            <h2 className="mt-3 font-serif text-3xl text-plum md:text-4xl">
              Marques populaires
            </h2>

            <p className="mt-3 text-xs text-ink/60">
              Retrouvez vos marques préférées au même endroit.
            </p>

            <div className="mx-auto mt-4 h-px w-16 bg-[#C6A15B]"/>

            <div className="mt-9 -mx-4 flex items-center gap-6 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-wrap md:justify-center md:gap-x-12 md:gap-y-7 md:overflow-visible md:px-0">

              {brands.map((x:any)=>(
                <Link
                  key={x.id}
                  href={`/categorie/tous?brand=${x.id}`}
                  aria-label={x.name}
                  className="flex h-16 w-[132px] shrink-0 items-center justify-center rounded-xl bg-white px-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md md:w-[148px]"
                >
                  {x.logo_url?(
                    <img
                      src={x.logo_url}
                      alt={x.name}
                      loading="lazy"
                      decoding="async"
                      className="max-h-10 max-w-full object-contain mix-blend-multiply"
                    />
                  ):(
                    <span className="text-center font-serif text-[15px] uppercase leading-tight tracking-[0.12em] text-black">
                      {x.name}
                    </span>
                  )}
                </Link>
              ))}

            </div>

            <Link
              href="/categorie/tous"
              className="mt-9 inline-flex items-center gap-3 rounded-full border border-plum px-7 py-3 text-[10px] uppercase tracking-[0.18em] text-plum transition hover:bg-plum hover:text-white"
            >
              Voir toutes les marques
              <span>→</span>
            </Link>

          </div>
        </section>
      )}

      {/* SUGGESTIONS */}
      <div className="mx-auto mt-10 max-w-[1500px] px-4 pb-10 sm:px-6 lg:px-10">
        <Suggestions title="Vous aimerez aussi" exclude={[]} limit={4}/>
      </div>

    </>
  );
}
