'use client';

import {useState} from 'react';
import {supabase} from '@/lib/supabase';
import {prepareProductImage} from '@/lib/prepareProductImage';

type Candidate = {
  url:string;
  fileName:string;
  products:string[];
  originalSize:number;
  blob:Blob;
  extension:string;
  contentType:string;
  newSize:number;
};

const TARGET_FILES = new Set([
  'IMG_9556.jpeg',
  'IMG_9555.jpeg',
  'IMG_8913.png',
  'IMG_8876.png',
  'IMG_9094.png',
  'IMG_8766.jpeg',
  'IMG_8765.jpeg',
  'IMG_8762.jpeg'
]);

const bytes=(n:number)=>n>=1024*1024
  ?`${(n/1024/1024).toFixed(2)} Mo`
  :`${Math.round(n/1024)} Ko`;

const getFileName=(url:string)=>{
  try{return decodeURIComponent(new URL(url).pathname.split('/').pop()||'');}
  catch{return '';}
};

const isTargetFile=(url:string)=>{
  const fileName=getFileName(url).toLowerCase();
  return [...TARGET_FILES].some(target=>fileName.endsWith(target.toLowerCase()));
};

function replaceUrl(value:any,replacements:Map<string,string>):any{
  if(typeof value==='string')return replacements.get(value)||value;
  if(Array.isArray(value))return value.map(item=>replaceUrl(item,replacements));
  if(value&&typeof value==='object'){
    return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,replaceUrl(item,replacements)]));
  }
  return value;
}

