import type {MetadataRoute} from 'next';
import {supabase} from '@/lib/supabase';

export const revalidate=3600;

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base='https://beautybypnd.com';
  const [{data:categories},{data:products}]=await Promise.all([
    supabase.from('categories').select('slug'),
    supabase.from('products').select('slug,created_at').eq('active',true)
  ]);

  const fixedPaths=[
    '',
    '/livraison',
    '/contact',
    '/categorie/nouveautes',
    '/categorie/promotions',
    '/categorie/arrivages',
    '/categorie/tous',
    '/categorie/coups-de-coeur',
    '/categorie/meilleures-ventes',
    '/categorie/precommandes',
    '/offres',
    '/precommande-shein'
  ];

  const fixed=fixedPaths.map(path=>({
    url:base+path,
    changeFrequency:'weekly' as const,
    priority:path===''?1:0.6
  }));

  const categoryEntries=(categories||[])
    .filter((category:any)=>category.slug&&category.slug!=='sacs-accessoires')
    .map((category:any)=>({
      url:`${base}/categorie/${category.slug}`,
      changeFrequency:'weekly' as const,
      priority:0.7
    }));

  const productEntries=(products||[])
    .filter((product:any)=>product.slug)
    .map((product:any)=>({
      url:`${base}/produit/${product.slug}`,
      ...(product.created_at?{lastModified:product.created_at}:{}),
      changeFrequency:'weekly' as const,
      priority:0.8
    }));

  const unique=new Map<string,MetadataRoute.Sitemap[number]>();
  for(const entry of [...fixed,...categoryEntries,...productEntries]){
    unique.set(entry.url,entry);
  }

  return [...unique.values()];
}
