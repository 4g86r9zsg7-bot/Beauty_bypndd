
'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useCart} from '@/lib/cart';
import {useClient} from '@/components/ClientProvider';
import {supabase,eur,WA} from '@/lib/supabase';
import Suggestions from '@/components/Suggestions';
import CartOfferUpsell from '@/components/CartOfferUpsell';
import {DELIVERY,PREORDER} from '@/lib/shop';

const bag=<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8.5h14l-1 11.5H6z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/></svg>;

const normalizeCity=(city:string)=>{
  const normalized=String(city||'')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]/g,'');

  return normalized==='fez'?'fes':normalized;
};

export default function Panier(){
  const {lines,setQty,remove,clear,subtotal,count}=useCart();
  const {clientKey}=useClient();

  const [cfg,setCfg]=useState<any>(null);
  const [f,setF]=useState({
    name:'',
    phone:'',
    address:'',
    city:'',
    notes:'',
    promo:''
  });

  const [err,setErr]=useState('');
  const [ack,setAck]=useState(false);
  const [busy,setBusy]=useState(false);
  const [order,setOrder]=useState<any>(null);
  const [qt,setQt]=useState<any>(null);
  const [pr,setPr]=useState<any>(null);
  const [promoBusy,setPromoBusy]=useState(false);
  const [codeCopied,setCodeCopied]=useState(false);
  const [copyError,setCopyError]=useState('');

  useEffect(()=>{
    if(!lines.length){
      setQt(null);
      return;
    }

    const it=lines.map((l:any)=>
      l.offer
        ?{offer_id:l.offer,qty:l.qty}
        :{id:l.id,qty:l.qty,variant:l.variant}
    );

    let off=false;

    supabase.rpc('quote_cart_secure',{p_items:it}).then(({data,error})=>{
      if(!off)setQt(error?null:data);
    });

    return()=>{off=true};
  },[lines]);

  useEffect(()=>{
    supabase.from('settings')
      .select('value')
      .eq('key','delivery')
      .single()
      .then(({data})=>setCfg(data?.value));
  },[]);

  const zones=cfg?.zones||[];
  const cityKey=normalizeCity(f.city);

  const matchingZone=zones.find((z:any)=>
    z.city!=='*'&&normalizeCity(z.city)===cityKey
  );

  const fee0=matchingZone?.fee
    ??zones.find((z:any)=>z.city==='*')?.fee
    ??0;

  const od=Number(qt?.discount||0);
  const hasOffer=od>0||qt?.has_pack===true||lines.some((l:any)=>l.offer);
  const disc=!hasOffer&&pr?.ok?Number(pr.discount):0;

  const freeOver=Number(cfg?.free_over||0);
  const deliveryBase=Math.max(0,subtotal-disc-od);
  const freeDeliveryReached=Boolean(
    cfg&&freeOver>0&&deliveryBase>=freeOver
  );

  const hasCity=f.city.trim().length>0;
  const fee=hasCity?(freeDeliveryReached?0:fee0):0;
  const cur=cfg?.currency||'DH';

  const left=freeOver>0
    ?Math.max(0,freeOver-deliveryBase)
    :0;

  const progress=freeOver>0
    ?Math.min(100,Math.max(0,(deliveryBase/freeOver)*100))
    :0;

  const totalSavings=Math.max(0,disc+od);
  const originalTotal=subtotal+fee;
  const finalTotal=subtotal-disc-od+fee;

  const applyPromo=async()=>{
    const code=f.promo.trim().toUpperCase();

    if(hasOffer||promoBusy||!code)return;

    if(!f.phone.trim()){
      setPr({ok:false,message:'Renseignez votre numéro de téléphone avant d’appliquer le code.'});
      return;
    }

    setPromoBusy(true);
    setPr(null);

    try{
      const {data,error}=await supabase.rpc('check_promo_secure',{
        p_code:code,
        p_sub:subtotal,
        p_phone:f.phone,
        p_items:lines.filter((l:any)=>!l.offer).map((l:any)=>({id:l.id,qty:l.qty,variant:l.variant}))
      });

      if(error)throw error;

      const result=data||{ok:false,message:'Code promo invalide'};
      setPr(result);

      if(result.ok){
        setF(prev=>({...prev,promo:code}));
      }
    }catch(error:any){
      setPr({
        ok:false,
        message:error?.message||'Impossible de vérifier ce code pour le moment. Réessayez.'
      });
    }finally{
      setPromoBusy(false);
    }
  };

  const removePromo=()=>{
    setF(prev=>({...prev,promo:''}));
    setPr(null);
  };

  const set=(k:string)=>(e:any)=>{
    const value=e.target.value;
    setF(prev=>({...prev,[k]:value}));
    if(k==='phone')setPr(null);
    if(k==='promo')setPr(null);
  };

  async function submit(e:any){
    e.preventDefault();
    setErr('');
    if(!clientKey){setErr('La session sécurisée ne s’est pas initialisée. Actualisez la page puis réessayez.');return;}
    setBusy(true);

    const {data,error}=await supabase.rpc(
      hasOffer?'place_order2_secure':'place_order_secure',
      {
        p_c:f,
        p_items:lines.map((l:any)=>
          l.offer
            ?{offer_id:l.offer,qty:l.qty}
            :{id:l.id,qty:l.qty,variant:l.variant}
        ),
        p_promo:hasOffer?'':f.promo,
        p_client_key:clientKey
      }
    );

    setBusy(false);

    if(error)return setErr(error.message);

    setOrder(data);

    clear();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  const copyAccessCode=async()=>{
    const code=String(order?.access_code||'').trim();
    if(!code){setCopyError('Code indisponible.');return;}

    setCopyError('');
    setCodeCopied(false);

    try{
      if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(code);
        setCodeCopied(true);
        return;
      }
    }catch(e){
      // Utiliser la méthode de secours ci-dessous.
    }

    try{
      const area=document.createElement('textarea');
      area.value=code;
      area.setAttribute('readonly','');
      area.style.position='fixed';
      area.style.top='0';
      area.style.left='-9999px';
      area.style.opacity='0';
      document.body.appendChild(area);
      area.focus();
      area.select();
      area.setSelectionRange(0,area.value.length);
      const copied=document.execCommand('copy');
      document.body.removeChild(area);
      if(!copied)throw new Error('Copie non autorisée');
      setCodeCopied(true);
    }catch(e){
      setCopyError('La copie automatique a échoué. Appuyez longuement sur le code pour le sélectionner et le copier.');
    }
  };

  const inp="w-full rounded-xl border border-sand bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink/40 transition focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20";

  const card="rounded-2xl border border-sand/70 bg-white p-5 shadow-sm sm:p-6";

  const h2="font-serif text-2xl text-plum";

  const btn="rounded-full py-4 text-center text-xs font-semibold uppercase tracking-[0.16em] transition active:scale-[0.98]";

  if(order){
    const its:any[]=order.items||[];
    const hasPre=its.some(i=>i.preorder);

    const txt=encodeURIComponent(
      [
        'Bonjour, je souhaite confirmer ma commande.',
        `Client : ${order.name}`,
        `Téléphone : ${order.phone}`,
        `Adresse : ${order.address}, ${order.city}`,
        '',
        'Détail de la commande :',
        ...its.map(i=>`• ${i.qty} × ${i.name}${i.variant?` (${i.variant})`:''}${i.preorder?' — PRÉCOMMANDE':''} : ${eur(Number(i.price||0)*Number(i.qty||0),cur)}`),
        '',
        `Sous-total : ${eur(order.subtotal,cur)}`,
        Number(order.discount)>0?`Réductions : -${eur(order.discount,cur)}`:null,
        Number(order.delivery_fee)>0?`Livraison : ${eur(order.delivery_fee,cur)}`:'Livraison : offerte',
        `Total à payer : ${eur(order.total,cur)}`,
        'Paiement à la livraison en espèces.',
        hasPre?'Délai des précommandes : 2 à 3 semaines (à confirmer).':'Délai estimé : 24 à 48 h après confirmation.'
      ].filter(Boolean).join('\n')
    );

    return(
      <>
        <div className="mx-auto max-w-2xl px-4 py-8">

          <div className="py-8 text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blush text-plum">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5"/>
              </svg>
            </span>

            <p className="mt-5 text-xs uppercase tracking-[0.25em] text-rose">
              BeautyByPND
            </p>

            <h1 className="mt-2 font-serif text-4xl text-plum">
              Merci {String(order.name||'').split(' ')[0]}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-ink/65">
              Votre commande a bien été enregistrée.
              Nous vous remercions pour votre confiance.
            </p>
          </div>

          <section className={`${card} mb-4 border-rose/30 bg-blush/30`}>
            <h2 className={h2}>Votre code secret de suivi</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Conservez précieusement ce code. Il sera nécessaire, avec votre numéro de téléphone, pour consulter votre commande, demander une annulation ou publier un avis.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose/20 bg-white p-4">
              <span className="break-all font-mono text-lg font-bold tracking-wider text-plum">
                {order.access_code}
              </span>
              <button
                type="button"
                onClick={copyAccessCode}
                className="rounded-full bg-rose px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-plum active:scale-95"
              >
                {codeCopied?'Code copié !':'Copier le code'}
              </button>
            </div>
            {codeCopied&&(
              <p role="status" className="mt-2 text-xs font-medium text-green-700">
                Votre code a été copié. Vous pouvez le coller dans le suivi de commande.
              </p>
            )}
            {copyError&&(
              <p role="alert" className="mt-2 text-xs leading-relaxed text-red-700">
                {copyError}
              </p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-plum">
              Attention : ce code ne sera affiché qu’une seule fois sur cette page. Notez-le ou faites une capture d’écran.
            </p>
          </section>

          <section className={card}>
            <h2 className={h2}>Récapitulatif</h2>

            <div className="mt-4 divide-y divide-sand">
              {its.map((i,k)=>(
                <div key={k} className="flex justify-between gap-3 py-4 text-sm">
                  <div>
                    <p className="font-medium text-ink">
                      {i.qty} × {i.name}
                    </p>

                    {i.variant&&(
                      <p className="mt-1 text-xs text-ink/55">
                        {i.variant}
                      </p>
                    )}

                    {i.preorder&&(
                      <p className="mt-1 text-xs text-plum">
                        Précommande
                      </p>
                    )}
                  </div>

                  <b className="shrink-0 text-ink">
                    {eur(i.price*i.qty,cur)}
                  </b>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-3 border-t border-sand pt-4 text-sm">
              <p className="flex justify-between">
                <span className="text-ink/65">Sous-total</span>
                <span>{eur(order.subtotal,cur)}</span>
              </p>

              {Number(order.discount)>0&&(
                <p className="flex justify-between text-rose">
                  <span>Réduction</span>
                  <span>-{eur(order.discount,cur)}</span>
                </p>
              )}

              <p className="flex justify-between">
                <span className="text-ink/65">Livraison</span>
                <span>
                  {Number(order.delivery_fee)
                    ?eur(order.delivery_fee,cur)
                    :'Offerte'}
                </span>
              </p>

              <p className="flex justify-between border-t border-sand pt-4 font-serif text-2xl text-plum">
                <span>Total à payer</span>
                <span>{eur(order.total,cur)}</span>
              </p>
            </div>

            <div className="mt-5 rounded-xl bg-blush/30 p-4 text-sm leading-relaxed text-ink/75">
              <p className="font-semibold text-plum">Adresse de livraison</p>
              <p className="mt-1">
                {order.address}, {order.city}
              </p>
              <p className="mt-1">{order.phone}</p>
            </div>
          </section>

          <section className={`${card} mt-4`}>
            <h2 className={h2}>Prochaines étapes</h2>

            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink/75">
              <li>
                Confirmez votre commande sur WhatsApp pour accélérer son traitement.
              </li>

              {its.some(i=>!i.preorder)&&(
                <li>
                  Livraison à domicile en <b>{DELIVERY}</b> après confirmation pour les articles disponibles.
                </li>
              )}

              {hasPre&&(
                <li>
                  Vos articles en précommande demandent <b>{PREORDER}</b> d’attente. Le délai exact vous sera confirmé par WhatsApp.
                </li>
              )}

              <li>
                Paiement en espèces à la réception.
              </li>
            </ol>
          </section>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href={`https://wa.me/${WA}?text=${txt}`}
              className={`${btn} bg-rose text-white shadow-md hover:bg-plum`}
            >
              Confirmer sur WhatsApp
            </a>

            <Link
              href="/suivi"
              className={`${btn} border border-plum text-plum hover:bg-blush/30`}
            >
              Suivre ma commande
            </Link>
          </div>

          <p className="mt-5 text-center text-sm text-ink/65">
            <Link href="/" className="underline underline-offset-4">
              Continuer mes achats
            </Link>
          </p>
        </div>

        <Suggestions title="Découvrez aussi" limit={4}/>
      </>
    );
  }

  if(!lines.length){
    return(
      <>
        <div className="px-4 py-16 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blush text-plum">
            {bag}
          </span>

          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-rose">
            BeautyByPND
          </p>

          <h1 className="mt-2 font-serif text-3xl text-plum">
            Votre panier est vide
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink/60">
            Votre prochaine découverte beauté vous attend.
            Parcourez notre sélection et trouvez vos coups de cœur.
          </p>

          <Link
            href="/"
            className={`${btn} mt-7 inline-block bg-rose px-8 text-white shadow-md hover:bg-plum`}
          >
            Découvrir la boutique
          </Link>
        </div>

        <Suggestions title="Nos produits en stock" limit={8}/>
      </>
    );
  }

  return(
    <>
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">

        <div className="mb-7">
          <p className="text-xs uppercase tracking-[0.22em] text-rose">
            BeautyByPND
          </p>

          <h1 className="mt-2 font-serif text-4xl text-plum">
            Mon panier
          </h1>

          <p className="mt-2 text-sm text-ink/55">
            {count} article{count>1?'s':''} dans votre sélection
          </p>
        </div>

        <form
          onSubmit={submit}
          className="grid items-start gap-6 lg:grid-cols-[1.45fr_0.85fr]"
        >

          <div className="space-y-6">

            <section className={card}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className={h2}>Vos articles</h2>

                <span className="text-xs text-ink/50">
                  {count} article{count>1?'s':''}
                </span>
              </div>

              {lines.map((l:any,i:number)=>(
                <div
                  key={`${l.id}-${l.variant}`}
                  className="flex gap-4 border-b border-sand py-5 last:border-0 last:pb-0"
                >
                  <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-sand sm:h-32 sm:w-24">
                    {l.image&&(
                      <img
                        src={l.image}
                        alt={l.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="line-clamp-2 font-serif text-lg leading-snug text-ink">
                      {l.name}
                    </p>

                    {l.variant&&(
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-plum">
                        {l.variant}
                      </p>
                    )}

                    {l.pre&&(
                      <p className="mt-2 inline-flex w-fit rounded-full bg-blush/50 px-3 py-1 text-[11px] text-plum">
                        Précommande · {PREORDER}
                      </p>
                    )}

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">

                      <div>
                        <div className="inline-flex items-center rounded-full border border-sand bg-white">
                          <button
                            type="button"
                            aria-label="Diminuer la quantité"
                            onClick={()=>setQty(i,l.qty-1)}
                            className="h-9 w-9 text-lg text-plum transition hover:bg-blush"
                          >
                            −
                          </button>

                          <span className="w-8 text-center text-sm font-medium">
                            {l.qty}
                          </span>

                          <button
                            type="button"
                            aria-label="Augmenter la quantité"
                            onClick={()=>setQty(i,l.qty+1)}
                            disabled={l.max!=null&&l.qty>=l.max}
                            className="h-9 w-9 text-lg text-plum transition hover:bg-blush disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={()=>remove(i)}
                          className="ml-2 text-xs text-ink/45 underline underline-offset-4 hover:text-rose"
                        >
                          Supprimer
                        </button>

                        {l.max!=null&&l.qty>=l.max&&(
                          <p className="mt-2 text-[11px] text-plum">
                            Quantité maximale disponible
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-ink">
                          {eur(l.price*l.qty,cur)}
                        </p>

                        {l.qty>1&&(
                          <p className="mt-1 text-xs text-ink/45">
                            {eur(l.price,cur)} l’unité
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <CartOfferUpsell/>

            <section className={card}>
              <div className="mb-5">
                <h2 className={h2}>Informations de livraison</h2>
                <p className="mt-1 text-xs text-ink/50">
                  Renseignez vos coordonnées pour recevoir votre commande.
                </p>
              </div>

              <div className="grid gap-3">
                <input
                  required
                  placeholder="Nom et prénom"
                  autoComplete="name"
                  value={f.name}
                  onChange={set('name')}
                  className={inp}
                />

                <input
                  required
                  type="tel"
                  inputMode="tel"
                  placeholder="Téléphone"
                  autoComplete="tel"
                  value={f.phone}
                  onChange={set('phone')}
                  className={inp}
                />

                <input
                  required
                  placeholder="Adresse de livraison"
                  autoComplete="street-address"
                  value={f.address}
                  onChange={set('address')}
                  className={inp}
                />

                <input
                  required
                  placeholder="Ville"
                  autoComplete="address-level2"
                  value={f.city}
                  onChange={set('city')}
                  className={inp}
                />

                <textarea
                  rows={3}
                  placeholder="Instructions de livraison (facultatif)"
                  value={f.notes}
                  onChange={set('notes')}
                  className={inp}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28">
            <section className={card}>
              <h2 className={h2}>Récapitulatif</h2>

              {(()=>{
                const hasPreorder=lines.some((l:any)=>l.pre);
                const hasRegular=lines.some((l:any)=>!l.pre);
                return (
                  <div className="mt-4 rounded-2xl border border-rose/20 bg-blush/30 p-4">
                    <p className="text-sm font-semibold text-plum">Délai estimé de livraison</p>
                    <div className="mt-2 space-y-2 text-xs leading-relaxed text-ink/75">
                      {hasRegular&&(
                        <p><b>Articles disponibles :</b> {DELIVERY} après confirmation de la commande.</p>
                      )}
                      {hasPreorder&&(
                        <p><b>Articles en précommande :</b> {PREORDER}. Le délai exact sera confirmé par WhatsApp.</p>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-ink/50">
                      Cette estimation est indicative et commence après confirmation de votre commande.
                    </p>
                  </div>
                );
              })()}


              {freeOver>0&&(
                <div className="mt-5 rounded-2xl border border-rose/15 bg-gradient-to-br from-blush/50 to-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-plum">
                      {freeDeliveryReached
                        ?'Félicitations !'
                        :'Livraison gratuite'}
                    </p>

                    <span className="text-xs font-semibold text-rose">
                      {Math.round(progress)}%
                    </span>
                  </div>

                  <div
                    className="mt-3 h-2.5 overflow-hidden rounded-full bg-rose/10"
                    role="progressbar"
                    aria-label="Progression vers la livraison gratuite"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose to-amber-400 transition-all duration-500"
                      style={{width:`${progress}%`}}
                    />
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-plum">
                    {freeDeliveryReached
                      ?'Vous avez atteint le seuil : la livraison est offerte !'
                      :<>Plus que <b>{eur(left,cur)}</b> d’achats pour profiter de la livraison gratuite.</>}
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-3 text-sm">
                <p className="flex justify-between gap-3">
                  <span className="text-ink/65">Sous-total</span>
                  <span className="font-medium">{eur(subtotal,cur)}</span>
                </p>

                {hasCity&&(
                  <p className="flex justify-between gap-3">
                    <span className="text-ink/65">Livraison</span>
                    <span className="font-medium">
                      {fee?eur(fee,cur):'Offerte'}
                    </span>
                  </p>
                )}

                {disc>0&&(
                  <p className="flex justify-between gap-3 text-rose">
                    <span>Réduction ({f.promo.trim().toUpperCase()})</span>
                    <span>-{eur(disc,cur)}</span>
                  </p>
                )}

                {od>0&&(
                  <p className="flex justify-between gap-3 text-rose">
                    <span className="min-w-0">
                      Offre : {(qt?.applied||[]).map((a:any)=>a.title).join(', ')}
                    </span>
                    <span className="shrink-0">-{eur(od,cur)}</span>
                  </p>
                )}
              </div>

              {totalSavings>0&&(
                <div className="mt-5 rounded-2xl border border-rose/20 bg-blush/30 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-plum">
                        Vos économies
                      </p>
                      <p className="text-[11px] text-ink/55">
                        Grâce à vos promotions et offres
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 font-serif text-2xl text-rose">
                    {eur(totalSavings,cur)}
                  </p>

                  <div className="mt-2 space-y-1 text-xs text-ink/65">
                    {disc>0&&(
                      <p className="flex justify-between">
                        <span>Code promotionnel</span>
                        <span>-{eur(disc,cur)}</span>
                      </p>
                    )}

                    {od>0&&(
                      <p className="flex justify-between">
                        <span>Offres et packs</span>
                        <span>-{eur(od,cur)}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 border-t border-sand pt-4">
                {totalSavings>0&&(
                  <p className="mb-2 flex justify-between gap-3 text-xs text-ink/50">
                    <span>Montant avant réductions</span>
                    <span>{eur(originalTotal,cur)}</span>
                  </p>
                )}

                <p className="flex items-center justify-between gap-3 font-serif text-2xl text-plum">
                  <span>Total</span>
                  <span>{eur(finalTotal,cur)}</span>
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-rose/20 bg-blush/25 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.5 13.5 13 21l-10-10V3h8z"/>
                      <circle cx="7.5" cy="7.5" r="1"/>
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-plum">Vous avez un code promo ?</p>
                    <p className="text-[11px] text-ink/55">Ajoutez-le ici pour profiter de votre réduction.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    aria-label="Code promotionnel"
                    placeholder="Saisir votre code"
                    value={f.promo}
                    disabled={hasOffer||promoBusy}
                    onChange={set('promo')}
                    className={`${inp} min-w-0 flex-1 uppercase disabled:opacity-50`}
                  />

                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={hasOffer||promoBusy||!f.promo.trim()}
                    className="rounded-xl bg-plum px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-rose disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {promoBusy?'Vérification…':'Appliquer'}
                  </button>
                </div>

                {hasOffer&&(
                  <p className="mt-2 text-xs text-plum">
                    Les codes promo ne se cumulent pas avec les packs et offres.
                  </p>
                )}

                {pr&&(
                  <div
                    role={pr.ok?'status':'alert'}
                    className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-xs ${pr.ok?'border border-rose/20 bg-white text-plum':'border border-red-200 bg-red-50 text-red-700'}`}
                  >
                    <span className="min-w-0">
                      {pr.ok
                        ?<>Code <b>{f.promo.toUpperCase()}</b> appliqué : <b>-{eur(pr.discount,cur)}</b></>
                        :pr.message}
                    </span>
                    {pr.ok&&(
                      <button
                        type="button"
                        onClick={removePromo}
                        className="shrink-0 font-semibold underline underline-offset-4 hover:text-rose"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                )}
              </div>

              {lines.some((l:any)=>l.pre)&&(
                <label className="mt-5 flex cursor-pointer gap-3 rounded-xl border border-plum/20 bg-blush/30 p-3 text-xs leading-relaxed">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={e=>setAck(e.target.checked)}
                    required
                    className="mt-1 accent-rose"
                  />

                  <span>
                    Ma commande contient des articles en <b>précommande</b> :
                    je comprends qu’ils ne sont pas en stock et que je dois patienter
                    {' '}<b>{PREORDER}</b> avant la livraison. Le délai m’est confirmé par WhatsApp.
                  </span>
                </label>
              )}

              {err&&(
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {err}
                </p>
              )}

              <button
                disabled={busy}
                className={`${btn} mt-5 w-full bg-rose text-white shadow-md hover:bg-plum disabled:opacity-50`}
              >
                {busy?'Validation…':'Valider ma commande'}
              </button>

              <p className="mt-3 text-center text-[11px] text-ink/45">
                Vérifiez vos informations avant de confirmer.
              </p>
            </section>

            <div className="rounded-2xl border border-sand/70 bg-white p-4">
              <ul className="space-y-3 text-xs text-ink/65">
                <li className="flex items-center gap-2">
                  <span className="text-rose">●</span>
                  Paiement à la livraison (espèces)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose">●</span>
                  Livraison à domicile en {DELIVERY}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose">●</span>
                  Produits authentiques
                </li>
              </ul>
            </div>
          </aside>
        </form>
      </div>

      <Suggestions title="Complétez votre commande" excludeCart limit={4}/>
    </>
  );
}
