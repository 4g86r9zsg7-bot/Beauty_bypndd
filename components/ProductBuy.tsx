
'use client';

import {useState,useEffect} from 'react';
import {useClient} from '@/components/ClientProvider';
import Link from 'next/link';
import Stars from '@/components/Stars';
import HeartButton from '@/components/HeartButton';
import {useCart} from '@/lib/cart';
import {WA,eur} from '@/lib/supabase';
import {DELIVERY,PREORDER} from '@/lib/shop';

const colorMap:Record<string,string>={
  noir:'#171717',black:'#171717',
  blanc:'#ffffff',white:'#ffffff',
  ivoire:'#fff8e7',ivory:'#fff8e7',
  'blanc casse':'#f5f0e6','blanc cassé':'#f5f0e6',
  rose:'#e9a0b5',pink:'#e9a0b5',
  'rose pale':'#f5c5d2','rose clair':'#f5c5d2',
  'rose poudre':'#e8c0c8','rose fuchsia':'#d62976',
  fuchsia:'#d62976',magenta:'#d62976',
  beige:'#d8c2a0',nude:'#d8b99b',champagne:'#e8d3a5',
  creme:'#f0e2c5',marron:'#795548',brown:'#795548',
  chocolat:'#593b2d',camel:'#bd966b',taupe:'#8b7768',
  caramel:'#b87943',rouge:'#c62828',red:'#c62828',
  bordeaux:'#701c35',burgundy:'#701c35',grenat:'#701c35',
  bleu:'#2874b9',blue:'#2874b9','bleu clair':'#83bde8',
  'bleu ciel':'#87ceeb','bleu marine':'#172b4d',
  marine:'#172b4d',turquoise:'#36b9b0',cyan:'#36b9d0',
  vert:'#39845b',green:'#39845b','vert clair':'#8bc59b',
  'vert olive':'#77764a',kaki:'#77764a',olive:'#77764a',
  emeraude:'#087f5b',gris:'#929292',grey:'#929292',
  gray:'#929292','gris clair':'#d4d4d4','gris fonce':'#555555',
  jaune:'#f3d34a',yellow:'#f3d34a',moutarde:'#c49b27',
  orange:'#e98735',corail:'#ef806c',violet:'#8055a5',
  purple:'#8055a5',lilas:'#c5a6d8',lavender:'#c5a6d8',
  mauve:'#a77aa9',dore:'#c5a04b',gold:'#c5a04b',
  or:'#c5a04b',argente:'#c0c0c0',argent:'#c0c0c0',
  silver:'#c0c0c0',cuivre:'#b87333',bronze:'#cd7f32',
  transparent:'#f4f0e9'
};

function normalizeColor(value:string){
  return String(value||'').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[_-]+/g,' ').replace(/\s+/g,' ');
}

function isMultiColor(value:string){
  return [
    'multicolore','multi couleur','multicolor','multicolored',
    'multicoloured','arc en ciel','rainbow','imprime multicolore'
  ].includes(normalizeColor(value));
}

