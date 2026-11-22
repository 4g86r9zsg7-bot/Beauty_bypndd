'use client';
import {useEffect,useState} from 'react';
import {supabase,eur} from '@/lib/supabase';

const TAGS:[string,string][]=[['','Aucune'],['visage','Routine visage'],['cheveux','Routine cheveux'],['maquillage','Routine maquillage'],['coffret','Coffret'],['special','Offre spéciale']];
const EMPTY:any={id:'',kind:'pack',title:'',description:'',image_url:'',tag:'',pack_price:'',buy_qty:'3',discount_type:'percent',discount_value:'10',starts_at:'',ends_at:'',stock:'',active:true};
const slug=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const pad=(n:number)=>String(n).padStart(2,'0');
const loc=(iso?:string|null)=>{if(!iso)return '';const d=new Date(iso);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`};
// Seules les variantes « objet » (avec stock/prix) sont gérées par la base ; les variantes en simple texte sont ignorées.
const vlist=(p:any):any[]=>(Array.isArray(p?.variants)?p.variants:[]).filter((x:any)=>x&&typeof x==='object');
const vnames=(p:any):string[]=>vlist(p).map((x:any)=>x.name).filter(Boolean);
const uprice=(p:any,v?:string|null)=>Number(vlist(p).find((x:any)=>x.name===v)?.price??p?.price??0);
const status=(o:any)=>{const n=Date.now();if(!o.active)return 'Désactivée';if(o.starts_at&&new Date(o.starts_at).getTime()>n)return 'Programmée';if(o.ends_at&&new Date(o.ends_at).getTime()<=n)return 'Expirée';if(o.stock!=null&&o.stock-o.sold<=0)return 'Épuisée';return 'En ligne'};

export default function Offres(){
  const [offers,setOffers]=useState<any[]>([]);const [prods,setProds]=useState<any[]>([]);
  const [f,setF]=useState<any>(EMPTY);const [items,setItems]=useState<any[]>([]);const [q,setQ]=useState('');
  const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);const [open,setOpen]=useState(false);

  const load=async()=>{
    const [o,p]=await Promise.all([
      supabase.from('offers').select('*, offer_items(id,product_id,variant,qty)').order('created_at',{ascending:false}),
      supabase.from('products').select('id,name,price,variants,active').eq('active',true).order('name'),
    ]);
    if(o.error)setMsg('Impossible de charger les offres : '+o.error.message);
    setOffers(o.data||[]);setProds(p.data||[]);
  };
  useEffect(()=>{load()},[]);
  const pm=new Map(prods.map((p:any)=>[p.id,p]));

  const set=(k:string)=>(e:any)=>setF({...f,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value});
  const reset=()=>{setF(EMPTY);setItems([]);setQ('');setOpen(false)};
  const startNew=()=>{setF(EMPTY);setItems([]);setQ('');setOpen(true);setMsg('');window.scrollTo({top:0,behavior:'smooth'})};
  const startEdit=(o:any)=>{
    setF({id:o.id,kind:o.kind,title:o.title,description:o.description||'',image_url:o.image_url||'',tag:o.tag||'',pack_price:o.pack_price??'',buy_qty:String(o.buy_qty??3),discount_type:o.discount_type||'percent',discount_value:o.discount_value??'10',starts_at:loc(o.starts_at),ends_at:loc(o.ends_at),stock:o.stock??'',active:o.active});
    setItems((o.offer_items||[]).map((x:any)=>({product_id:x.product_id,variant:x.variant,qty:x.qty})));
    setQ('');setOpen(true);setMsg('');window.scrollTo({top:0,behavior:'smooth'});
  };

  const addItem=(p:any)=>{if(items.some(i=>i.product_id===p.id))return;setItems([...items,{product_id:p.id,variant:vnames(p)[0]||null,qty:1}]);setQ('')};
  const upItem=(i:number,patch:any)=>setItems(items.map((x,j)=>j===i?{...x,...patch}:x));

  const isPack=f.kind==='pack';const isVariantDiscount=f.kind==='variant_discount';
  const value=items.reduce((s,it)=>s+uprice(pm.get(it.product_id),it.variant)*(it.qty||1),0);
  const ppNum=Number(String(f.pack_price).replace(',','.'));
  const saving=isPack&&isFinite(ppNum)&&ppNum>0?value-ppNum:0;

  // Image : recadrée automatiquement au format 4:3 (1200 x 900), en JPG léger
  async function prep(file:File):Promise<Blob>{const bm=await createImageBitmap(file);const W=1200,H=900;const r=Math.max(W/bm.width,H/bm.height);const w=bm.width*r,h=bm.height*r;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');if(!g)throw new Error('Navigateur non compatible');g.fillStyle='#fff';g.fillRect(0,0,W,H);g.drawImage(bm,(W-w)/2,(H-h)/2,w,h);return await new Promise<Blob>((ok,ko)=>cv.toBlob(b=>b?ok(b):ko(new Error('Conversion impossible')),'image/jpeg',0.86))}
  async function upImg(file?:File){
    if(!file)return;if(!file.type.startsWith('image/')){setMsg('Choisissez une image (JPG, PNG ou WebP).');return}
    setBusy(true);setMsg('Envoi de l’image…');
    try{const blob=await prep(file);const path=`offers/${Date.now()}.jpg`;
      const {error}=await supabase.storage.from('product-images').upload(path,blob,{contentType:'image/jpeg',cacheControl:'31536000'});
      if(error){setMsg('Envoi impossible (êtes-vous connectée sur /admin ?) : '+error.message);setBusy(false);return}
      setF((cur:any)=>({...cur,image_url:supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl}));setMsg('Image ajoutée. Pensez à enregistrer l’offre.');
    }catch(e:any){setMsg('Image illisible : '+(e?.message||'format non pris en charge'))}
    setBusy(false);
  }

  async function save(){
    setMsg('');const t=f.title.trim();
    if(!t)return setMsg('Donnez un titre à l’offre.');
    if(!items.length)return setMsg('Ajoutez au moins un produit.');
    let pp:number|null=null,bq:number|null=null;let discountValue:number|null=null;
    if(isPack){
      pp=Number(String(f.pack_price).replace(',','.'));
      if(!isFinite(pp)||pp<=0)return setMsg('Indiquez le prix du pack.');
      if(items.reduce((s,i)=>s+(i.qty||1),0)<2)return setMsg('Un pack contient au moins 2 articles.');
      for(const it of items){const p=pm.get(it.product_id);if(vnames(p).length&&!it.variant)return setMsg(`Choisissez la variante de « ${p?.name} ».`)}
    }else if(isVariantDiscount){
      discountValue=Number(String(f.discount_value).replace(',','.'));
      if(!isFinite(discountValue)||discountValue<=0)return setMsg('Indiquez une réduction supérieure à zéro.');
      if(f.discount_type==='percent'&&discountValue>90)return setMsg('La réduction en pourcentage ne peut pas dépasser 90 %.');
    }else{
      bq=Number(f.buy_qty);if(!Number.isInteger(bq)||bq<1)return setMsg('Indiquez le nombre de produits achetés (par exemple 2 ou 3).');
    }
    if(f.starts_at&&f.ends_at&&new Date(f.ends_at)<=new Date(f.starts_at))return setMsg('La date de fin doit être après la date de début.');
    let st:number|null=null;if(f.stock!==''){st=Number(f.stock);if(!Number.isInteger(st)||st<0)return setMsg('La quantité disponible doit être un nombre entier.')}
    setBusy(true);
    const row:any={kind:f.kind,title:t,description:f.description.trim()||null,image_url:f.image_url||null,tag:f.tag||null,pack_price:pp,buy_qty:bq,discount_type:isVariantDiscount?f.discount_type:'percent',discount_value:discountValue,
      starts_at:f.starts_at?new Date(f.starts_at).toISOString():null,ends_at:f.ends_at?new Date(f.ends_at).toISOString():null,stock:st,active:!!f.active};
    let id=f.id;
    if(id){const {error}=await supabase.from('offers').update(row).eq('id',id);if(error){setBusy(false);return setMsg('Enregistrement impossible : '+error.message)}}
    else{const {data,error}=await supabase.from('offers').insert({...row,slug:slug(t)+'-'+Math.random().toString(36).slice(2,6)}).select('id').single();if(error||!data){setBusy(false);return setMsg('Enregistrement impossible : '+(error?.message||'erreur'))}id=data.id}
    const d=await supabase.from('offer_items').delete().eq('offer_id',id);
    if(d.error){setBusy(false);return setMsg('Produits non enregistrés : '+d.error.message)}
    const ins=await supabase.from('offer_items').insert(items.map(it=>({offer_id:id,product_id:it.product_id,variant:isPack?(it.variant||null):null,qty:isPack?Math.max(1,Number(it.qty)||1):1})));
    setBusy(false);
    if(ins.error)return setMsg('Produits non enregistrés : '+ins.error.message);
    setMsg('Offre enregistrée.');reset();load();
  }
  async function del(o:any){if(!confirm(`Supprimer l’offre « ${o.title} » ?`))return;const {error}=await supabase.from('offers').delete().eq('id',o.id);setMsg(error?error.message:'Offre supprimée');load()}
  async function toggle(o:any){const {error}=await supabase.from('offers').update({active:!o.active}).eq('id',o.id);setMsg(error?error.message:o.active?'Offre désactivée':'Offre activée');load()}

  const inp="w-full rounded-xl border border-sand bg-white px-3 py-2.5 text-sm";
  const hits=q.trim().length>=2?prods.filter((p:any)=>p.name.toLowerCase().includes(q.trim().toLowerCase())&&!items.some(i=>i.product_id===p.id)).slice(0,8):[];

  return <div className="mx-auto max-w-2xl space-y-4">
    <h1 className="font-serif text-3xl">Packs &amp; Offres exclusives</h1>
    <p className="text-xs">Connectez-vous d’abord sur <a href="/admin" className="underline">/admin</a>, puis revenez ici. Les offres en ligne s’affichent sur <a href="/offres" className="underline">/offres</a>.</p>
    {msg&&<p className="rounded-xl bg-white p-3 text-sm">{msg}</p>}

    {!open&&<button type="button" onClick={startNew} className="w-full rounded-full bg-rose py-3 text-xs uppercase tracking-[0.2em] text-white">+ Nouvelle offre</button>}

    {open&&<section className="space-y-3 border border-sand bg-white p-4">
      <h2 className="font-serif text-2xl text-plum">{f.id?'Modifier l’offre':'Nouvelle offre'}</h2>
      <label className="block text-xs">Type d’offre
        <select value={f.kind} onChange={set('kind')} className={`${inp} mt-1`}><option value="pack">Pack à prix fixe (plusieurs produits)</option><option value="buy_x_get_1">X achetés = 1 offert (le moins cher est offert)</option><option value="variant_discount">Variante supplémentaire à prix réduit</option></select></label>
      <label className="block text-xs">Titre<input value={f.title} onChange={set('title')} placeholder={isPack?'Routine éclat visage':'3 achetés = 1 offert'} className={`${inp} mt-1`}/></label>
      <label className="block text-xs">Description (facultatif)<textarea rows={2} value={f.description} onChange={set('description')} className={`${inp} mt-1`}/></label>
      <label className="block text-xs">Catégorie de l’offre<select value={f.tag} onChange={set('tag')} className={`${inp} mt-1`}>{TAGS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
      {isVariantDiscount?<div className="grid grid-cols-2 gap-3"><label className="block text-xs">Type de réduction<select value={f.discount_type} onChange={set('discount_type')} className={`${inp} mt-1`}><option value="percent">Pourcentage (%)</option><option value="amount">Montant fixe (DH)</option></select></label><label className="block text-xs">Réduction {f.discount_type==='percent'?'(%)':'(DH)'}<input inputMode="decimal" value={f.discount_value} onChange={set('discount_value')} className={`${inp} mt-1`}/></label><p className="col-span-2 rounded-xl bg-blush/40 p-3 text-xs">La première unité du produit reste au prix normal. Chaque unité supplémentaire du même produit bénéficie de cette réduction.</p></div>:isPack
        ?<label className="block text-xs">Prix du pack (DH)<input inputMode="decimal" value={f.pack_price} onChange={set('pack_price')} placeholder="Ex : 399" className={`${inp} mt-1`}/></label>
        :<label className="block text-xs">Nombre de produits achetés (le suivant, le moins cher, est offert)<select value={f.buy_qty} onChange={set('buy_qty')} className={`${inp} mt-1`}><option value="2">2 achetés = 1 offert (pour 3 produits)</option><option value="3">3 achetés = 1 offert (pour 4 produits)</option><option value="1">1 acheté = 1 offert (pour 2 produits)</option></select></label>}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs">Début (facultatif)<input type="datetime-local" value={f.starts_at} onChange={set('starts_at')} className={`${inp} mt-1`}/></label>
        <label className="block text-xs">Fin (facultatif)<input type="datetime-local" value={f.ends_at} onChange={set('ends_at')} className={`${inp} mt-1`}/></label>
      </div>
      <label className="block text-xs">{isPack?'Quantité de packs disponibles':'Nombre maximum de produits offerts'} (vide = illimité)<input inputMode="numeric" value={f.stock} onChange={set('stock')} className={`${inp} mt-1`}/></label>

      <div className="text-xs">Image (facultatif)
        <div className="mt-1 flex items-center gap-3">{f.image_url&&<img src={f.image_url} alt="" className="h-16 w-20 rounded-md object-cover"/>}
          <label className={`cursor-pointer rounded-full border border-plum px-4 py-2 text-plum ${busy?'opacity-50':''}`}>{f.image_url?'Changer l’image':'Ajouter une image'}<input type="file" accept="image/*" disabled={busy} className="hidden" onChange={e=>{upImg(e.target.files?.[0]);e.target.value=''}}/></label>
          {f.image_url&&<button type="button" onClick={()=>setF({...f,image_url:''})} className="underline">Retirer</button>}</div></div>

      <div className="text-xs"><p>Produits {isPack?'du pack':'concernés par l’offre'}</p>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un produit à ajouter" className={`${inp} mt-1`}/>
        {hits.length>0&&<ul className="mt-1 divide-y divide-sand rounded-xl border border-sand">{hits.map((p:any)=><li key={p.id}><button type="button" onClick={()=>addItem(p)} className="flex w-full justify-between gap-2 px-3 py-2 text-left text-sm"><span className="truncate">{p.name}</span><span className="shrink-0 text-plum">+ Ajouter</span></button></li>)}</ul>}
        <div className="mt-2 space-y-2">{items.map((it,i)=>{const p:any=pm.get(it.product_id);const vs=vnames(p);return <div key={it.product_id} className="rounded-xl border border-sand p-3 text-sm">
          <div className="flex items-start justify-between gap-2"><span className="font-medium">{p?.name||'Produit introuvable'}</span><button type="button" onClick={()=>setItems(items.filter((_,j)=>j!==i))} className="shrink-0 text-xs text-red-700 underline">Retirer</button></div>
          {isPack&&<div className="mt-2 flex flex-wrap items-center gap-2">
            {vs.length>0&&<select value={it.variant||''} onChange={e=>upItem(i,{variant:e.target.value||null})} className="rounded-lg border border-sand px-2 py-1.5">{vs.map(v=><option key={v} value={v}>{v}</option>)}</select>}
            <label className="flex items-center gap-1">Quantité<input type="number" min={1} value={it.qty} onChange={e=>upItem(i,{qty:Math.max(1,Number(e.target.value)||1)})} className="w-16 rounded-lg border border-sand px-2 py-1.5"/></label>
            <span className="text-ink/60">{eur(uprice(p,it.variant))} l’unité</span></div>}
        </div>})}</div>
      </div>

      {isPack&&items.length>0&&<div className="rounded-xl bg-blush/40 p-3 text-sm">
        <p>Valeur des produits : <b>{eur(value)}</b></p>
        {ppNum>0&&<p>{saving>0?<>Économie affichée aux clientes : <b className="text-plum">{eur(saving)}</b> ({Math.round(saving/value*100)} %)</>:<span className="text-red-700">Le prix du pack n’est pas inférieur à la valeur des produits : aucune économie ne sera affichée.</span>}</p>}</div>}

      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.active} onChange={set('active')}/>Offre active (visible sur le site)</label>
      <div className="flex gap-2"><button type="button" disabled={busy} onClick={save} className="flex-1 rounded-full bg-rose py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-50">{busy?'Enregistrement…':'Enregistrer'}</button><button type="button" onClick={reset} className="rounded-full border border-plum px-5 py-3 text-xs uppercase tracking-[0.2em] text-plum">Annuler</button></div>
    </section>}

    <section className="border border-sand bg-white p-4"><h2 className="mb-3 font-serif text-2xl text-plum">Mes offres</h2>
      {!offers.length&&<p className="text-sm text-ink/60">Aucune offre pour le moment.</p>}
      {offers.map((o:any)=>{const s=status(o);const rest=o.stock!=null?o.stock-o.sold:null;return <div key={o.id} className="border-t border-sand py-3 text-sm first:border-0">
        <div className="flex items-start justify-between gap-2"><span><b>{o.title}</b><span className="block text-xs text-ink/60">{o.kind==='pack'?`Pack · ${eur(o.pack_price)}`:o.kind==='variant_discount'?`Variante supplémentaire · ${o.discount_type==='amount'?eur(o.discount_value):`${o.discount_value}%`} de réduction`:`${o.buy_qty} achetés = 1 offert`} · ${(o.offer_items||[]).length} produit(s)</span></span>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${s==='En ligne'?'bg-green-100 text-green-800':'bg-sand text-ink/70'}`}>{s}</span></div>
        <p className="mt-1 text-xs text-ink/60">{o.starts_at?`Du ${new Date(o.starts_at).toLocaleString('fr-FR')} `:''}{o.ends_at?`au ${new Date(o.ends_at).toLocaleString('fr-FR')}`:'Sans date de fin'}{rest!=null?` · Reste : ${Math.max(rest,0)}`:''}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs"><button type="button" onClick={()=>startEdit(o)} className="underline">Modifier</button><button type="button" onClick={()=>toggle(o)} className="underline">{o.active?'Désactiver':'Activer'}</button><button type="button" onClick={()=>del(o)} className="text-red-700 underline">Supprimer</button></div></div>})}
    </section></div>}
