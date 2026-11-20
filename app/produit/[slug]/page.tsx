
import {notFound} from 'next/navigation';
import Link from 'next/link';
import type {Metadata} from 'next';
import {supabase} from '@/lib/supabase';
import ProductBuy from '@/components/ProductBuy';
import ProductOfferUpsell from '@/components/ProductOfferUpsell';
import Suggestions from '@/components/Suggestions';
import TrustBlock from '@/components/TrustBlock';
import Reviews from '@/components/Reviews';
import RecentlyViewed from '@/components/RecentlyViewed';

export const dynamic='force-dynamic';

const SITE='https://beautybypndd.com';

function getBrand(value:any){
  return Array.isArray(value)?value[0]?.name:value?.name;
}

function cleanText(value:any){
  return String(value||'').replace(/\s+/g,' ').trim();
}

function getImages(value:any):string[]{
  if(Array.isArray(value))return value.filter((x:any)=>typeof x==='string'&&x.trim());
  if(typeof value==='string'&&value.trim())return [value];
  return [];
}

export async function generateMetadata({params}:{params:{slug:string}}):Promise<Metadata>{
  const {data}=await supabase
    .from('products')
    .select('name,description,images,price,brands(name)')
    .eq('slug',params.slug)
    .eq('active',true)
    .single();

  if(!data){
    return {
      title:'Produit | Beauty_bypndd',
      robots:{index:false,follow:true}
    };
  }

  const d:any=data;
  const brand=getBrand(d.brands);
  const name=cleanText(d.name);
  const clean=cleanText(d.description);

  const title=`${name}${brand&&!name.toLowerCase().includes(String(brand).toLowerCase())?` – ${brand}`:''} | Beauty_bypndd`;

  const fallback=`Découvrez ${name}${brand?` de ${brand}`:''} chez Beauty_bypndd. Beauté, maquillage et soins au Maroc, livraison à domicile et paiement à la livraison.`;

  const description=(clean||fallback).slice(0,155);
  const images=getImages(d.images);
  const canonical=`/produit/${params.slug}`;

  return {
    title,
    description,
    keywords:[
      name,
      brand,
      'cosmétiques Maroc',
      'maquillage Maroc',
      'produits beauté',
      'Beauty_bypndd'
    ].filter(Boolean),
    alternates:{
      canonical
    },
    robots:{
      index:true,
      follow:true,
      googleBot:{
        index:true,
        follow:true,
        'max-image-preview':'large',
        'max-snippet':-1,
        'max-video-preview':-1
      }
    },
    openGraph:{
      title,
      description,
      url:canonical,
      siteName:'Beauty_bypndd',
      locale:'fr_FR',
      type:'website',
      images:images.length?images.map((url:string)=>({
        url,
        alt:name
      })):undefined
    },
    twitter:{
      card:images.length?'summary_large_image':'summary',
      title,
      description,
      images:images.length?images:undefined
    }
  };
}

export default async function P({params}:{params:{slug:string}}){
  const {data:p}=await supabase
    .from('products')
    .select('*,brands(name)')
    .eq('slug',params.slug)
    .eq('active',true)
    .single();

  if(!p)notFound();

  const {data:allCategories}=await supabase
    .from('categories')
    .select('id,name,slug,parent_id');

  const categoryMap=new Map((allCategories||[]).map((category:any)=>[category.id,category]));
  const categoryTrail:any[]=[];
  let currentCategory:any=p.category_id?categoryMap.get(p.category_id):null;
  let depth=0;

  while(currentCategory&&depth<6){
    categoryTrail.unshift(currentCategory);
    currentCategory=currentCategory.parent_id
      ?categoryMap.get(currentCategory.parent_id)
      :null;
    depth++;
  }

  const now=new Date().toISOString();

  const {data:offersData}=await supabase
    .from('offers')
    .select('*, offer_items(id,variant,qty, products(*))')
    .eq('active',true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('position',{nullsFirst:false})
    .order('created_at',{ascending:false});

  const activeOffers=offersData||[];

  const {data:rv}=await supabase
    .from('reviews')
    .select('rating,comment,customer_name,created_at')
    .eq('product_id',p.id)
    .eq('published',true)
    .order('created_at',{ascending:false});

  const rl=rv||[];
  const avg=rl.length
    ?rl.reduce((s:number,x:any)=>s+Number(x.rating||0),0)/rl.length
    :0;

  const brand=getBrand(p.brands);
  const images=getImages(p.images);
  const productUrl=`${SITE}/produit/${p.slug}`;

  const schemaVariants=Array.isArray(p.variants)?p.variants.filter((v:any)=>v&&typeof v==='object'&&['available','last'].includes(v.status||'available')&&(v.stock==null||Number(v.stock)>0)):[];
  const schemaPrices=schemaVariants.map((v:any)=>Number(v.price??p.price)).filter((n:number)=>Number.isFinite(n)&&n>0);
  const schemaPrice=schemaPrices.length?Math.min(...schemaPrices):Number(p.price);

  const availability=
    p.availability==='soldout'
      ?'https://schema.org/OutOfStock'
      :(p.availability==='preorder'||p.availability==='arrival')
        ?'https://schema.org/PreOrder'
        :'https://schema.org/InStock';

  const ld:any={
    '@context':'https://schema.org',
    '@type':'Product',
    name:cleanText(p.name),
    description:cleanText(p.description)||undefined,
    image:images.length?images:undefined,
    brand:brand?{
      '@type':'Brand',
      name:brand
    }:undefined,
    offers:{
      '@type':'Offer',
      priceCurrency:'MAD',
      price:schemaPrice,
      availability,
      url:productUrl
    }
  };

  if(rl.length){
    ld.aggregateRating={
      '@type':'AggregateRating',
      ratingValue:Number(avg.toFixed(1)),
      reviewCount:rl.length
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:JSON.stringify(ld).replace(/</g,'\\u003c')
        }}
      />

      <nav aria-label="Fil d’Ariane" className="mx-auto w-full max-w-[1500px] px-4 pt-4 text-xs text-ink/60 sm:px-6 lg:px-10">
        <Link href="/" className="transition hover:text-plum">Accueil</Link>
        {categoryTrail.map((category:any)=>(
          <span key={category.id}>
            <span aria-hidden="true" className="mx-2">/</span>
            <Link href={`/categorie/${category.slug}`} className="transition hover:text-plum">
              {category.name}
            </Link>
          </span>
        ))}
        <span aria-hidden="true" className="mx-2">/</span>
        <span className="font-medium text-plum" aria-current="page">{p.name}</span>
      </nav>

      <ProductBuy p={{...p,rating_avg:avg,rating_count:rl.length}}/>

      <ProductOfferUpsell
        productId={String(p.id)}
        offers={activeOffers}
      />

      <TrustBlock p={p}/>
      <Reviews list={rl} avg={avg}/>

      <Suggestions
        title="Produits similaires"
        categoryId={p.category_id}
        brandId={p.brand_id}
        exclude={[p.id]}
        limit={4}
      />

      <RecentlyViewed product={p}/>
    </>
  );
}
