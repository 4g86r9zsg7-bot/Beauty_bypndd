import type {MetadataRoute} from 'next';import {supabase} from '@/lib/supabase';
export const revalidate=3600;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base='https://beautybypnd.com';
const [{data:c},{data:p}]=await Promise.all([supabase.from('categories').select('slug'),supabase.from('products').select('slug,created_at').eq('active',true)]);
const fixed=['','/livraison','/contact','/categorie/nouveautes','/categorie/promotions','/categorie/arrivages','/categorie/tous'].map(u=>({url:base+u,changeFrequency:'weekly' as const,priority:u===''?1:0.6}));
return [...fixed,...(c||[]).map((x:any)=>({url:`${base}/categorie/${x.slug}`,changeFrequency:'weekly' as const,priority:0.7})),...(p||[]).map((x:any)=>({url:`${base}/produit/${x.slug}`,lastModified:x.created_at,changeFrequency:'weekly' as const,priority:0.8}))]}
