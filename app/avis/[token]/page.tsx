'use client';
import {useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import {supabase} from '@/lib/supabase';

type ReviewItem={id:string;name:string;reviewed:boolean};

export default function AvisCommande(){
  const params=useParams<{token:string}>();
  const token=String(params?.token||'');
  const [items,setItems]=useState<ReviewItem[]>([]);
  const [firstName,setFirstName]=useState('');
  const [ratings,setRatings]=useState<Record<string,number>>({});
  const [comments,setComments]=useState<Record<string,string>>({});
  const [sent,setSent]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{
    if(!token)return;
    let active=true;
    supabase.rpc('get_order_review_link',{p_token:token}).then(({data,error})=>{
      if(!active)return;
      if(error||!data?.ok)setError(data?.message||'Ce lien est invalide ou a expiré.');
      else{setFirstName(data.first_name||'');setItems(Array.isArray(data.items)?data.items:[]);}
      setLoading(false);
    });
    return ()=>{active=false;};
  },[token]);

  const submit=async(item:ReviewItem)=>{
    if(!(ratings[item.id]||0)){setError('Choisissez une note de 1 à 5 étoiles.');return;}
    setBusy(item.id);setError('');
    const {error}=await supabase.rpc('submit_order_review_link',{
      p_token:token,p_product:item.id,p_rating:ratings[item.id],p_comment:comments[item.id]||''
    });
    setBusy('');
    if(error){setError(error.message);return;}
    setSent(old=>[...old,item.id]);
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#98783b]">BeautyByPND</p>
          <h1 className="mt-3 font-serif text-3xl text-plum">{'Votre avis compte'+(firstName?', '+firstName:'')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">Merci pour votre commande. Partagez votre expérience sur les articles reçus.</p>
          {loading?<p className="mt-8 text-sm text-ink/60">Chargement de votre commande…</p>:
            error&&items.length===0?<p className="mt-8 rounded-xl bg-blush p-4 text-sm text-plum">{error}</p>:
            items.length===0?<p className="mt-8 text-sm text-ink/60">Aucun article à évaluer.</p>:
            <div className="mt-7 space-y-4">
              {items.map(item=>(
                <section key={item.id} className="rounded-2xl border border-sand p-4">
                  <h2 className="font-serif text-xl text-plum">{item.name}</h2>
                  {item.reviewed||sent.includes(item.id)?
                    <p className="mt-3 rounded-xl bg-blush/60 p-3 text-sm text-plum">✓ Merci ! Votre avis a bien été transmis et sera vérifié avant publication.</p>:
                    <>
                      <p className="mt-2 text-xs text-ink/55">Votre note</p>
                      <div className="mt-2 flex gap-2" role="group" aria-label="Choisir une note">
                        {[1,2,3,4,5].map(n=><button key={n} type="button" onClick={()=>setRatings(old=>({...old,[item.id]:n}))} aria-label={String(n)+' étoile(s)'} aria-pressed={ratings[item.id]===n} className={'text-3xl '+(n<=(ratings[item.id]||0)?'text-[#C6A15B]':'text-sand')}>★</button>)}
                      </div>
                      <textarea rows={3} maxLength={1000} value={comments[item.id]||''} onChange={e=>setComments(old=>({...old,[item.id]:e.target.value}))} placeholder="Votre commentaire (facultatif)" className="mt-3 w-full rounded-xl border border-sand p-3 text-base"/>
                      <button type="button" disabled={busy===item.id} onClick={()=>submit(item)} className="mt-3 rounded-full bg-rose px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50">{busy===item.id?'Envoi…':'Envoyer mon avis'}</button>
                    </>
                  }
                </section>
              ))}
            </div>
          }
          {error&&items.length>0&&<p className="mt-4 text-sm text-red-700">{error}</p>}
          <p className="mt-7 border-t border-sand pt-4 text-center text-[11px] text-ink/45">Chaque avis est vérifié par BeautyByPND avant sa publication.</p>
        </div>
      </div>
    </main>
  );
}
