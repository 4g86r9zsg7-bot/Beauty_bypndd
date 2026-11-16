import {notFound} from 'next/navigation';import {supabase} from '@/lib/supabase';import ProductBuy from '@/components/ProductBuy';import Suggestions from '@/components/Suggestions';import TrustBlock from '@/components/TrustBlock';import Reviews from '@/components/Reviews';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:{slug:string}}){
const {data}=await supabase.from('products').select('name,description,images,price,brands(name)').eq('slug',params.slug).eq('active',true).single();
if(!data)return {title:'Produit | Beauty_bypndd'};
const d:any=data;const brand=Array.isArray(d.brands)?d.brands[0]?.name:d.brands?.name;
const title=`${d.name}${brand&&!String(d.name).toLowerCase().includes(String(brand).toLowerCase())?` – ${brand}`:''} | Beauty_bypndd`;
const clean=(d.description||'').replace(/\s+/g,' ').trim();
const description=clean?clean.slice(0,155):`${d.name}${brand?` ${brand}`:''} à ${d.price} DH chez Beauty_bypndd. Produit authentique, livraison à domicile et paiement à la livraison.`;
const img:string|undefined=d.images?.[0];
return {title,description,alternates:{canonical:`/produit/${params.slug}`},openGraph:{title,description,url:`/produit/${params.slug}`,siteName:'Beauty_bypndd',locale:'fr_FR',type:'website',images:img?[{url:img,alt:d.name}]:undefined},twitter:{card:img?'summary_large_image':'summary',title,description,images:img?[img]:undefined}}}
export default async function P({params}:{params:{slug:string}}){
const {data:p}=await supabase.from('products').select('*,brands(name)').eq('slug',params.slug).eq('active',true).single();if(!p)notFound();
const {data:rv}=await supabase.from('reviews').select('rating,comment,customer_name,created_at').eq('product_id',p.id).eq('published',true).order('created_at',{ascending:false});const rl=rv||[];const avg=rl.length?rl.reduce((s:number,x:any)=>s+x.rating,0)/rl.length:0;
const ld:any={'@context':'https://schema.org','@type':'Product',name:p.name,description:p.description||undefined,image:p.images||[],brand:p.brands?.name?{'@type':'Brand',name:p.brands.name}:undefined,offers:{'@type':'Offer',priceCurrency:'MAD',price:p.price,availability:p.availability==='soldout'?'https://schema.org/OutOfStock':(p.availability==='preorder'||p.availability==='arrival')?'https://schema.org/PreOrder':'https://schema.org/InStock',url:`https://beautybypnd.com/produit/${p.slug}`}};
if(rl.length)ld.aggregateRating={'@type':'AggregateRating',ratingValue:Number(avg.toFixed(1)),reviewCount:rl.length};
return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/><ProductBuy p={{...p,rating_avg:avg,rating_count:rl.length}}/><TrustBlock p={p}/><Reviews list={rl} avg={avg}/><Suggestions title="Produits similaires" categoryId={p.category_id} brandId={p.brand_id} exclude={[p.id]} limit={4}/></>}
