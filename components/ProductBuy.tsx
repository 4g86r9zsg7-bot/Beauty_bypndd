
'use client';

import {useState} from 'react';
import Link from 'next/link';
import Stars from '@/components/Stars';
import HeartButton from '@/components/HeartButton';
import {useCart} from '@/lib/cart';
import {WA,eur} from '@/lib/supabase';
import {DELIVERY,PREORDER} from '@/lib/shop';

const colorMap:Record<string,string>={
  noir:'#171717',
  black:'#171717',
  blanc:'#ffffff',
  white:'#ffffff',
  ivoire:'#fff8e7',
  ivory:'#fff8e7',
  'blanc casse':'#f5f0e6',
  'blanc cassé':'#f5f0e6',

  rose:'#e9a0b5',
  pink:'#e9a0b5',
  'rose pale':'#f5c5d2',
  'rose clair':'#f5c5d2',
  'rose poudre':'#e8c0c8',
  'rose fuchsia':'#d62976',
  fuchsia:'#d62976',
  magenta:'#d62976',

  beige:'#d8c2a0',
  nude:'#d8b99b',
  champagne:'#e8d3a5',
  creme:'#f0e2c5',
  'creme':'#f0e2c5',

  marron:'#795548',
  brown:'#795548',
  chocolat:'#593b2d',
  camel:'#bd966b',
  taupe:'#8b7768',
  caramel:'#b87943',

  rouge:'#c62828',
  red:'#c62828',
  bordeaux:'#701c35',
  burgundy:'#701c35',
  grenat:'#701c35',

  bleu:'#2874b9',
  blue:'#2874b9',
  'bleu clair':'#83bde8',
  'bleu ciel':'#87ceeb',
  'bleu marine':'#172b4d',
  marine:'#172b4d',
  turquoise:'#36b9b0',
  cyan:'#36b9d0',

  vert:'#39845b',
  green:'#39845b',
  'vert clair':'#8bc59b',
  'vert olive':'#77764a',
  kaki:'#77764a',
  olive:'#77764a',
  emeraude:'#087f5b',

  gris:'#929292',
  grey:'#929292',
  gray:'#929292',
  'gris clair':'#d4d4d4',
  'gris fonce':'#555555',

  jaune:'#f3d34a',
  yellow:'#f3d34a',
  moutarde:'#c49b27',
  orange:'#e98735',
  corail:'#ef806c',

  violet:'#8055a5',
  purple:'#8055a5',
  lilas:'#c5a6d8',
  lavender:'#c5a6d8',
  mauve:'#a77aa9',

  dore:'#c5a04b',
  gold:'#c5a04b',
  or:'#c5a04b',
  argente:'#c0c0c0',
  argent:'#c0c0c0',
  silver:'#c0c0c0',
  cuivre:'#b87333',
  bronze:'#cd7f32',

  transparent:'#f4f0e9'
};

function normalizeColor(value:string){
  return String(value||'')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[_-]+/g,' ')
    .replace(/\s+/g,' ');
}

function isMultiColor(value:string){
  const key=normalizeColor(value);

  return [
    'multicolore',
    'multi couleur',
    'multicolor',
    'multicolored',
    'multicoloured',
    'arc en ciel',
    'rainbow',
    'imprime multicolore'
  ].includes(key);
}

