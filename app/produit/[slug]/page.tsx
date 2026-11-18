
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {supabase} from '@/lib/supabase';
import ProductBuy from '@/components/ProductBuy';
import Suggestions from '@/components/Suggestions';
import TrustBlock from '@/components/TrustBlock';
import Reviews from '@/components/Reviews';

export const dynamic='force-dynamic';

const SITE='https://beautybypnd.com';

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
      price:Number(p.price),
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
      <ProductBuy p={{...p,rating_avg:avg,rating_count:rl.length}}/>
      <TrustBlock p={p}/>
      <Reviews list={rl} avg={avg}/>
      <Suggestions
        title="Produits similaires"
        categoryId={p.category_id}
        brandId={p.brand_id}
        exclude={[p.id]}
        limit={4}
      />
    </>
  );
}
