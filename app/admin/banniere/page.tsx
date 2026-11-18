
'use client';

import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';

const banners=[
  {key:'hero_image',title:'Photo principale',description:'Bannière Le luxe à petit prix'},
  {key:'hero_new_image',title:'Photo Nouveautés',description:'Bannière Nouveautés'},
  {key:'hero_pleasure_image',title:'Photo Faites-vous plaisir',description:'Bannière Faites-vous plaisir'}
] as const;

type BannerKey=typeof banners[number]['key'];

export default function Banniere(){
  const [urls,setUrls]=useState<Record<BannerKey,string>>({
    hero_image:'',
    hero_new_image:'',
    hero_pleasure_image:''
  });
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState<BannerKey|null>(null);

  useEffect(()=>{
    supabase.from('site_settings')
      .select('key,value')
      .in('key',banners.map(b=>b.key))
      .then(({data,error})=>{
        if(error){setMsg('Impossible de charger les images : '+error.message);return}
        setUrls(current=>{
          const next={...current};
          data?.forEach(item=>{
            if(banners.some(b=>b.key===item.key)){
              next[item.key as BannerKey]=item.value||'';
            }
          });
          return next;
        });
      });
  },[]);

  async function prep(f:File):Promise<Blob>{
    const bm=await createImageBitmap(f);
    const r=Math.min(1,2000/bm.width);
    const W=Math.round(bm.width*r);
    const H=Math.round(bm.height*r);
    const cv=document.createElement('canvas');
    cv.width=W;
    cv.height=H;
    const g=cv.getContext('2d');
    if(!g)throw new Error('Navigateur non compatible');
    g.drawImage(bm,0,0,W,H);
    return await new Promise<Blob>((ok,ko)=>
      cv.toBlob(b=>b?ok(b):ko(new Error('Conversion impossible')),'image/jpeg',0.88)
    );
  }

  async function up(key:BannerKey,f?:File){
    if(!f)return;
    if(!f.type.startsWith('image/')){
      setMsg('Choisissez une image (JPG, PNG ou WebP).');
      return;
    }
    if(f.size>20*1024*1024){
      setMsg('Image trop lourde (20 Mo maximum).');
      return;
    }

    setBusy(key);
    setMsg('Envoi de l’image…');

    try{
      const blob=await prep(f);
      const path=`site/${key}-${Date.now()}.jpg`;

      const {error:e1}=await supabase.storage
        .from('product-images')
        .upload(path,blob,{
          contentType:'image/jpeg',
          cacheControl:'31536000'
        });

      if(e1){
        setMsg('Envoi impossible : '+e1.message);
        setBusy(null);
        return;
      }

      const {data}=supabase.storage
        .from('product-images')
        .getPublicUrl(path);

      const {error:e2}=await supabase.from('site_settings')
        .upsert({key,value:data.publicUrl},{onConflict:'key'});

      if(e2){
        setMsg('Image envoyée mais non enregistrée : '+e2.message);
      }else{
        setUrls(current=>({...current,[key]:data.publicUrl}));
        setMsg('Photo enregistrée avec succès.');
      }
    }catch(e:any){
      setMsg('Image illisible : '+(e?.message||'format non pris en charge')+'. Essayez un JPG ou un PNG.');
    }

    setBusy(null);
  }

  async function reset(key:BannerKey){
    const title=banners.find(b=>b.key===key)?.title||'cette image';
    if(!confirm(`Supprimer ${title} et revenir à l’image par défaut ?`))return;

    const {error}=await supabase.from('site_settings').delete().eq('key',key);

    if(error){
      setMsg(error.message);
    }else{
      setUrls(current=>({...current,[key]:''}));
      setMsg('Image réinitialisée.');
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="font-serif text-3xl">Images des bannières</h1>

      <p className="text-xs">
        Ajoutez une photo horizontale pour chaque bannière. Les images sont enregistrées séparément et peuvent être changées à tout moment.
      </p>

      {msg&&<p className="text-sm" role="status">{msg}</p>}

      {banners.map(banner=>{
        const url=urls[banner.key];
        const isBusy=busy===banner.key;

        return (
          <section key={banner.key} className="space-y-3 border border-sand bg-white p-4">
            <h2 className="font-serif text-2xl text-plum">{banner.title}</h2>
            <p className="text-xs text-gray-600">{banner.description}</p>

            <div
              className="relative aspect-[3/2] overflow-hidden rounded-md"
              style={{background:'linear-gradient(118deg,#14040c 0%,#3B0F27 45%,#2a0a1b 100%)'}}
            >
              {url?(
                <img
                  src={url}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                  style={{mixBlendMode:'lighten'}}
                />
              ):(
                <p className="flex h-full items-center justify-center px-4 text-center text-xs text-white/70">
                  Aucune photo ajoutée pour le moment
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className={`cursor-pointer rounded-full bg-rose px-5 py-2.5 text-xs uppercase tracking-[0.15em] text-white ${isBusy?'pointer-events-none opacity-50':''}`}>
                {isBusy?'Envoi…':url?'Changer la photo':'Ajouter une photo'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy!==null}
                  className="hidden"
                  onChange={e=>{
                    up(banner.key,e.target.files?.[0]);
                    e.target.value='';
                  }}
                />
              </label>

              {url&&(
                <button
                  type="button"
                  disabled={busy!==null}
                  onClick={()=>reset(banner.key)}
                  className="text-xs underline disabled:opacity-50"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
