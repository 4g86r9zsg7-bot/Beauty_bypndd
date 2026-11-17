'use client';import {useEffect,useState} from 'react';import {supabase} from '@/lib/supabase';
export default function Banniere(){
const [url,setUrl]=useState('');const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);
useEffect(()=>{supabase.from('site_settings').select('value').eq('key','hero_image').maybeSingle().then(({data})=>setUrl(data?.value||''))},[]);
// Réduit l'image à 2000 px de large maximum, en JPG léger (sans recadrage)
async function prep(f:File):Promise<Blob>{const bm=await createImageBitmap(f);const r=Math.min(1,2000/bm.width);const W=Math.round(bm.width*r),H=Math.round(bm.height*r);const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');if(!g)throw new Error('Navigateur non compatible');g.drawImage(bm,0,0,W,H);return await new Promise<Blob>((ok,ko)=>cv.toBlob(b=>b?ok(b):ko(new Error('Conversion impossible')),'image/jpeg',0.88))}
async function up(f?:File){if(!f)return;if(!f.type.startsWith('image/')){setMsg('Choisissez une image (JPG, PNG ou WebP).');return}if(f.size>20*1024*1024){setMsg('Image trop lourde (20 Mo maximum).');return}setBusy(true);setMsg('Envoi de l’image…');
try{const blob=await prep(f);const path=`site/hero-${Date.now()}.jpg`;const {error:e1}=await supabase.storage.from('product-images').upload(path,blob,{contentType:'image/jpeg',cacheControl:'31536000'});if(e1){setMsg('Envoi impossible (êtes-vous connectée sur /admin ?) : '+e1.message);setBusy(false);return}
const {data}=supabase.storage.from('product-images').getPublicUrl(path);const {error:e2}=await supabase.from('site_settings').upsert({key:'hero_image',value:data.publicUrl},{onConflict:'key'});
if(e2)setMsg('Image envoyée mais non enregistrée : '+e2.message);else{setUrl(data.publicUrl);setMsg('Image de la bannière enregistrée. Elle s’affiche sur l’accueil dans quelques secondes.')}}
catch(e:any){setMsg('Image illisible : '+(e?.message||'format non pris en charge')+'. Essayez un JPG ou un PNG.')}setBusy(false)}
async function reset(){if(!confirm('Revenir à l’image par défaut (hero-beaute.jpg) ?'))return;const {error}=await supabase.from('site_settings').delete().eq('key','hero_image');if(error)setMsg(error.message);else{setUrl('');setMsg('Image par défaut rétablie')}}
return <div className="mx-auto max-w-lg space-y-4"><h1 className="font-serif text-3xl">Image de la bannière</h1>
<p className="text-xs">Connectez-vous d’abord sur <a href="/admin" className="underline">/admin</a>, puis revenez ici. Utilisez une image horizontale (3:2) avec un fond noir : il se fond automatiquement dans la bannière.</p>
{msg&&<p className="text-sm">{msg}</p>}
<section className="border border-sand bg-white p-4"><h2 className="mb-3 font-serif text-2xl text-plum">Aperçu</h2>
<div className="relative aspect-[3/2] overflow-hidden rounded-md" style={{background:'linear-gradient(118deg,#14040c 0%,#3B0F27 45%,#2a0a1b 100%)'}}>{url?<img src={url} alt="" className="h-full w-full object-cover" style={{mixBlendMode:'lighten'}}/>:<p className="flex h-full items-center justify-center px-4 text-center text-xs text-white/70">Image par défaut (fichier hero-beaute.jpg)</p>}</div>
<div className="mt-4 flex flex-wrap items-center gap-3"><label className={`cursor-pointer rounded-full bg-rose px-5 py-2.5 text-xs uppercase tracking-[0.15em] text-white ${busy?'opacity-50':''}`}>{busy?'Envoi…':url?'Changer l’image':'Ajouter une image'}<input type="file" accept="image/*" disabled={busy} className="hidden" onChange={e=>{up(e.target.files?.[0]);e.target.value=''}}/></label>
{url&&<button type="button" onClick={reset} className="text-xs underline">Revenir à l’image par défaut</button>}</div></section></div>}
