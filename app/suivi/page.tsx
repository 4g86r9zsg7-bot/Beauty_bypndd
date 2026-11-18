
'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase,eur} from '@/lib/supabase';

const STEPS:[string,string][]=[
  ['pending','En attente'],
  ['confirmed','Confirmée'],
  ['preparing','Préparation'],
  ['shipped','Expédiée'],
  ['delivered','Livrée']
];

const MSG:Record<string,string>={
  pending:'Nous avons bien reçu votre commande. Elle sera confirmée très bientôt.',
  confirmed:'Bonne nouvelle : votre commande est confirmée.',
  preparing:'Votre commande est en cours de préparation.',
  shipped:'Votre commande est en route vers vous.',
  delivered:'Votre commande a été livrée. Merci de votre confiance !'
};

function ReviewForm({n,ph,item,onDone}:{n:number;ph:string;item:any;onDone:()=>void}) {
  const [r,setR]=useState(0);
  const [c,setC]=useState('');
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');

  const send=async()=>{
    if(!r)return setErr('Choisissez une note de 1 à 5.');
    setBusy(true);
    setErr('');

    const {error}=await supabase.rpc('submit_review',{
      p_number:n,
      p_phone:ph,
      p_product:item.id,
      p_rating:r,
      p_comment:c
    });

    setBusy(false);
    if(error)return setErr(error.message);
    onDone();
  };

  return (
    <div className="rounded-2xl border border-sand bg-white p-4">
      <p className="font-serif text-lg text-plum">{item.name}</p>
      <p className="mt-1 text-xs text-ink/50">Partagez votre expérience</p>

      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Note">
        {[1,2,3,4,5].map(k=>(
          <button
            key={k}
            type="button"
            aria-label={`${k} étoile${k>1?'s':''}`}
            aria-pressed={r===k}
            onClick={()=>setR(k)}
            className={`text-4xl leading-none transition active:scale-90 ${
              k<=r?'text-rose':'text-sand'
            }`}
          >★</button>
        ))}
      </div>

      <textarea
        rows={3}
        maxLength={1000}
        placeholder="Votre avis (facultatif)"
        value={c}
        onChange={e=>setC(e.target.value)}
        className="mt-3 w-full rounded-xl border border-sand p-3 text-base focus:outline-none focus:ring-2 focus:ring-rose"
      />

      {err&&<p className="mt-2 text-sm text-red-700">{err}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={send}
        className="mt-3 rounded-full bg-rose px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white disabled:opacity-50"
      >
        {busy?'Envoi…':'Publier mon avis'}
      </button>
    </div>
  );
}

function OrderCard({o,ph,open,reload}:{o:any;ph:string;open:boolean;reload:()=>Promise<void>}) {
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');

  const idx=STEPS.findIndex(s=>s[0]===o.status);
  const cancelled=o.status==='cancelled';
  const current=STEPS[idx]?.[1]||'Statut inconnu';

  const at=(st:string)=>[...(o.history||[])]
    .reverse()
    .find((h:any)=>h.status===st)?.at;

  const cancel=async()=>{
    if(!confirm('Voulez-vous vraiment annuler votre commande ? Cette action est définitive.'))return;

    setBusy(true);
    setErr('');

    const {error}=await supabase.rpc('cancel_order',{
      p_number:o.number,
      p_phone:ph
    });

    await reload();
    setBusy(false);

    if(error)setErr(error.message);
  };

  return (
    <details
      open={open}
      className="mt-5 overflow-hidden rounded-3xl border border-sand/80 bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="font-serif text-xl text-plum">Ma commande</p>
          <p className="mt-1 text-xs text-ink/50">
            {new Date(o.created_at).toLocaleString('fr-FR')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-2 text-[10px] font-semibold ${
            cancelled?'bg-red-50 text-red-700':
            o.status==='delivered'?'bg-plum text-white':
            'bg-blush text-plum'
          }`}>
            {cancelled?'Annulée':current}
          </span>
          <span className="text-plum">⌄</span>
        </div>
      </summary>

      <div className="border-t border-sand px-5 pb-5 pt-4">

        {cancelled?(
          <div className="rounded-2xl bg-red-50 p-6 text-center text-red-700">
            <span className="text-3xl">×</span>
            <p className="mt-2 font-serif text-2xl">Commande annulée</p>
            <p className="mt-2 text-sm">
              Pour toute question, contactez-nous sur WhatsApp.
            </p>
          </div>
        ):(
          <>
            <div className="rounded-2xl bg-blush/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-plum/60">
                État de votre commande
              </p>
              <p className="mt-2 font-serif text-2xl text-plum">{current}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {MSG[o.status]||'Le statut de votre commande sera bientôt actualisé.'}
              </p>
            </div>

            <div className="mt-7">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-plum">
                Progression de votre commande
              </p>

              <div className="relative">
                <div className="absolute left-[10%] right-[10%] top-4 h-1 rounded-full bg-sand"/>
                <div
                  className="absolute left-[10%] top-4 h-1 rounded-full bg-rose transition-all duration-500"
                  style={{width:`${idx<0?0:idx/4*80}%`}}
                />

                <div className="relative grid grid-cols-5">
                  {STEPS.map(([s,l],i)=>{
                    const done=i<=idx;
                    const active=i===idx;

                    return (
                      <div key={s} className="flex min-w-0 flex-col items-center text-center">
                        <span className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition ${
                          done
                            ?'border-rose bg-rose text-white'
                            :'border-sand bg-white text-ink/30'
                        } ${active?'ring-4 ring-blush':''}`}>
                          {done?'✓':i+1}
                        </span>

                        <span className={`mt-3 px-0.5 text-[9px] leading-tight sm:text-[10px] ${
                          active?'font-bold text-plum':
                          done?'font-medium text-plum/70':'text-ink/40'
                        }`}>
                          {l}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              {STEPS.map(([s,l],i)=>{
                const done=i<=idx;
                const active=i===idx;
                const date=at(s);

                return (
                  <div
                    key={s}
                    className={`flex items-start gap-3 rounded-xl p-3 ${
                      active?'border border-rose/30 bg-blush/30':''
                    }`}
                  >
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      done?'bg-plum text-white':'bg-sand text-ink/40'
                    }`}>
                      {done?'✓':i+1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${
                        active?'font-semibold text-plum':
                        done?'text-ink/70':'text-ink/40'
                      }`}>
                        {l}
                        {active&&<span className="ml-2 text-[9px] uppercase tracking-wider text-rose">En cours</span>}
                      </p>
                      {date&&(
                        <p className="mt-1 text-xs text-ink/50">
                          {new Date(date).toLocaleString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {['pending','confirmed','preparing'].includes(o.status)&&(
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="mt-5 w-full rounded-full border border-red-300 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            {busy?'Annulation…':'Annuler ma commande'}
          </button>
        )}

        {err&&<p className="mt-3 text-sm text-red-700">{err}</p>}

        {o.status==='shipped'&&(
          <p className="mt-4 rounded-xl bg-cream p-4 text-xs leading-relaxed text-ink/70">
            Votre commande est en cours de livraison et ne peut plus être annulée ici. Contactez-nous sur WhatsApp pour toute question.
          </p>
        )}

        {o.status==='delivered'&&(
          <section className="mt-6 border-t border-sand pt-5">
            <h3 className="font-serif text-2xl text-plum">Votre avis compte</h3>
            <p className="mt-1 text-sm text-ink/60">
              Votre retour aide les autres clientes.
            </p>

            <div className="mt-4 space-y-3">
              {Array.from(new Map((o.items||[]).map((i:any)=>[i.id,i])).values()).map((i:any)=>(
                (o.reviewed||[]).includes(i.id)
                  ?<p key={i.id} className="rounded-xl bg-blush/50 p-3 text-sm text-plum">
                    ✓ Merci pour votre avis sur {i.name}
                  </p>
                  :<ReviewForm
                    key={i.id}
                    n={o.number}
                    ph={ph}
                    item={i}
                    onDone={()=>{reload()}}
                  />
              ))}
            </div>
          </section>
        )}

        <div className="mt-6 border-t border-sand pt-4">
          <h3 className="mb-3 font-serif text-lg text-plum">Récapitulatif</h3>

          <div className="divide-y divide-sand text-sm">
            {(o.items||[]).map((i:any,k:number)=>(
              <div key={k} className="flex justify-between gap-3 py-3">
                <span className="text-ink/70">
                  {i.qty} × {i.name}{i.variant?` (${i.variant})`:''}
                </span>
                <b className="shrink-0 text-ink">{eur(i.price*i.qty)}</b>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-blush/40 p-4">
            <span className="font-serif text-lg text-plum">Total</span>
            <span className="font-serif text-2xl text-plum">{eur(o.total)}</span>
          </div>
        </div>
      </div>
    </details>
  );
}

export default function Suivi() {
  const [ph,setPh]=useState('');
  const [list,setList]=useState<any[]|null>(null);
  const [err,setErr]=useState('');
  const [busy,setBusy]=useState(false);

  const search=async(phone:string)=>{
    setErr('');
    setBusy(true);

    const {data,error}=await supabase.rpc('track_orders',{
      p_phone:phone
    });

    setBusy(false);

    if(error)return setErr('Une erreur est survenue. Réessayez.');

    if(!data||!data.length){
      setList(null);
      return setErr('Aucune commande trouvée pour ce numéro. Vérifiez le numéro utilisé lors de la commande.');
    }

    setList(data);

    try{
      localStorage.setItem('lastOrder',JSON.stringify({p:phone}));
    }catch{}
  };

  useEffect(()=>{
    try{
      const s=JSON.parse(localStorage.getItem('lastOrder')||'null');
      if(s?.p){
        setPh(s.p);
        search(s.p);
      }
    }catch{}
  },[]);

  return (
    <div className="mx-auto max-w-xl px-1">
      <div className="mb-7 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-rose">
          BeautyByPND
        </p>
        <h1 className="mt-2 font-serif text-4xl text-plum">
          Suivi de commande
        </h1>
        <div className="mx-auto mt-3 h-px w-16 bg-rose"/>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">
          Retrouvez toutes les étapes de votre commande en quelques secondes.
        </p>
      </div>

      <form
        onSubmit={e=>{
          e.preventDefault();
          search(ph);
        }}
        className="rounded-3xl border border-sand/70 bg-white p-5 shadow-sm"
      >
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-plum">
          Votre numéro de téléphone
        </label>

        <input
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Votre numéro de téléphone"
          value={ph}
          onChange={e=>setPh(e.target.value)}
          className="w-full rounded-xl border border-sand bg-white px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-rose"
        />

        <button
          disabled={busy}
          className="mt-4 w-full rounded-full bg-rose py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-plum disabled:opacity-50"
        >
          {busy?'Recherche…':'Voir mes commandes'}
        </button>

        {err&&(
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {err}
          </p>
        )}
      </form>

      {list&&(
        <>
          <div className="mt-7 flex items-center justify-between">
            <div>
              <p className="font-serif text-2xl text-plum">Vos commandes</p>
              <p className="mt-1 text-xs text-ink/50">{list[0].name}</p>
            </div>
            <span className="rounded-full bg-blush px-3 py-2 text-xs font-semibold text-plum">
              {list.length} commande{list.length>1?'s':''}
            </span>
          </div>

          {list.map((o,i)=>(
            <OrderCard
              key={o.number}
              o={o}
              ph={ph}
              open={i===0}
              reload={()=>search(ph)}
            />
          ))}
        </>
      )}

      <p className="mt-8 text-center text-sm text-ink/60">
        Une question ?{' '}
        <Link href="/contact" className="font-medium text-plum underline underline-offset-4">
          Contactez-nous
        </Link>
      </p>
    </div>
  );
}