function colorValue(value:string){
  const key=normalizeColor(value);

  if(isMultiColor(value)){
    return 'linear-gradient(135deg, #e53935 0%, #e53935 16%, #f5c542 16%, #f5c542 32%, #43a047 32%, #43a047 48%, #2196f3 48%, #2196f3 64%, #8055a5 64%, #8055a5 80%, #e9a0b5 80%, #e9a0b5 100%)';
  }

  if(/^#[0-9a-f]{3,8}$/i.test(key))return key;
  if(colorMap[key])return colorMap[key];

  const entries=[
    ['noir','#171717'],['black','#171717'],
    ['blanc','#ffffff'],['white','#ffffff'],
    ['rose','#e9a0b5'],['pink','#e9a0b5'],
    ['beige','#d8c2a0'],['nude','#d8b99b'],
    ['marron','#795548'],['brown','#795548'],
    ['chocolat','#593b2d'],['rouge','#c62828'],
    ['red','#c62828'],['bordeaux','#701c35'],
    ['bleu','#2874b9'],['blue','#2874b9'],
    ['marine','#172b4d'],['vert','#39845b'],
    ['green','#39845b'],['kaki','#77764a'],
    ['gris','#929292'],['grey','#929292'],
    ['gray','#929292'],['jaune','#f3d34a'],
    ['yellow','#f3d34a'],['orange','#e98735'],
    ['violet','#8055a5'],['purple','#8055a5'],
    ['lilas','#c5a6d8'],['dore','#c5a04b'],
    ['gold','#c5a04b'],['argent','#c0c0c0'],
    ['silver','#c0c0c0']
  ];

  const found=entries.find(([name])=>key.includes(name));
  return found?found[1]:'#d8c9c1';
}

function isColorGroup(name:string){
  const n=normalizeColor(name);
  return n.includes('couleur')||n.includes('color')||
    n.includes('teinte')||n.includes('shade');
}

function isSizeGroup(name:string){
  const n=normalizeColor(name);
  return n.includes('taille')||n.includes('pointure')||
    n.includes('size')||n.includes('format')||
    n.includes('volume')||n.includes('contenance');
}

function getSwatch(variant:any,value:string){
  const swatch=String(
    variant?.swatch||
    variant?.color||
    variant?.hex||
    ''
  ).trim();

  return swatch||colorValue(value);
}

function isLikelyColor(value:string){
  const key=normalizeColor(value);
  return /^#[0-9a-f]{3,8}$/i.test(key)||
    isMultiColor(value)||
    Object.prototype.hasOwnProperty.call(colorMap,key);
}

function isVariantSoldOut(variant:any){
  const status=variant?.status||'available';
  return status==='soldout'||
    (variant?.stock!=null&&Number(variant.stock)<=0&&
      !['preorder','arrival'].includes(status));
}

const INITIAL_VARIANTS=12;

export default function ProductBuy({p}:{p:any}) {
  const {add,lines}=useCart();
  const {subscribeRestock,restockStatus,restockErrors}=useClient();

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
  const [galleryOpen,setGalleryOpen]=useState(false);
  const [touchStartX,setTouchStartX]=useState<number|null>(null);
  const [done,setDone]=useState(false);
  const [ack,setAck]=useState(false);
  const [descriptionExpanded,setDescriptionExpanded]=useState(false);
  const productDescription=String(p.description??'').trim();
  const productIngredients=String(p.ingredients??'').trim();
  const productBenefits=String(p.benefits??'').trim();
  const [expandedOptionGroups,setExpandedOptionGroups]=useState<Record<string,boolean>>({});
  const [legacyExpanded,setLegacyExpanded]=useState(false);

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
      if(!group.values.includes(val))group.values.push(val);
    });
  });

  const hasOptionGroups=optionGroups.length>0;

  const allOptionsSelected=hasOptionGroups&&optionGroups.every(
    group=>Boolean(selectedOptions[group.name])
  );

  const selectedCombo=hasOptionGroups&&allOptionsSelected
    ?vs.find(x=>
        x.options&&optionGroups.every(
          group=>String(x.options[group.name]??'')===selectedOptions[group.name]
        )
      )
    :null;

  const v=hasOptionGroups?(selectedCombo?.name||''):legacyV;
  const cur=hasOptionGroups?selectedCombo:vs.find(x=>x.name===legacyV);

  const vph=vimgs(cur);
  const thumbs=vph.length>0?vph:gen;
  const shown=(pic&&thumbs.includes(pic)?pic:null)||vph[0]||base;
  const shownIndex=Math.max(0,thumbs.indexOf(shown));
  const changePhoto=(direction:number)=>{
    if(thumbs.length<2)return;
    setPic(thumbs[(shownIndex+direction+thumbs.length)%thumbs.length]);
  };
  const handleSwipeEnd=(endX:number)=>{
    if(touchStartX===null)return;
    const delta=endX-touchStartX;
    if(Math.abs(delta)>45)changePhoto(delta<0?1:-1);
    setTouchStartX(null);
  };

  useEffect(()=>{
    if(!galleryOpen)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==='Escape')setGalleryOpen(false);
      if(event.key==='ArrowRight')changePhoto(1);
      if(event.key==='ArrowLeft')changePhoto(-1);
    };
    window.addEventListener('keydown',onKeyDown);
    return ()=>{
      document.body.style.overflow=previousOverflow;
      window.removeEventListener('keydown',onKeyDown);
    };
  },[galleryOpen,shownIndex,thumbs.length]);

  const availableVariants=vs.filter((x:any)=>{
    if(!x||typeof x!=='object')return false;
    const status=x.status||'available';
    if(status==='soldout')return false;
    if(status==='preorder'||status==='arrival')return true;
    const parentReservable=p.availability==='preorder'||p.availability==='arrival';
    return ['available','last'].includes(status)&&(x.stock==null||Number(x.stock)>0||parentReservable);
  });
  const availablePrices=availableVariants.map((x:any)=>Number(x.price??p.price)).filter((n:number)=>Number.isFinite(n)&&n>0);
  const startPrice=availablePrices.length?Math.min(...availablePrices):Number(p.price);
  const hasPriceRange=!cur&&availablePrices.length>1&&Math.max(...availablePrices)!==Math.min(...availablePrices);
  const price=cur
    ?Number(cur.price??p.price)
    :(availablePrices.length?startPrice:Number(p.price));
  const promo=cur?.price==null&&p.old_price&&p.old_price>price;

  const pre=p.availability==='preorder';
  const arrival=p.availability==='arrival';
  const hasV=vs.length>0;
  const vst:string=cur?(cur.status||'available'):'';

  let mode:'cart'|'pre'|'reserve'|'order'|'notify'='cart';

  if(hasV&&cur){
    if(vst==='arrival')mode='reserve';
    else if(vst==='preorder')mode='pre';
    else if(vst==='soldout')mode='notify';
    else if(cur.stock!=null&&cur.stock<=0&&!pre)mode='pre';
    else if(arrival)mode='order';
  }else if(!hasV){
    if(p.availability==='soldout'||(!pre&&!arrival&&p.stock<=0))mode='notify';
    else if(arrival)mode='reserve';
  }

  const left=cur?.stock??p.stock;
  const max=(pre||mode==='pre'||mode==='reserve')?null:(left??null);

  const inCart=(lines||[]).find(
    (l:any)=>l.id===p.id&&l.variant===v
  )?.qty||0;

  const full=max!=null&&inCart>=max;
  const needV=hasV&&!cur;
  const restockKey=`${p.id}:${v||''}`;
  const needAck=mode==='pre'||mode==='reserve'||(pre&&mode==='cart');

  const status=mode==='reserve'
    ?{label:'Prochain arrivage',detail:'Réservation possible directement sur le site',tone:'blue',icon:'calendar'}
    :mode==='pre'||needAck
    ?{label:'Précommande',detail:`Délai estimé : ${PREORDER}`,tone:'amber',icon:'clock'}
    :mode==='notify'
    ?{label:'Épuisé',detail:'Actuellement indisponible',tone:'red',icon:'x'}
    :(vst==='last'||(left!=null&&left>0&&left<=3))
    ?{label:'Stock limité',detail:'Dernières pièces disponibles',tone:'amber',icon:'alert'}
    :{label:'En stock',detail:`Disponible immédiatement · livraison ${DELIVERY}`,tone:'green',icon:'check'};

  const label=(x:any)=>{
    const s=x.status||'available';
    return s==='arrival'?' · arrivage'
      :s==='preorder'?' · précommande'
      :s==='soldout'?' · épuisé'
      :(!pre&&!arrival&&x.stock!=null&&x.stock<=0)?' · précommande':'';
  };

  const waQuestion=()=>
    `https://wa.me/${WA}?text=${encodeURIComponent(
      [
        'Bonjour BeautyByPND ! J’ai une question au sujet de ce produit :',
        `Produit : ${p.name}`,
        v?`Variante : ${v}`:null,
        p.slug?`Lien : https://beautybypnd.com/produit/${p.slug}`:null,
        '',
        'Ma question :'
      ].filter(Boolean).join('\n')
    )}`;

  const shareProduct=async()=>{
    const productUrl=`https://beautybypnd.com/produit/${p.slug}`;
    const shareText=[
      `Découvrez ${p.name} chez BeautyByPND !`,
      `Prix : ${eur(price)}`,
      v?`Variante : ${v}`:null,
      'Retrouvez la photo et tous les détails du produit en ouvrant ce lien :',
      productUrl
    ].filter(Boolean).join('\n');

    if(typeof navigator!=='undefined'&&typeof navigator.share==='function'){
      try{
        await navigator.share({title:p.name,text:shareText,url:productUrl});
        return;
      }catch(error:any){
        if(error?.name==='AbortError')return;
      }
    }

    window.location.href=`https://wa.me/?text=${encodeURIComponent(shareText)}`;
  };
  const resetSelection=()=>{
    setPic(null);
    setDone(false);
    setAck(false);
  };

  const chooseOption=(groupName:string,value:string)=>{
    setSelectedOptions(previous=>({...previous,[groupName]:value}));
    resetSelection();
  };

  const btn="flex w-full items-center justify-center rounded-full py-4 px-5 text-xs tracking-[0.16em] uppercase font-semibold transition duration-300 active:scale-[0.98] disabled:opacity-40";
  const note="mt-4 rounded-2xl border border-plum/20 bg-blush/40 p-4 text-sm leading-relaxed";

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 md:grid-cols-2 md:gap-12 md:px-8 md:py-12">

      {/* GALERIE PHOTOS */}
      <div className="min-w-0 md:sticky md:top-24 md:self-start">
        <div className="relative overflow-hidden rounded-2xl border border-sand/70 bg-white shadow-sm">
          <button type="button" onClick={()=>setGalleryOpen(true)}
            onTouchStart={event=>setTouchStartX(event.touches[0]?.clientX??null)}
            onTouchEnd={event=>handleSwipeEnd(event.changedTouches[0]?.clientX??0)}
            aria-label="Agrandir la photo du produit"
            className="group relative block aspect-[4/5] w-full cursor-zoom-in bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose">
            {shown&&(
              <img src={shown} alt={p.name}
                loading="eager" fetchPriority="high" decoding="async"
                draggable={false}
                className="h-full w-full bg-white object-contain transition duration-500 group-hover:scale-[1.02]"/>
            )}
            {thumbs.length>0&&(
              <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-[#14040c]/75 px-3 py-2 text-[10px] font-semibold tracking-wider text-white shadow-sm backdrop-blur-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>
                </svg>
                {shownIndex+1} / {thumbs.length}
              </span>
            )}
            <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-plum shadow-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5M10.8 7.8v6M7.8 10.8h6"/>
              </svg>
              Agrandir
            </span>
          </button>
          <HeartButton id={p.id}/>
        </div>

        {thumbs.length>1&&(
          <div className="mt-3 flex items-center justify-center gap-4">
            <button type="button" aria-label="Photo précédente" onClick={()=>changePhoto(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-plum/20 bg-white text-plum shadow-sm transition hover:border-rose hover:bg-blush/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
            </button>
            <span className="rounded-full bg-blush/40 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-plum">
              {shownIndex+1} / {thumbs.length}
            </span>
            <button type="button" aria-label="Photo suivante" onClick={()=>changePhoto(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-plum/20 bg-white text-plum shadow-sm transition hover:border-rose hover:bg-blush/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

        {thumbs.length>1&&(
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {thumbs.map((u,i)=>(
              <button key={u} type="button" onClick={()=>setPic(u)}
                aria-label={`Voir la photo ${i+1}`}
                aria-pressed={u===shown}
                className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose ${
                  u===shown?'border-rose shadow-md ring-1 ring-rose/20':'border-sand opacity-80 hover:border-plum/40 hover:opacity-100'
                }`}>
                <img src={u} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain bg-white"/>
                {u===shown&&<span className="absolute inset-x-1 bottom-1 h-0.5 rounded-full bg-rose"/>}
              </button>
            ))}
          </div>
        )}

        {galleryOpen&&(
          <div role="dialog" aria-modal="true" aria-label={`Galerie photos de ${p.name}`}
            onClick={()=>setGalleryOpen(false)}
            onTouchStart={event=>setTouchStartX(event.touches[0]?.clientX??null)}
            onTouchEnd={event=>handleSwipeEnd(event.changedTouches[0]?.clientX??0)}
            className="fixed inset-0 z-[1000] flex flex-col bg-white/[0.98] p-3 backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-xs font-medium uppercase tracking-[0.16em] text-plum">{p.name}</span>
              <button type="button" aria-label="Fermer la galerie" onClick={()=>setGalleryOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-plum/15 bg-white text-plum shadow-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m18 6-12 12M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center py-4" onClick={event=>event.stopPropagation()}>
              {shown&&<img src={shown} alt={p.name} loading="lazy" decoding="async" draggable={false} className="max-h-full max-w-full select-none object-contain"/>}
              {thumbs.length>1&&(
                <>
                  <button type="button" aria-label="Photo précédente" onClick={()=>changePhoto(-1)}
                    className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-plum/15 bg-white/95 text-plum shadow-md sm:left-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
                  </button>
                  <button type="button" aria-label="Photo suivante" onClick={()=>changePhoto(1)}
                    className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-plum/15 bg-white/95 text-plum shadow-md sm:right-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 pb-2">
              <span className="rounded-full bg-blush/50 px-4 py-2 text-xs font-medium tracking-wider text-plum">{shownIndex+1} / {thumbs.length}</span>
            </div>
            {thumbs.length>1&&(
              <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                {thumbs.map((u,i)=>(
                  <button key={u} type="button" onClick={event=>{event.stopPropagation();setPic(u);}}
                    aria-label={`Afficher la photo ${i+1}`} aria-pressed={u===shown}
                    className={`h-14 w-12 shrink-0 overflow-hidden rounded-lg border-2 bg-white p-0.5 ${
                      u===shown?'border-rose':'border-sand opacity-70'
                    }`}>
                    <img src={u} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain"/>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-sand pt-5 text-center">
          <div><span className="text-lg">♡</span><p className="mt-1 text-[10px] uppercase tracking-wider text-ink/60">Sélection beauté</p></div>
          <div><span className="text-lg">✧</span><p className="mt-1 text-[10px] uppercase tracking-wider text-ink/60">Qualité & soin</p></div>
          <div><span className="text-lg">♧</span><p className="mt-1 text-[10px] uppercase tracking-wider text-ink/60">Service client</p></div>
        </div>
      </div>

      {/* INFORMATIONS PRODUIT */}
      <div className="min-w-0 md:pt-4">

        {p.brands?.name&&(
          <Link href={`/categorie/tous?brand=${p.brand_id}`}
            className="inline-block text-xs font-semibold uppercase tracking-[0.22em] text-plum underline decoration-rose/50 underline-offset-4">
            {p.brands.name}
          </Link>
        )}

        <h1 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">{p.name}</h1>

        <button type="button"
          onClick={shareProduct}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-plum/25 bg-white px-4 py-2.5 text-xs font-semibold tracking-wide text-plum transition hover:border-plum hover:bg-blush/30 active:scale-[0.98]"
          aria-label={`Partager ${p.name}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4"/>
          </svg>
          Partager ce produit
        </button>

        {p.rating_count>0?(
          <a href="#avis" className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#C6A15B]/35 bg-[#FCF8F5] px-3.5 py-2 text-sm text-plum transition hover:border-[#C6A15B] hover:bg-[#FCF4F0]">
            <Stars v={p.rating_avg} size={18}/>
            <span className="font-semibold">{Number(p.rating_avg).toFixed(1)}</span>
            <span className="text-ink/60">· {p.rating_count} avis</span>
            <span aria-hidden="true" className="ml-1 text-[#98783b]">↓</span>
          </a>
        ):(
          <a href="#avis" className="mt-4 inline-flex items-center gap-2 rounded-full border border-plum/15 bg-white px-3.5 py-2 text-xs text-plum transition hover:border-rose hover:bg-blush/20">
            <Stars v={0} size={17}/>
            <span>Soyez la première personne à donner votre avis</span>
            <span aria-hidden="true" className="ml-1 text-[#98783b]">↓</span>
          </a>
        )}

        <div className="mt-5 rounded-2xl border border-sand bg-[#fcf9f8] p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1.5">
            <span className="font-serif text-3xl leading-none text-plum">{hasPriceRange?`À partir de ${eur(price)}`:eur(price)}</span>
            {promo&&(
              <s className="pb-0.5 text-sm text-ink/40">{eur(p.old_price)}</s>
            )}
            {promo&&(
              <span className="mb-0.5 rounded-full bg-plum px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
                -{Math.round(100-price/p.old_price*100)}%
              </span>
            )}
          </div>
          {promo&&(
            <p className="mt-2 text-xs font-medium text-plum">
              Vous économisez {Math.round(Number(p.old_price)-price)} DH sur ce produit.
            </p>
          )}
          {hasPriceRange&&(
            <p className="mt-2 text-xs leading-relaxed text-ink/55">
              Le prix varie selon l’option choisie.
            </p>
          )}
        </div>

        {!needV&&(
          <div className={`mt-4 flex flex-col gap-1.5 rounded-xl border p-3.5 ${
            status.tone==='green'?'border-green-200 bg-green-50/80':
            status.tone==='amber'?'border-amber-200 bg-amber-50/80':
            status.tone==='blue'?'border-sky-200 bg-sky-50/80':
            'border-red-200 bg-red-50/80'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                status.tone==='green'?'bg-green-100 text-green-700':
                status.tone==='amber'?'bg-amber-100 text-amber-700':
                status.tone==='blue'?'bg-sky-100 text-sky-700':
                'bg-red-100 text-red-700'
              }`}>
                {status.tone==='green'?(
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>
                ):status.tone==='amber'?(
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                ):status.tone==='blue'?(
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                ):(
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>
                )}
              </span>
              <span className={`text-sm font-semibold ${
                status.tone==='green'?'text-green-800':
                status.tone==='amber'?'text-amber-800':
                status.tone==='blue'?'text-sky-800':
                'text-red-800'
              }`}>{status.label}</span>
            </div>
            <p className={`pl-8 text-xs leading-relaxed ${
              status.tone==='green'?'text-green-800/80':
              status.tone==='amber'?'text-amber-800/80':
              status.tone==='blue'?'text-sky-800/80':
              'text-red-800/80'
            }`}>{status.detail}</p>
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
            {' '}Ajoutez-le à votre panier pour finaliser votre réservation sur le site. Nous vous prévenons par WhatsApp dès sa réception.
          </div>
        )}

        {!needV&&mode==='notify'&&(
          <div className={note}>
            <b className="text-plum">Épuisé.</b>
            {' '}Inscrivez-vous gratuitement pour recevoir une notification dès que cet article sera de nouveau disponible.
          </div>
        )}

        {/* VARIANTES AVEC OPTIONS */}
        {hasOptionGroups&&(
          <div className="mt-7 space-y-6">
            {optionGroups.map(group=>{
              const colorGroup=isColorGroup(group.name);
              const sizeGroup=isSizeGroup(group.name);
              const expanded=Boolean(expandedOptionGroups[group.name]);
              const hiddenCount=Math.max(0,group.values.length-INITIAL_VARIANTS);
              const visibleValues=colorGroup&&!expanded
                ?group.values.slice(0,INITIAL_VARIANTS)
                :group.values;

              return (
                <div key={group.name}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                    {group.name}
                    {selectedOptions[group.name]&&(
                      <span className="ml-2 font-normal normal-case tracking-normal text-plum">
                        : {selectedOptions[group.name]}
                      </span>
                    )}
                  </p>

                  {colorGroup?(
                    <div className="flex flex-wrap items-start gap-x-5 gap-y-4">
                      {visibleValues.map(value=>{
                        const on=selectedOptions[group.name]===value;
                        const matching=vs.filter(x=>
                          String(x.options?.[group.name]??'')===value
                        );
                        // Evaluate each option across all its real variants.
                        // This lets shoppers change another option when their current
                        // size/color combination does not exist or is sold out.
                        const unavailable=matching.length>0&&matching.every(isVariantSoldOut);
                        const exists=matching.length>0;
                        const representative=matching[0]||vs.find(x=>
                          String(x.options?.[group.name]??'')===value
                        );
                        const swatch=getSwatch(representative,value);

                        return (
                          <button key={value} type="button"
                            title={unavailable?value+' — épuisé':value}
                            aria-label={`Couleur ${value}${unavailable?' — épuisé':''}`}
                            aria-pressed={on}
                            disabled={!exists}
                            onClick={()=>chooseOption(group.name,value)}
                            className="group flex min-w-[64px] flex-col items-center gap-2 px-1 py-1 text-center transition disabled:cursor-not-allowed disabled:opacity-35">
                            <span className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white p-[3px] transition ${
                              on?'border-rose ring-2 ring-rose/20 ring-offset-2'
                              :unavailable?'border-sand'
                              :'border-transparent group-hover:border-plum/40'
                            }`}>
                              <span className="h-full w-full rounded-full border border-black/10"
                                style={{background:swatch}}/>
                              {on&&(
                                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/15 text-white">
                                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m5 12 4 4L19 6"/>
                                  </svg>
                                </span>
                              )}
                              {unavailable&&(
                                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                  <span className="h-[2px] w-12 rotate-[-45deg] rounded-full bg-ink/70"/>
                                </span>
                              )}
                            </span>
                            <span className={`max-w-full break-words text-[10px] leading-tight ${
                              on?'font-semibold text-plum':'text-ink/80'
                            }`}>{value}</span>
                            {unavailable&&<span className="text-[9px] text-ink/45">Épuisé</span>}
                          </button>
                        );
                      })}
                    </div>
                    ):( 
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      {group.values.map(value=>{
                        const on=selectedOptions[group.name]===value;
                        const matching=vs.filter(x=>
                          String(x.options?.[group.name]??'')===value
                        );
                        // Evaluate each option across all its real variants.
                        // This lets shoppers change another option when their current
                        // size/color combination does not exist or is sold out.
                        const unavailable=matching.length>0&&matching.every(isVariantSoldOut);
                        const exists=matching.length>0;
                        return (
                          <button key={value} type="button"
                            onClick={()=>chooseOption(group.name,value)}
                            disabled={!exists}
                            aria-pressed={on}
                            className={`relative min-h-12 min-w-0 rounded-xl border px-3 py-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-30 sm:min-w-12 sm:px-4 ${
                              on?'border-plum bg-plum text-white shadow-sm'
                              :unavailable?'border-sand bg-sand/20 text-ink/45'
                              :'border-plum/25 bg-white text-plum hover:border-rose'
                            }`}>
                            <span className={unavailable?'line-through':''}>{value}</span>
                            {unavailable&&<span className="ml-1 block text-[9px] no-underline">Épuisé</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {allOptionsSelected&&!selectedCombo&&(
              <p role="status" className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
                Cette combinaison n’est pas disponible. Choisissez une autre taille ou couleur.
              </p>
            )}
          </div>
        )}

        {/* ANCIEN SYSTÈME DE VARIANTES */}
        {hasV&&!hasOptionGroups&&(
          <div className="mt-7">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink">
              Choisissez votre variante
            </p>

            <div className={`grid gap-2 ${
              vs.length>6
                ?'grid-cols-4 sm:grid-cols-5'
                :'grid-cols-3 sm:grid-cols-4'
            }`}>
              {(legacyExpanded?vs:vs.slice(0,INITIAL_VARIANTS)).map(x=>{
                const on=x.name===legacyV;
                const image=vimgs(x)[0];
                const colorVariant=isLikelyColor(String(x.name||''));
                const unavailable=isVariantSoldOut(x);

                return (
                  <button key={x.name} type="button"
                    disabled={unavailable}
                    onClick={()=>{
                      setLegacyV(x.name);
                      resetSelection();
                    }}
                    aria-pressed={on}
                    aria-label={`${x.name}${unavailable?' — épuisé':''}`}
                    className={colorVariant
                      ?`flex min-w-0 flex-col items-center gap-2 rounded-xl border px-1.5 py-3 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        on?'border-rose bg-blush/35 shadow-sm'
                        :'border-plum/10 bg-white hover:border-plum/35 hover:shadow-sm'
                      }`
                      :`flex min-w-0 flex-col items-center overflow-hidden rounded-xl border bg-white p-2 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        on?'border-plum bg-blush/30 shadow-sm ring-1 ring-plum/20'
                        :'border-plum/15 hover:border-rose'
                      }`}>
                    {colorVariant?(
                      <>
                        <span className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white p-[3px] transition ${
                          on?'border-rose ring-2 ring-rose/20 ring-offset-2'
                          :'border-transparent'
                        }`}>
                          <span className="h-full w-full rounded-full border border-black/10"
                            style={{background:getSwatch(x,x.name||'')}}/>
                          {on&&<span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/15 text-white"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg></span>}
                          {unavailable&&<span className="absolute inset-0 flex items-center justify-center"><span className="h-[2px] w-12 rotate-[-45deg] rounded-full bg-ink/70"/></span>}
                        </span>
                        <span className={`max-w-full break-words text-[10px] leading-tight ${on?'font-semibold text-plum':'text-ink/80'}`}>{x.name}</span>
                        {x.price!=null&&<span className="text-[9px] font-medium text-plum">{eur(Number(x.price))}</span>}
                        {unavailable&&<span className="text-[9px] text-ink/45">Épuisé</span>}
                      </>
                    ):(
                      <>
                        <span className={`relative block aspect-square w-full overflow-hidden rounded-lg ${
                          on?'ring-2 ring-rose ring-offset-1':''
                        }`}>
                          {image?(
                            <img src={image} alt={x.name} loading="lazy" decoding="async" className="h-full w-full scale-[1.18] object-contain bg-white"/>
                          ):(
                            <span className="block h-full w-full" style={{background:getSwatch(x,x.name||'')}}/>
                          )}
                          {on&&<span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-plum text-white shadow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg></span>}
                        </span>
                        <span className={`mt-1.5 w-full break-words text-[10px] leading-tight ${on?'font-semibold text-plum':'text-ink/80'}`}>{x.name}</span>
                        {x.price!=null&&<span className="mt-1 text-[10px] text-plum">{eur(Number(x.price))}</span>}
                        {label(x)&&<span className="mt-1 text-[9px] text-ink/50">{label(x).trim()}</span>}
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {vs.length>INITIAL_VARIANTS&&(
              <button type="button"
                onClick={()=>setLegacyExpanded(value=>!value)}
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-plum underline decoration-rose/50 underline-offset-4">
                {legacyExpanded
                  ?'Voir moins'
                  :`Voir toutes les variantes (${vs.length})`}
                <span>{legacyExpanded?'↑':'↓'}</span>
              </button>
            )}
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
          ):mode==='notify'?(
            <div className="space-y-2">
              <button type="button"
                onClick={()=>{subscribeRestock(p.id,v||null);}}
                disabled={Boolean(restockStatus[restockKey])}
                className={`${btn} ${restockStatus[restockKey]?'border border-rose/30 bg-blush text-plum':'bg-rose text-white shadow-md hover:bg-plum'}`}>
                {restockStatus[restockKey]?'Alerte activée ✓':'Me prévenir du retour en stock'}
              </button>
              {restockErrors[restockKey]&&<p role="alert" className="text-center text-xs text-red-700">{restockErrors[restockKey]}</p>}
              {restockStatus[restockKey]&&<p className="text-center text-xs text-ink/60">Vous recevrez une notification dans votre espace client dès le retour de cet article.</p>}
            </div>
          ):(
            <>
              {needAck&&(
                <label className="flex cursor-pointer gap-3 rounded-xl border border-plum/20 bg-blush/30 p-4 text-sm leading-relaxed">
                  <input type="checkbox" checked={ack}
                    onChange={e=>setAck(e.target.checked)}
                    className="mt-1 accent-rose"/>
                  <span>
                    {mode==='reserve'?'Je comprends que cet article sera disponible au prochain arrivage.':'Je comprends que c’est une précommande et que je dois patienter '+PREORDER+' avant la livraison.'}
                  </span>
                </label>
              )}

              <button disabled={full||(needAck&&!ack)}
                onClick={()=>{
                  add({
                    id:p.id,name:p.name,price,qty:1,
                    image:vph[0]||base,variant:v,max,pre:mode==='reserve'?false:needAck
                  });
                  setDone(true);
                }}
                className={`${btn} bg-rose text-white shadow-md hover:bg-plum`}>
                {full?'Stock maximum atteint':mode==='reserve'?'Réserver sur le site':needAck?'Précommander':'Ajouter au panier'}
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
                  <a href="/panier" className="underline underline-offset-4">Voir le panier</a>
                </p>
              )}


            </>
          )}
        </div>

        <a href={waQuestion()} className="group mt-3 flex w-full items-center gap-3 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/[0.06] px-4 py-3 text-left transition hover:border-[#25D366]/40 hover:bg-[#25D366]/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-[#159D50]">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.52 3.48A11.82 11.82 0 0 0 12.08 0C5.53 0 .2 5.33.2 11.88c0 2.1.55 4.16 1.6 5.98L.1 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.15-3.45-8.44ZM12.09 21.78a9.86 9.86 0 0 1-5.02-1.37l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 1 1 8.36 4.62Zm5.41-7.38c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.68-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.07-.8.38-.28.3-1.05 1.02-1.05 2.48s1.08 2.88 1.23 3.08c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.13-.28-.2-.58-.35Z"/>
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-plum">Une question sur ce produit ?</span>
            <span className="mt-0.5 block text-xs text-ink/60">Notre équipe vous répond sur WhatsApp</span>
          </span>
          <svg className="shrink-0 text-plum/45 transition group-hover:translate-x-0.5 group-hover:text-plum" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </a>

        {productBenefits&&(
          <section className="mt-6 rounded-2xl border border-rose/20 bg-blush/20 p-5 sm:p-6">
            <h2 className="font-serif text-xl text-plum">
              Bénéfices
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/75">
              {productBenefits}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-ink/50">
              Bénéfices communiqués par le fabricant. Consultez l’emballage pour les informations et précautions les plus récentes.
            </p>
          </section>
        )}

        {productIngredients&&(
          <section className="mt-6 rounded-2xl border border-sand bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl text-plum">
              Ingrédients
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/75">
              {productIngredients}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-ink/50">
              Consultez l’emballage du produit pour la liste la plus récente et les éventuelles précautions d’utilisation.
            </p>
          </section>
        )}

        {/* DESCRIPTION REPLIABLE */}
        {productDescription&&(
          <section className="mt-9 rounded-2xl border border-sand bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl text-plum">
              Description du produit
            </h2>

            <div className="relative mt-3">
              <p className={`whitespace-pre-line text-sm leading-7 text-ink/75 ${
                descriptionExpanded?'':'line-clamp-4'
              }`}>
                {productDescription}
              </p>
            </div>

            {productDescription.length>220&&(
              <button type="button"
                onClick={()=>setDescriptionExpanded(value=>!value)}
                aria-expanded={descriptionExpanded}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-plum underline decoration-rose/50 underline-offset-4 hover:text-rose">
                {descriptionExpanded?'Voir moins':'Voir plus'}
                <span>{descriptionExpanded?'↑':'↓'}</span>
              </button>
            )}
          </section>
        )}

      </div>
    </div>
  );
}