export default function OptimizeProductImages(){
  const [busy,setBusy]=useState(false);
  const [candidates,setCandidates]=useState<Candidate[]>([]);
  const [message,setMessage]=useState('');
  const [phase,setPhase]=useState<'idle'|'preview'|'done'>('idle');

  const prepare=async()=>{
    if(busy)return;
    setBusy(true);
    setMessage('Recherche des anciennes photos concernées…');
    setCandidates([]);
    setPhase('idle');

    try{
      const {data:products,error}=await supabase
        .from('products')
        .select('id,name,images,variants');

      if(error)throw error;

      const refs=new Map<string,Set<string>>();
      for(const product of products||[]){
        const visit=(value:any)=>{
          if(typeof value==='string'&&isTargetFile(value)){
            if(!refs.has(value))refs.set(value,new Set());
            refs.get(value)!.add(String(product.name||'Produit sans nom'));
          }else if(Array.isArray(value)){
            value.forEach(visit);
          }else if(value&&typeof value==='object'){
            Object.values(value).forEach(visit);
          }
        };
        visit(product.images);
        visit(product.variants);
      }

      if(!refs.size){
        setMessage('Aucune des anciennes photos ciblées n’a été retrouvée dans les fiches produits. Aucune modification effectuée.');
        setPhase('preview');
        return;
      }

      const prepared:Candidate[]=[];
      const failures:string[]=[];

      for(const [url,names] of refs){
        try{
          const response=await fetch(url,{mode:'cors',cache:'no-store'});
          if(!response.ok)throw new Error(`Téléchargement impossible (${response.status})`);
          const original=await response.blob();
          const fileName=getFileName(url)||'photo.jpg';
          const file=new File([original],fileName,{type:original.type||'image/jpeg'});
          const optimized=await prepareProductImage(file);

          if(optimized.blob.size>=original.size){
            failures.push(`${fileName} : déjà optimisée ou aucune réduction possible`);
            continue;
          }

          prepared.push({
            url,
            fileName,
            products:[...names],
            originalSize:original.size,
            blob:optimized.blob,
            extension:optimized.extension,
            contentType:optimized.contentType,
            newSize:optimized.blob.size
          });
        }catch(error:any){
          failures.push(`${getFileName(url)} : ${error?.message||'erreur de lecture'}`);
        }
      }

      setCandidates(prepared);
      setPhase('preview');
      const saved=prepared.reduce((sum,item)=>sum+item.originalSize-item.newSize,0);
      setMessage(
        prepared.length
          ?`Aperçu prêt : ${prepared.length} photo(s) peuvent être allégées. Économie estimée : ${bytes(saved)} sur ces fichiers. Les originaux seront conservés.${failures.length?` ${failures.length} photo(s) ignorée(s).`:''}`
          :`Aucune photo n’a pu être allégée.${failures.length?' '+failures.join(' · '):''}`
      );
    }catch(error:any){
      setMessage(error?.message||'Impossible d’analyser les photos.');
    }finally{
      setBusy(false);
    }
  };

  const apply=async()=>{
    if(busy||!candidates.length)return;
    if(!window.confirm('Confirmer l’optimisation ? Les nouvelles images seront ajoutées et les fiches produits pointeront vers elles. Les photos originales ne seront pas supprimées.')){
      return;
    }

    setBusy(true);
    setMessage('Enregistrement des nouvelles photos…');

    try{
      const replacements=new Map<string,string>();
      let uploaded=0;

      for(const item of candidates){
        const safeName=item.fileName.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,50)||'photo';
        const path=`products/optimized-${Date.now()}-${Math.random().toString(36).slice(2,9)}-${safeName}.${item.extension}`;
        const {error}=await supabase.storage.from('product-images').upload(path,item.blob,{
          contentType:item.contentType,
          cacheControl:'31536000',
          upsert:false
        });
        if(error)throw new Error(`Échec de l’enregistrement de ${item.fileName} : ${error.message}`);
        const {data}=supabase.storage.from('product-images').getPublicUrl(path);
        const check=await fetch(data.publicUrl,{method:'HEAD',cache:'no-store'});
        if(!check.ok)throw new Error(`La nouvelle photo ${item.fileName} n’a pas pu être vérifiée.`);
        replacements.set(item.url,data.publicUrl);
        uploaded++;
      }

      const {data:products,error}=await supabase
        .from('products')
        .select('id,name,images,variants');
      if(error)throw error;

      let updated=0;
      for(const product of products||[]){
        const nextImages=replaceUrl(product.images,replacements);
        const nextVariants=replaceUrl(product.variants,replacements);
        if(
          JSON.stringify(nextImages)===JSON.stringify(product.images)&&
          JSON.stringify(nextVariants)===JSON.stringify(product.variants)
        )continue;

        const {error:updateError}=await supabase
          .from('products')
          .update({images:nextImages,variants:nextVariants})
          .eq('id',product.id);
        if(updateError)throw new Error(`Photos enregistrées, mais mise à jour de « ${product.name} » impossible : ${updateError.message}. Les originaux restent en place.`);
        updated++;
      }

      setPhase('done');
      setCandidates([]);
      setMessage(`Terminé : ${uploaded} nouvelle(s) photo(s) vérifiée(s), ${updated} fiche(s) produit mise(s) à jour. Les originaux sont toujours conservés. La bannière n’a pas été touchée.`);
    }catch(error:any){
      setMessage(error?.message||'Une erreur est survenue. Les photos originales n’ont pas été supprimées.');
    }finally{
      setBusy(false);
    }
  };

  const totalBefore=candidates.reduce((sum,item)=>sum+item.originalSize,0);
  const totalAfter=candidates.reduce((sum,item)=>sum+item.newSize,0);
  const reduction=totalBefore>0?Math.round((1-totalAfter/totalBefore)*100):0;

  return (
    <section className="rounded-2xl border border-plum/20 bg-blush/20 p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-plum">Alléger les anciennes photos produits</h3>
        <p className="mt-1 text-sm text-ink/70">
          Analyse uniquement les anciennes photos identifiées dans les journaux. La bannière et les autres images ne sont pas concernées.
        </p>
      </div>

      {message&&<p className="text-sm" aria-live="polite">{message}</p>}

      {phase==='preview'&&candidates.length>0&&(
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-white p-2"><b>{bytes(totalBefore)}</b><br/>Avant</div>
            <div className="rounded-xl bg-white p-2"><b>{bytes(totalAfter)}</b><br/>Après</div>
            <div className="rounded-xl bg-white p-2"><b>{reduction}%</b><br/>Réduction</div>
          </div>
          <div className="max-h-56 space-y-2 overflow-auto">
            {candidates.map(item=>(
              <div key={item.url} className="rounded-lg bg-white p-2 text-xs">
                <b>{item.fileName}</b>
                <p>{item.products.join(', ')}</p>
                <p className="text-ink/65">{bytes(item.originalSize)} → {bytes(item.newSize)}</p>
              </div>
            ))}
          </div>
          <button type="button" disabled={busy} onClick={apply} className="w-full rounded-full bg-plum px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
            Confirmer et optimiser ces photos
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={prepare} className="rounded-full border border-plum px-4 py-2 text-sm text-plum disabled:opacity-50">
          {busy?'Traitement…':phase==='preview'?'Recalculer l’aperçu':'Analyser les anciennes photos'}
        </button>
        {phase==='preview'&&candidates.length>0&&(
          <button type="button" disabled={busy} onClick={()=>{setCandidates([]);setPhase('idle');setMessage('Aperçu annulé. Aucune photo n’a été modifiée.');}} className="rounded-full border border-sand px-4 py-2 text-sm">
            Annuler
          </button>
        )}
      </div>
    </section>
  );
}