function colorValue(value:string){
  const key=normalizeColor(value);

  if(isMultiColor(value)){
    return 'linear-gradient(135deg, #e53935 0%, #e53935 16%, #f5c542 16%, #f5c542 32%, #43a047 32%, #43a047 48%, #2196f3 48%, #2196f3 64%, #8055a5 64%, #8055a5 80%, #e9a0b5 80%, #e9a0b5 100%)';
  }

  if(/^#[0-9a-f]{3,8}$/i.test(key)){
    return key;
  }

  if(colorMap[key]){
    return colorMap[key];
  }

  // Reconnaissance des couleurs même lorsqu'elles sont accompagnées
  // d'une précision comme "bleu clair", "rose pâle" ou "vert olive".
  const entries=[
    ['noir','#171717'],
    ['black','#171717'],
    ['blanc','#ffffff'],
    ['white','#ffffff'],
    ['rose','#e9a0b5'],
    ['pink','#e9a0b5'],
    ['beige','#d8c2a0'],
    ['nude','#d8b99b'],
    ['marron','#795548'],
    ['brown','#795548'],
    ['chocolat','#593b2d'],
    ['rouge','#c62828'],
    ['red','#c62828'],
    ['bordeaux','#701c35'],
    ['bleu','#2874b9'],
    ['blue','#2874b9'],
    ['marine','#172b4d'],
    ['vert','#39845b'],
    ['green','#39845b'],
    ['kaki','#77764a'],
    ['gris','#929292'],
    ['grey','#929292'],
    ['gray','#929292'],
    ['jaune','#f3d34a'],
    ['yellow','#f3d34a'],
    ['orange','#e98735'],
    ['violet','#8055a5'],
    ['purple','#8055a5'],
    ['lilas','#c5a6d8'],
    ['dore','#c5a04b'],
    ['gold','#c5a04b'],
    ['argent','#c0c0c0'],
    ['silver','#c0c0c0']
  ];

  const found=entries.find(([name])=>key.includes(name));

  return found?found[1]:'#d8c9c1';
}

function isColorGroup(name:string){
  const n=normalizeColor(name);
  return n.includes('couleur')||n.includes('color');
}

export default function ProductBuy({p}:{p:any}) {
  const {add,lines}=useCart();

  const vs:any[]=(p.variants||[]).map((x:any)=>
    typeof x==='string'?{name:x}:x
  );

  const vimgs=(x:any):string[]=>x
    ?(Array.isArray(x.images)&&x.images.length
      ?x.images
      :x.image?[x.image]:[])
    :[];

  const imgs:string[]=Array.isArray(p.images)?p.images:[];
  const used=new Set(vs.flatMap(vimgs));
  const gen=imgs.filter(u=>!used.has(u));
  const base=gen[0]||imgs[0]||vs.flatMap(vimgs)[0]||'';

  const [legacyV,setLegacyV]=useState('');
  const [selectedOptions,setSelectedOptions]=useState<Record<string,string>>({});
  const [pic,setPic]=useState<string|null>(null);
  const [done,setDone]=useState(false);
  const [ack,setAck]=useState(false);

  // Détection des groupes d'options enregistrés dans les variantes.
  const optionGroups:{name:string;values:string[]}[]=[];

  vs.forEach(x=>{
    if(!x.options||typeof x.options!=='object'||Array.isArray(x.options))return;

    Object.entries(x.options).forEach(([name,value])=>{
      if(value==null||String(value).trim()==='')return;

      let group=optionGroups.find(g=>g.name===name);

      if(!group){
        group={name,values:[]};
        optionGroups.push(group);
      }

      const val=String(value);

      if(!group.values.includes(val)){
        group.values.push(val);
      }
    });
  });

  const hasOptionGroups=optionGroups.length>0;

  // Recherche de la combinaison correspondant aux choix du client.
  const allOptionsSelected=hasOptionGroups&&optionGroups.every(
    group=>Boolean(selectedOptions[group.name])
  );

  const selectedCombo=hasOptionGroups&&allOptionsSelected
    ?vs.find(x=>
        x.options&&
        optionGroups.every(
          group=>String(x.options[group.name]??'')===selectedOptions[group.name]
        )
      )
    :null;

  const v=hasOptionGroups
    ?(selectedCombo?.name||'')
    :legacyV;

  const cur=hasOptionGroups
    ?selectedCombo
    :vs.find(x=>x.name===legacyV);

  const vph=vimgs(cur);
  const thumbs=vph.length>0?vph:gen;
  const shown=(pic&&thumbs.includes(pic)?pic:null)||vph[0]||base;

  const price=Number(cur?.price??p.price);
  const promo=cur?.price==null&&p.old_price&&p.old_price>p.price;

  const pre=p.availability==='preorder';
  const arrival=p.availability==='arrival';
  const hasV=vs.length>0;
  const vst:string=cur?(cur.status||'available'):'';

  let mode:'cart'|'pre'|'reserve'|'order'|'notify'='cart';

  if(hasV&&cur) {
    if(vst==='arrival')mode='reserve';
    else if(vst==='preorder')mode='pre';
    else if(vst==='soldout')mode='notify';
    else if(cur.stock!=null&&cur.stock<=0&&!pre)mode='pre';
    else if(arrival)mode='order';
  } else if(!hasV) {
    if(p.availability==='soldout'||(!pre&&!arrival&&p.stock<=0))mode='pre';
    else if(arrival)mode='reserve';
  }

  const left=cur?.stock??p.stock;
  const max=pre?null:(left??null);

  const inCart=(lines||[]).find(
    (l:any)=>l.id===p.id&&l.variant===v
  )?.qty||0;

  const full=max!=null&&inCart>=max;
  const needV=hasV&&!cur;
  const needAck=pre&&mode==='cart';

  const status=mode==='pre'||needAck
    ?`Précommande : ${PREORDER}`
    :mode==='reserve'
    ?'Prochain arrivage'
    :mode==='notify'
    ?'Épuisé'
    :(vst==='last'||(left!=null&&left>0&&left<=3))
    ?`Dernières pièces (${left} restant${left>1?'s':''})`
    :`Disponible immédiatement · livraison ${DELIVERY}`;

  const label=(x:any)=>{
    const s=x.status||'available';

    return s==='arrival'?' · arrivage'
      :s==='preorder'?' · précommande'
      :s==='soldout'?' · épuisé'
      :(!pre&&x.stock!=null&&x.stock<=0)?' · précommande':'';
  };

  const wa=(s:string)=>
    `https://wa.me/${WA}?text=${encodeURIComponent(
      `Bonjour, ${s} : ${p.name}${v?` (${v})`:''} - ${price} DH`
    )}`;

  const resetSelection=()=>{
    setPic(null);
    setDone(false);
    setAck(false);
  };

  const chooseOption=(groupName:string,value:string)=>{
    setSelectedOptions(previous=>({
      ...previous,
      [groupName]:value
    }));
    resetSelection();
  };

  const btn="flex w-full items-center justify-center rounded-full py-4 px-5 text-xs tracking-[0.16em] uppercase font-semibold transition duration-300 active:scale-[0.98] disabled:opacity-40";

  const note="mt-4 rounded-2xl border border-plum/20 bg-blush/40 p-4 text-sm leading-relaxed";

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 md:grid-cols-2 md:gap-12 md:px-8 md:py-12">

      {/* GALERIE PHOTOS */}
      <div className="min-w-0 md:sticky md:top-24 md:self-start">

        <div className="relative overflow-hidden rounded-2xl bg-sand">
          <div className="aspect-[4/5]">
            {shown&&(
              <img
                src={shown}
                alt={p.name}
                className="h-full w-full object-cover transition duration-500"
              />
            )}
          </div>

          <HeartButton id={p.id}/>

          {thumbs.length>1&&(
            <>
              <button
                type="button"
                aria-label="Photo précédente"
                onClick={()=>
                  setPic(thumbs[
                    (Math.max(0,thumbs.indexOf(shown))-1+thumbs.length)%thumbs.length
                  ])
                }
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-plum shadow-md transition hover:scale-105"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5l-7 7 7 7"/>
                </svg>
              </button>

              <button
                type="button"
                aria-label="Photo suivante"
                onClick={()=>
                  setPic(thumbs[
                    (Math.max(0,thumbs.indexOf(shown))+1)%thumbs.length
                  ])
                }
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-plum shadow-md transition hover:scale-105"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </>
          )}
        </div>

        {thumbs.length>1&&(
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {thumbs.map((u,i)=>(
              <button
                key={u}
                type="button"
                onClick={()=>setPic(u)}
                aria-label={`Voir la photo ${i+1}`}
                aria-pressed={u===shown}
                className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  u===shown?'border-rose shadow-sm':'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <img src={u} alt="" className="h-full w-full object-cover"/>
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-sand pt-5 text-center">
          <div>
            <span className="text-lg">♡</span>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-ink/60">Sélection beauté</p>
          </div>
          <div>
            <span className="text-lg">✧</span>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-ink/60">Qualité & soin</p>
          </div>
          <div>
            <span className="text-lg">♧</span>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-ink/60">Service client</p>
          </div>
        </div>
      </div>

      {/* INFORMATIONS PRODUIT */}
      <div className="min-w-0 md:pt-4">

        {p.brands?.name&&(
          <Link
            href={`/categorie/tous?brand=${p.brand_id}`}
            className="inline-block text-xs font-semibold uppercase tracking-[0.22em] text-plum underline decoration-rose/50 underline-offset-4"
          >
            {p.brands.name}
          </Link>
        )}

        <h1 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
          {p.name}
        </h1>

        {p.rating_count>0&&(
          <a href="#avis" className="mt-4 inline-flex items-center gap-2 text-sm text-plum">
            <Stars v={p.rating_avg} size={18}/>
            <span>{Number(p.rating_avg).toFixed(1)} ({p.rating_count} avis)</span>
          </a>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="font-serif text-3xl text-plum">
            {eur(price)}
          </span>

          {promo&&(
            <>
              <s className="text-sm text-ink/40">{eur(p.old_price)}</s>
              <span className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-plum">
                -{Math.round(100-p.price/p.old_price*100)}%
              </span>
            </>
          )}
        </div>

        {!needV&&(
          <div className="mt-4 flex items-center gap-2 text-sm text-ink/70">
            <span className={`h-2 w-2 rounded-full ${
              mode==='notify'?'bg-red-400':mode==='pre'?'bg-amber-500':'bg-green-600'
            }`}/>
            {status}
          </div>
        )}

        {!needV&&(mode==='pre'||needAck)&&(
          <div className={note}>
            <b className="text-plum">Précommande.</b>
            {' '}Cet article n’est pas en stock : il est commandé pour vous, avec un délai de <b>{PREORDER}</b>, confirmé par WhatsApp.
          </div>
        )}

        {!needV&&mode==='reserve'&&(
          <div className={note}>
            <b className="text-plum">Prochain arrivage.</b>
            {' '}Réservez cet article : nous vous prévenons par WhatsApp dès sa réception.
          </div>
        )}

        {!needV&&mode==='notify'&&(
          <div className={note}>
            <b className="text-plum">Épuisé.</b>
            {' '}Écrivez-nous pour être prévenue de son retour.
          </div>
        )}

        {/* CHOIX DES OPTIONS : COULEUR, TAILLE, MODÈLE, ETC. */}
        {hasOptionGroups&&(
          <div className="mt-7 space-y-6">
            {optionGroups.map(group=>{
              const colorGroup=isColorGroup(group.name);

              return (
                <div key={group.name}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                    {group.name}
                    {selectedOptions[group.name]&&!colorGroup&&(
                      <span className="ml-2 font-normal normal-case tracking-normal text-plum">
                        : {selectedOptions[group.name]}
                      </span>
                    )}
                  </p>

                  {colorGroup?(
                    <div className="flex flex-wrap gap-3">
                      {group.values.map(value=>{
                        const on=selectedOptions[group.name]===value;
                        const color=colorValue(value);
                        const multi=isMultiColor(value);

                        return (
                          <button
                            key={value}
                            type="button"
                            title={value}
                            aria-label={`Couleur ${value}`}
                            aria-pressed={on}
                            onClick={()=>chooseOption(group.name,value)}
                            className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                              on
                                ?'border-plum ring-2 ring-rose ring-offset-2'
                                :'border-black/10 hover:border-rose'
                            }`}
                          >
                            <span
                              className={`h-7 w-7 rounded-full border shadow-inner ${
                                multi?'border-black/20':'border-black/15'
                              }`}
                              style={{background:color}}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ):(
                    <div className="flex flex-wrap gap-2">
                      {group.values.map(value=>{
                        const on=selectedOptions[group.name]===value;

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={()=>chooseOption(group.name,value)}
                            aria-pressed={on}
                            className={`min-w-12 rounded-full border px-4 py-3 text-xs transition ${
                              on
                                ?'border-plum bg-plum text-white shadow-sm'
                                :'border-plum/25 bg-white text-plum hover:border-rose'
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ANCIEN SYSTÈME DE VARIANTES */}
        {hasV&&!hasOptionGroups&&(
          <div className="mt-7">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink">
              Choisissez votre variante
            </p>

            <div className="flex flex-wrap gap-2">
              {vs.map(x=>{
                const on=x.name===legacyV;

                return (
                  <button
                    key={x.name}
                    type="button"
                    onClick={()=>{
                      setLegacyV(x.name);
                      resetSelection();
                    }}
                    aria-pressed={on}
                    className={`rounded-full border px-4 py-3 text-xs transition ${
                      on
                        ?'border-plum bg-plum text-white shadow-sm'
                        :'border-plum/25 bg-white text-plum hover:border-rose'
                    }`}
                  >
                    {x.name}
                    {x.price!=null?` · ${eur(Number(x.price))}`:''}
                    {label(x)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ACHAT */}
        <div className="mt-7 space-y-3">

          {needV?(
            <p className="rounded-xl bg-blush/40 p-4 text-sm text-plum">
              {hasOptionGroups
                ?'Choisissez toutes les options pour voir les photos, le prix et la disponibilité de cette combinaison.'
                :'Choisissez une variante pour voir ses photos, son prix et sa disponibilité.'}
            </p>
          ):mode==='pre'?(
            <a href={wa('je souhaite précommander')} className={`${btn} bg-rose text-white shadow-md hover:bg-plum`}>
              Précommander sur WhatsApp
            </a>
          ):mode==='reserve'?(
            <a href={wa('je souhaite réserver')} className={`${btn} bg-rose text-white shadow-md hover:bg-plum`}>
              Réserver sur WhatsApp
            </a>
          ):mode==='notify'?(
            <a href={wa('je souhaite être prévenue du retour de')} className={`${btn} bg-rose text-white shadow-md hover:bg-plum`}>
              Me prévenir sur WhatsApp
            </a>
          ):mode==='order'?(
            <a href={wa('je souhaite commander')} className={`${btn} bg-rose text-white shadow-md hover:bg-plum`}>
              Commander sur WhatsApp
            </a>
          ):(
            <>
              {needAck&&(
                <label className="flex cursor-pointer gap-3 rounded-xl border border-plum/20 bg-blush/30 p-4 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={e=>setAck(e.target.checked)}
                    className="mt-1 accent-rose"
                  />
                  <span>
                    Je comprends que c’est une précommande et que je dois patienter {PREORDER} avant la livraison.
                  </span>
                </label>
              )}

              <button
                disabled={full||(needAck&&!ack)}
                onClick={()=>{
                  add({
                    id:p.id,
                    name:p.name,
                    price,
                    qty:1,
                    image:vph[0]||base,
                    variant:v,
                    max,
                    pre
                  });
                  setDone(true);
                }}
                className={`${btn} bg-rose text-white shadow-md hover:bg-plum`}
              >
                {full?'Stock maximum atteint':needAck?'Précommander':'Ajouter au panier'}
              </button>

              {full&&(
                <p className="text-center text-sm text-plum">
                  Vous avez déjà {inCart} article{inCart>1?'s':''} dans votre panier : c’est tout le stock disponible.
                </p>
              )}

              {done&&!full&&(
                <p className="rounded-xl bg-blush/40 p-3 text-center text-sm text-plum">
                  <span className="font-semibold">Ajouté au panier !</span>
                  {' '}
                  <a href="/panier" className="underline underline-offset-4">
                    Voir le panier
                  </a>
                </p>
              )}

              <a
                href={wa(needAck?'je souhaite précommander':'je souhaite commander')}
                className={`${btn} border border-plum/30 bg-white text-plum hover:border-plum hover:bg-blush/30`}
              >
                {needAck?'Précommander sur WhatsApp':'Commander sur WhatsApp'}
              </a>
            </>
          )}
        </div>

        {/* DESCRIPTION */}
        {p.description&&(
          <div className="mt-9 border-t border-sand pt-6">
            <h2 className="font-serif text-xl text-plum">
              Description du produit
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/75">
              {p.description}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
