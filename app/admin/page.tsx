

'use client';

import {useEffect,useState} from 'react';
import {supabase,eur} from '@/lib/supabase';
import AdminHome from '@/components/AdminHome';
import ProductImporter from '@/components/admin/ProductImporter';
import OptimizeProductImages from '@/components/admin/OptimizeProductImages';
import {prepareProductImage} from '@/lib/prepareProductImage';

const ST=['pending','confirmed','preparing','shipped','delivered','cancelled'];
const SL:any={pending:'En attente',confirmed:'Confirmée',preparing:'En préparation',shipped:'En livraison',delivered:'Livrée',cancelled:'Annulée'};
const NEXT:Record<string,[string,string][]>={
  pending:[['confirmed','Confirmer'],['cancelled','Annuler']],
  confirmed:[['preparing','En préparation'],['cancelled','Annuler']],
  preparing:[['shipped','En livraison'],['cancelled','Annuler']],
  shipped:[['delivered','Livrée'],['cancelled','Annuler']],
  delivered:[],
  cancelled:[['pending','Remettre en attente']]
};

const NMSG:Record<string,string>={
  confirmed:'Votre commande a bien été confirmée.',
  preparing:'Votre commande est actuellement en préparation.',
  shipped:'Votre commande est en cours de livraison.',
  delivered:'Votre commande a bien été livrée. Nous vous remercions pour votre confiance.',
  cancelled:'Votre commande a été annulée. Contactez-nous pour toute question.'
};

const waNum=(t:string)=>{
  const d=String(t||'').replace(/\D/g,'');
  return d.startsWith('0')?'212'+d.slice(1):d;
};

// Validation des couleurs enregistrées pour les carrés de teintes.
const cleanSwatch=(value:any):string=>{
  if(typeof value!=='string')return '';

  const color=value.trim();

  if(
    /^#[0-9a-f]{3,4}$/i.test(color)||
    /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color)||
    /^rgba?\([\d\s.,%/]+\)$/i.test(color)||
    /^hsla?\([\d\s.,%/deg]+\)$/i.test(color)
  ){
    return color;
  }

  return '';
};

const toHexColor=(value:any):string=>{
  const color=cleanSwatch(value);

  if(/^#[0-9a-f]{6}$/i.test(color))return color;

  if(/^#[0-9a-f]{3}$/i.test(color)){
    return '#'+color.slice(1).split('').map(c=>c+c).join('');
  }

  return '#ffffff';
};

// Création du message WhatsApp personnalisé.
// Aucun numéro de commande n'est communiqué au client.
const createWhatsAppMessage=(o:any)=>{
  const firstName=String(o.name||'').trim().split(/\s+/)[0]||'';
  const items=Array.isArray(o.items)?o.items:[];
  const hasPreorder=items.some((i:any)=>i.preorder===true);

  const details=items.length
    ?items.map((i:any)=>{
      const qty=Math.max(1,Number(i.qty)||1);
      const name=String(i.name||'Article');
      const variant=i.variant?` (${i.variant})`:'';
      const amount=Number(i.price||0)*qty;

      return `- ${qty} × ${name}${variant} : ${eur(amount)}`;
    }).join('\n')
    :'- Détail des articles indisponible';

  let message=`Bonjour ${firstName},\n\n`;

  if(o.status==='confirmed'){
    message+=hasPreorder
      ?'Nous vous confirmons que votre précommande a bien été validée.\n\n'
      :'Nous vous confirmons que votre commande a bien été validée.\n\n';
  }else{
    message+=(NMSG[o.status]||'Nous vous informons de la mise à jour de votre commande.')+'\n\n';
  }

  message+=`Récapitulatif de votre commande :\n${details}\n\n`;
  message+=`Montant total : ${eur(Number(o.total)||0)}\n\n`;

  if(o.status==='confirmed'){
    if(hasPreorder){
      message+='Délai estimé de réception : 2 à 3 semaines.\n\n';
      message+='Nous vous tiendrons informée dès réception de votre commande afin d’organiser la livraison.\n\n';
    }else{
      message+='Délai de livraison estimé : 24 à 48 heures.\n\n';
    }
  }

  message+='Nous vous remercions pour votre confiance.\n\nBeautyByPND';

  return message;
};

const toRows=(p:any)=>(p?.variants||[]).map((x:any)=>
  typeof x==='string'
    ?{
      name:x,
      stock:p.stock||0,
      status:'available',
      price:'',
      images:[],
      files:[],
      options:null,
      sku:'',
      mpn:'',
      swatch:''
    }
    :{
      name:x.name||'',
      stock:x.stock??0,
      status:x.status||'available',
      price:x.price??'',
      images:x.images||(x.image?[x.image]:[]),
      files:[],
      options:x.options||null,
      sku:x.sku||'',
      mpn:x.mpn||'',
      swatch:cleanSwatch(x.swatch)||''
    }
);

const hasObjVars=(p:any)=>
  Array.isArray(p.variants)&&p.variants.some((x:any)=>typeof x==='object');

const normalizeBrand=(value:any)=>
  String(value||'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .trim();

const PREMIUM_BRANDS=[
  'charlotte tilbury','dior','gisou','givenchy','grande cosmetics',
  'kayali','narciso rodriguez','olaplex','rituals',
  'sol de janeiro','valentino','ysl','jean paul gaultier','jean paul gautier'
];

const LOW_PRICE_BRANDS=[
  'action','carmex','cien','deliplus','e l f','got2b','innovit',
  'mercadona','primark','shein','vaseline'
];

const KNOWN_BRANDS=[
  'aldo','anua','arencia','babyliss','bath body works','beauty of joseon',
  'benefit cosmetics','bershka','calvin klein','celimax','centella',
  'guess','huda beauty','kerastase','kiko milano','marvis','medicube',
  'mielle','nature s bounty','nyx','panoxyl','real techniques','remington',
  'skin1004','some by mi','the ordinary','victoria s secret','zara'
];

const getBrandRange=(name:any):string=>{
  const normalized=normalizeBrand(name);
  if(!normalized)return '';
  if(LOW_PRICE_BRANDS.includes(normalized))return 'petit_prix';
  if(PREMIUM_BRANDS.includes(normalized))return 'premium';
  if(KNOWN_BRANDS.includes(normalized))return 'marques';
  return '';
};



const autoAv=(av:string,n:number)=>
  ['available','last','soldout'].includes(av)
    ?(n<=0?'soldout':n<=3?'last':'available')
    :av;

const getOptionGroups=(p:any)=>{
  const groups:{name:string;values:string[]}[]=[];

  (p?.variants||[]).forEach((v:any)=>{
    if(!v?.options||typeof v.options!=='object')return;

    Object.entries(v.options).forEach(([name,value])=>{
      if(value==null||String(value).trim()==='')return;

      let group=groups.find(g=>g.name===name);

      if(!group){
        group={name,values:[]};
        groups.push(group);
      }

      if(!group.values.includes(String(value))){
        group.values.push(String(value));
      }
    });
  });

  return groups.map(g=>({
    name:g.name,
    values:g.values.join(', ')
  }));
};

export default function Admin(){
  const [ok,setOk]=useState<boolean|null>(null);
  const [em,setEm]=useState('');
  const [pw,setPw]=useState('');
  const [tab,setTab]=useState('home');
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [passwordBusy,setPasswordBusy]=useState(false);
  const [passwordMessage,setPasswordMessage]=useState('');

  const [orders,setO]=useState<any[]>([]);
  const [prods,setP]=useState<any[]>([]);
  const [cats,setC]=useState<any[]>([]);
  const [brands,setB]=useState<any[]>([]);
  const [msg,setMsg]=useState('');

  const [edit,setEdit]=useState<any>(null);
  const [importedProduct,setImportedProduct]=useState<any>(null);
  const [formVersion,setFormVersion]=useState(0);
  const [commercialRange,setCommercialRange]=useState('');
  const [imgs,setImgs]=useState<string[]>([]);
  const [search,setSearch]=useState('');
  const [flt,setFlt]=useState('all');
  const [vrows,setVrows]=useState<any[]>([]);
  const [optionGroups,setOptionGroups]=useState<any[]>([]);
  const [busyId,setBusyId]=useState('');
  const [savingProduct,setSavingProduct]=useState(false);

  const [revs,setRevs]=useState<any[]>([]);
  const [promos,setPromos]=useState<any[]>([]);
  const [activity,setActivity]=useState<any[]>([]);
  const [pf,setPf]=useState<any>({kind:'percent',active:true});
  const [of,setOf]=useState('all');
  const [oq,setOq]=useState('');
  const [fb,setFb]=useState('');
  const [fc,setFc]=useState('');
  const [sortProducts,setSortProducts]=useState('recent');
  const [bulkSelected,setBulkSelected]=useState<string[]>([]);
  const [bulkDrafts,setBulkDrafts]=useState<any>({});
  const [bulkBusy,setBulkBusy]=useState(false);

  async function check(){
    const {data:{user}}=await supabase.auth.getUser();

    if(!user)return setOk(false);

    const {data}=await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id',user.id)
      .maybeSingle();

    setOk(!!data);

    if(data)load();
  }

  async function load(){
    const [o,p,c,b]=await Promise.all([
      supabase.from('orders').select('*').order('created_at',{ascending:false}),
      supabase.from('products').select('*,brands(name)').order('created_at',{ascending:false}),
      supabase.from('categories').select('*'),
      supabase.from('brands').select('*')
    ]);

    setO(o.data||[]);
    setP(p.data||[]);
    setC(c.data||[]);
    setB(b.data||[]);

    const rv=await supabase
      .from('reviews')
      .select('*,products(name)')
      .order('created_at',{ascending:false});

    setRevs(rv.data||[]);

    const pc=await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at',{ascending:false});

    setPromos(pc.data||[]);

    const al=await supabase.from('admin_activity_logs').select('*').order('created_at',{ascending:false}).limit(100);
    setActivity(al.data||[]);
  }

  async function logActivity(action:string,entityType:string,entityId:string|null,label:string,details:any={}){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return;
    await supabase.from('admin_activity_logs').insert({admin_user_id:user.id,action,entity_type:entityType,entity_id:entityId,entity_label:label,details});
  }

  useEffect(()=>{check()},[]);

  useEffect(()=>{
    try{
      const t=new URLSearchParams(window.location.search).get('tab');

      if(t&&['home','orders','products','reviews','promos','new'].includes(t)){
        setTab(t);
      }
    }catch{}
  },[]);

  useEffect(()=>{
    if(!ok)return;

    const t=setInterval(()=>{load()},30000);

    return()=>clearInterval(t);
  },[ok]);

  async function changeAdminPassword(e:any){
    e.preventDefault();
    setPasswordMessage('');

    if(newPassword.length<10){
      setPasswordMessage('Le nouveau mot de passe doit contenir au moins 10 caractères.');
      return;
    }

    if(newPassword!==confirmPassword){
      setPasswordMessage('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setPasswordBusy(true);

    try{
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError||!user?.email)throw new Error('Session administrateur introuvable. Reconnecte-toi puis réessaie.');

      const {data:admin,error:adminError}=await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id',user.id)
        .maybeSingle();

      if(adminError||!admin)throw new Error('Accès refusé : ce compte ne possède pas les droits administrateur.');

      const {data:verified,error:verifyError}=await supabase.auth.signInWithPassword({
        email:user.email,
        password:currentPassword
      });

      if(verifyError||verified.user?.id!==user.id){
        throw new Error('Le mot de passe actuel est incorrect.');
      }

      const {error:updateError}=await supabase.auth.updateUser({password:newPassword});
      if(updateError)throw updateError;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Mot de passe administrateur modifié avec succès.');
    }catch(error:any){
      setPasswordMessage(error?.message||'Impossible de modifier le mot de passe. Réessaie.');
    }finally{
      setPasswordBusy(false);
    }
  }

  async function login(e:any){
    e.preventDefault();

    const {error}=await supabase.auth.signInWithPassword({
      email:em,
      password:pw
    });

    if(error)setMsg(error.message);
    else check();
  }

  if(ok===null)return <p>Chargement…</p>;

  if(!ok){
    return (
      <form onSubmit={login} className="max-w-sm mx-auto space-y-3">
        <h1 className="font-serif text-3xl">Administration</h1>
        <input
          type="email"
          required
          placeholder="Email"
          value={em}
          onChange={e=>setEm(e.target.value)}
          className="w-full border p-3"
        />
        <input
          type="password"
          required
          placeholder="Mot de passe"
          value={pw}
          onChange={e=>setPw(e.target.value)}
          className="w-full border p-3"
        />
        <button className="w-full bg-ink text-white py-3">
          Se connecter
        </button>
        <p className="text-sm text-red-700">{msg}</p>
      </form>
    );
  }

  const revenue=orders
    .filter(o=>o.status==='delivered')
    .reduce((s,o)=>s+Number(o.total),0);

  const norm=(x:string)=>
    (x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  const filteredProducts=prods.filter(p=>
    (!search||norm(`${p.name} ${p.brands?.name||''} ${p.source_name||''} ${p.slug||''}`).includes(norm(search)))&&
    (!fb||p.brand_id===fb)&&
    (!fc||p.category_id===fc)&&
    (
      flt==='all'||
      (flt==='out'&&p.availability==='soldout')||
      (flt==='hidden'&&!p.active)||
      (flt==='stock'&&p.availability!=='soldout'&&p.active)||
      (flt==='preorder'&&p.availability==='preorder')||
      (flt==='arrival'&&p.availability==='arrival')||
      (flt==='noimage'&&(!Array.isArray(p.images)||p.images.length===0))||
      (flt==='nodesc'&&(!String(p.description||'').trim()))||
      (flt==='petit_prix'&&p.commercial_range==='petit_prix')||
      (flt==='marques'&&p.commercial_range==='marques')||
      (flt==='premium'&&p.commercial_range==='premium')||
      (flt==='new'&&!!p.is_new)||
      (flt==='bestseller'&&!!p.is_bestseller)||
      (flt==='featured'&&!!p.featured)||
      (flt==='promo'&&Number(p.old_price)>Number(p.price))||
      (flt==='lowstock'&&p.active&&!['preorder','arrival','soldout'].includes(p.availability)&&Number(p.stock)>0&&Number(p.stock)<=3)||
      (flt==='variants'&&Array.isArray(p.variants)&&p.variants.length>0)||
      (flt==='novariants'&&(!Array.isArray(p.variants)||p.variants.length===0))
    )
  );
  const shown=[...filteredProducts].sort((a,b)=>{
    if(sortProducts==='name_asc')return String(a.name||'').localeCompare(String(b.name||''),'fr');
    if(sortProducts==='name_desc')return String(b.name||'').localeCompare(String(a.name||''),'fr');
    if(sortProducts==='price_asc')return Number(a.price||0)-Number(b.price||0);
    if(sortProducts==='price_desc')return Number(b.price||0)-Number(a.price||0);
    if(sortProducts==='stock_asc')return Number(a.stock||0)-Number(b.stock||0);
    if(sortProducts==='stock_desc')return Number(b.stock||0)-Number(a.stock||0);
    if(sortProducts==='oldest')return new Date(a.created_at||0).getTime()-new Date(b.created_at||0).getTime();
    return new Date(b.created_at||0).getTime()-new Date(a.created_at||0).getTime();
  });

  const changeStatus=async(id:string,status:string)=>{
    if(busyId)return;

    if(
      status==='cancelled'&&
      !confirm('Annuler cette commande ? Le stock sera remis si elle avait été confirmée.')
    )return;

    setBusyId(id);

    const {error}=await supabase.rpc('set_order_status',{
      p_id:id,
      p_status:status
    });

    setBusyId('');

    setMsg(error?error.message:`Statut mis à jour : ${SL[status]}`);
    if(!error){const order=orders.find(o=>o.id===id);await logActivity('Changement de statut','commande',id,order?.name||'Commande',{status});}

    await load();
  };

  const shownO=orders.filter(o=>
    (of==='all'||o.status===of)&&
    (!oq||norm(`${o.number} ${o.name} ${o.phone} ${o.city}`).includes(norm(oq)))
  );

  const lowS=prods.filter(p=>
    p.active&&
    !['preorder','arrival','soldout'].includes(p.availability)&&
    p.stock>0&&
    p.stock<=3
  );

  const outS=prods.filter(p=>p.active&&p.availability==='soldout');

  const exportCsv=()=>{
    const r=[
      ['N','Date','Client','Tel','Ville','Adresse','Total','Statut'],
      ...orders.map(o=>[
        o.number,o.created_at,o.name,o.phone,o.city,o.address,o.total,o.status
      ])
    ];

    const a=document.createElement('a');

    a.href=URL.createObjectURL(
      new Blob([
        r.map(x=>
          x.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')
        ).join('\n')
      ],{type:'text/csv'})
    );

    a.download='commandes.csv';
    a.click();
  };

  // Importation du produit et de ses variantes, couleurs comprises.
  const importProduct=(product:any)=>{
    const normalize=(value:string)=>
      (value||'')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g,'')
        .trim();

    const matchedBrand=brands.find(
      (b:any)=>normalize(b.name)===normalize(product.brand||'')
    );

    const parseImportedOptions=(v:any)=>{
      if(v?.options&&typeof v.options==='object'&&!Array.isArray(v.options)){
        return v.options;
      }

      const name=String(v?.name||'').trim();
      const value=String(v?.value||'').trim();

      if(name&&value&&name.toLowerCase()!==value.toLowerCase()){
        return {[name]:value};
      }

      const text=value||name;
      const options:any={};

      text.split(/[·|]/).forEach((part:string)=>{
        const pieces=part.split(/[:=]/);

        if(pieces.length>=2){
          const key=pieces.shift()?.trim();
          const val=pieces.join(':').trim();

          if(key&&val)options[key]=val;
        }
      });

      if(!Object.keys(options).length&&text){
        options['Option']=text;
      }

      return Object.keys(options).length?options:null;
    };

    const importedVariants=(Array.isArray(product.variants)?product.variants:[])
      .map((v:any,i:number)=>{
        const options=parseImportedOptions(v);

        const variantName=String(
          v?.value||
          v?.name||
          (options
            ?Object.entries(options).map(([k,val])=>`${k} : ${val}`).join(' · ')
            :`Variante ${i+1}`)
        );

        const currency=String(v?.currency||product.currency||'').toUpperCase();

        const price=['MAD','DH','DHS'].includes(currency)
          ?v?.price??''
          :'';

        return {
          name:variantName,
          stock:Math.max(0,Number(v?.stock)||0),
          status:v?.status||'available',
          price,
          images:Array.isArray(v?.images)
            ?v.images
            :(v?.image?[v.image]:[]),
          files:[],
          options,
          sku:v?.sku||'',
          mpn:v?.mpn||'',
          swatch:cleanSwatch(v?.swatch)||''
        };
      });

    setImportedProduct({
      ...product,
      brand_id:matchedBrand?.id||'',
      price:
        ['MAD','DH','DHS'].includes(
          String(product.currency||'').toUpperCase()
        )
          ?product.price??''
          :''
    });

    setCommercialRange(getBrandRange(matchedBrand?.name||product.brand));
    setImgs(Array.isArray(product.images)?product.images:[]);
    setVrows(importedVariants);
    setOptionGroups(getOptionGroups({variants:importedVariants}));
    setFormVersion(v=>v+1);

    setMsg(
      importedVariants.length
        ?`Import réussi : ${importedVariants.length} variante(s) détectée(s). Vérifie les informations et les couleurs avant d'enregistrer.`
        :matchedBrand
          ?`Import réussi. Marque reconnue : ${matchedBrand.name}. Vérifie le formulaire.`
          :'Import réussi. Vérifie les informations et sélectionne la marque manuellement.'
    );
  };

  const resetNew=()=>{
    setEdit(null);
    setCommercialRange('');
    setImgs([]);
    setVrows([]);
    setOptionGroups([]);
    setImportedProduct(null);
    setFormVersion(v=>v+1);
    setMsg('');
  };

  // Génération automatique de toutes les combinaisons.
  // La couleur existante est conservée pour chaque teinte correspondante.
  const generateCombinations=()=>{
    const groups=optionGroups
      .map(g=>({
        name:String(g.name||'').trim(),
        values:String(g.values||'')
          .split(',')
          .map((v:string)=>v.trim())
          .filter(Boolean)
      }))
      .filter(g=>g.name&&g.values.length);

    if(groups.length<2){
      setMsg('Ajoute au moins deux groupes d’options, par exemple Couleur et Taille.');
      return;
    }

    if(groups.length>5){
      setMsg('Tu peux créer jusqu’à 5 groupes d’options.');
      return;
    }

    const total=groups.reduce((n,g)=>n*g.values.length,1);

    if(total>200){
      setMsg('Trop de combinaisons. Réduis le nombre de valeurs.');
      return;
    }

    const combinations:any[]=[];

    const build=(index:number,selected:any)=>{
      if(index===groups.length){
        const name=groups
          .map(g=>`${g.name} : ${selected[g.name]}`)
          .join(' · ');

        const old=vrows.find(r=>
          r.options&&
          groups.every(g=>String(r.options[g.name]||'')===selected[g.name])
        );

        const colorGroup=groups.find(g=>
          /couleur|color|teinte|shade/i.test(g.name)
        );

        const matchingColorVariant=colorGroup
          ?vrows.find(r=>
            cleanSwatch(r.swatch)&&
            String(r.options?.[colorGroup.name]||'')===selected[colorGroup.name]
          )
          :null;

        combinations.push({
          name,
          options:{...selected},
          stock:old?.stock??0,
          status:old?.status||'available',
          price:old?.price??'',
          images:old?.images||[],
          files:old?.files||[],
          sku:old?.sku||'',
          mpn:old?.mpn||'',
          swatch:cleanSwatch(old?.swatch||matchingColorVariant?.swatch)||''
        });

        return;
      }

      const group=groups[index];

      group.values.forEach(value=>{
        build(index+1,{
          ...selected,
          [group.name]:value
        });
      });
    };

    build(0,{});

    setVrows(combinations);
    setMsg(`${combinations.length} combinaison(s) générée(s). Les couleurs correspondantes ont été conservées lorsque disponibles. Configure maintenant leur stock et leurs prix.`);
  };

  async function saveProduct(e:any){
    e.preventDefault();

    if(savingProduct)return;

    const form=e.currentTarget as HTMLFormElement;
    const fd=new FormData(form);

    const configuredGroups=optionGroups
      .map(g=>({
        name:String(g.name||'').trim(),
        values:String(g.values||'')
          .split(',')
          .map((v:string)=>v.trim())
          .filter(Boolean)
      }))
      .filter(g=>g.name&&g.values.length);

    if(configuredGroups.length>0&&!vrows.some(r=>r.options)){
      setMsg('Clique d’abord sur « Générer les combinaisons » avant d’enregistrer.');
      return;
    }

    setSavingProduct(true);
    setMsg('Enregistrement du produit…');

    try{
      // Limite les traitements simultanés pour éviter de ralentir ou saturer
      // le navigateur lorsque plusieurs photos/variantes sont sélectionnées.
      let activeUploads=0;
      const uploadQueue:Array<()=>void>=[];
      const withUploadSlot=async<T,>(task:()=>Promise<T>):Promise<T>=>{
        if(activeUploads>=3){
          await new Promise<void>(resolve=>uploadQueue.push(resolve));
        }
        activeUploads++;
        try{
          return await task();
        }finally{
          activeUploads--;
          uploadQueue.shift()?.();
        }
      };

      const upload=async(file:File):Promise<string>=>withUploadSlot(async()=>{
        const prepared=await prepareProductImage(file);
        const safeName=file.name
          .replace(/\.[^.]+$/,'')
          .replace(/[^\w-]/g,'_')
          .slice(0,60)||'photo';
        const path=`products/${Date.now()}-${Math.random().toString(36).slice(2,10)}-${safeName}.${prepared.extension}`;

        const {error}=await supabase.storage
          .from('product-images')
          .upload(path,prepared.blob,{
            contentType:prepared.contentType,
            cacheControl:'31536000'
          });

        if(error)throw new Error(`Impossible d’enregistrer la photo « ${file.name} » : ${error.message}`);

        return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
      });

      const imageFiles=Array.from(
        (form.elements.namedItem('images') as HTMLInputElement)?.files||[]
      ) as File[];

      // Envoi simultané des photos générales pour réduire nettement l’attente.
      const urls:string[]=await Promise.all(imageFiles.map(upload));

      const name=String(fd.get('name')||'').trim();
      if(!name)throw new Error('Le nom du produit est obligatoire.');

      const vars:any[]=await Promise.all(vrows.map(async(r:any)=>{
        if(!String(r.name).trim())return null;

        // Les photos de chaque variante sont également envoyées ensemble.
        const ups:string[]=await Promise.all((r.files||[]).map(upload));
        const vi=[...(r.images||[]),...ups];
        const o:any={
          name:String(r.name).trim(),
          stock:Math.max(0,parseInt(String(r.stock))||0),
          status:r.status||'available'
        };

        if(r.options&&typeof r.options==='object')o.options=r.options;
        if(r.sku)o.sku=String(r.sku);
        if(r.mpn)o.mpn=String(r.mpn);

        const swatch=cleanSwatch(r.swatch);
        if(swatch)o.swatch=swatch;

        const pr=parseFloat(String(r.price).replace(',','.'));
        if(String(r.price).trim()!==''&&isFinite(pr))o.price=pr;

        if(vi.length){
          o.images=vi;
          o.image=vi[0];
        }

        return o;
      })).then(rows=>rows.filter(Boolean));

      const general=[...imgs,...urls];
      let stock=Number(fd.get('stock')||0);

      if(vars.length){
        stock=vars
          .filter((x:any)=>['available','last'].includes(x.status))
          .reduce((s:number,x:any)=>s+x.stock,0);
      }

      let av=autoAv(String(fd.get('av')),stock);

      if(vars.length){
        av=stock>0
          ?(stock<=3?'last':'available')
          :vars.some((x:any)=>x.status==='arrival')
          ?'arrival'
          :vars.some((x:any)=>
            x.status==='preorder'||
            (['available','last'].includes(x.status)&&x.stock<=0)
          )
          ?'preorder'
          :'soldout';
      }

      const row:any={
        name,
        brand_id:fd.get('brand')||null,
        source_name:String(fd.get('source_name')||'').trim()||null,
        commercial_range:fd.get('commercial_range')||null,
        category_id:fd.get('cat')||null,
        description:fd.get('desc'),
        ingredients:String(fd.get('ingredients')||'').trim()||null,
        benefits:String(fd.get('benefits')||'').trim()||null,
        price:Number(fd.get('price')),
        old_price:fd.get('old')?Number(fd.get('old')):null,
        stock,
        availability:av,
        variants:vars,
        is_new:fd.get('new')==='on',
        is_bestseller:fd.get('best')==='on',
        featured:fd.get('feat')==='on',
        images:general.length
          ?general
          :(vars.find((x:any)=>x.image)?[vars.find((x:any)=>x.image).image]:[])
      };

      const slug=name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g,'')
        .replace(/[^a-z0-9]+/g,'-')+
        '-'+Date.now().toString(36);

      const {error}=edit
        ?await supabase.from('products').update(row).eq('id',edit.id)
        :await supabase.from('products').insert({...row,slug});

      if(error)throw error;

      // L’historique est secondaire : son indisponibilité ne doit jamais
      // bloquer la confirmation ni laisser le formulaire en attente.
      void logActivity(
        edit?'Modification produit':'Création produit',
        'produit',
        edit?.id||null,
        name,
        {availability:av,stock}
      ).catch(()=>{});

      resetNew();
      setTab('products');
      setMsg(edit?'Produit modifié avec succès.':'Produit ajouté avec succès.');

      // Après l’enregistrement, ne recharge que les produits.
      // load() recharge aussi commandes, avis, promos et historique inutilement ici.
      void Promise.resolve(
        supabase
          .from('products')
          .select('*,brands(name)')
          .order('created_at',{ascending:false})
          .then(({data,error})=>{
            if(error)throw error;
            setP(data||[]);
          })
      ).catch(()=>{
        setMsg('Produit enregistré avec succès. La liste n’a pas pu être actualisée ; actualise la page pour le retrouver.');
      });
    }catch(error:any){
      setMsg(error?.message||'Une erreur est survenue pendant l’enregistrement. Vérifie ta connexion puis réessaie.');
    }finally{
      setSavingProduct(false);
    }
  }

  const startEdit=(p:any)=>{
    setEdit(p);
    setCommercialRange(p.commercial_range||getBrandRange(p.brands?.name||brands.find((b:any)=>b.id===p.brand_id)?.name));
    setImportedProduct(null);
    setVrows(toRows(p));
    setOptionGroups(getOptionGroups(p));
    setImgs(p.images||[]);
    setMsg('');
    setTab('new');
    setFormVersion(v=>v+1);
  };

  const setV=(i:number,patch:any)=>
    setVrows(previous=>previous.map((r,j)=>j===i?{...r,...patch}:r));

  const toggleRev=async(id:string,published:boolean)=>{
    const review=revs.find(r=>r.id===id);
    const {error}=await supabase.from('reviews').update({published}).eq('id',id);
    if(!error)await logActivity(published?'Publication avis':'Masquage avis','avis',id,review?.name||'Avis',{published});
    load();
  };

  const delRev=async(id:string)=>{
    if(confirm('Supprimer cet avis ?')){
      const review=revs.find(r=>r.id===id);
      const {error}=await supabase.from('reviews').delete().eq('id',id);
      if(!error)await logActivity('Suppression avis','avis',id,review?.name||'Avis');
      load();
    }
  };

  const ld=(x:string)=>{
    const d=new Date(x);

    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const savePromo=async(e:any)=>{
    e.preventDefault();

    const code=String(pf.code||'').trim().toUpperCase();
    const v=parseFloat(String(pf.value).replace(',','.'));

    if(!code||!(v>0)){
      setMsg('Code ou valeur invalide');
      return;
    }

    const targetType=pf.target_type||'all';
    const targetId=targetType==='all'?null:pf.target_id||null;
    if(targetType!=='all'&&!targetId){setMsg('Choisis la cible de ce code promo.');return;}
    if(targetType==='variant'&&!pf.target_variant){setMsg('Choisis aussi la variante concernée.');return;}

    const row:any={
      code,
      kind:pf.kind,
      target_type:targetType,
      target_id:targetId,
      target_variant:targetType==='variant'?pf.target_variant:null,
      percent:pf.kind==='percent'?Math.min(90,Math.round(v)):null,
      amount:pf.kind==='fixed'?v:null,
      starts_at:pf.starts?new Date(pf.starts+'T00:00:00').toISOString():null,
      expires_at:pf.ends?new Date(pf.ends+'T23:59:59').toISOString():null,
      max_uses:pf.max?parseInt(pf.max):null,
      active:pf.active!==false
    };

    const {error}=await supabase.from('promo_codes').upsert(row,{onConflict:'code'});
    if(!error)await logActivity('Enregistrement code promo','code promo',code,code,{kind:row.kind,active:row.active});

    setMsg(error?error.message:'Code enregistré');

    if(!error){
      setPf({kind:'percent',active:true,target_type:'all'});
      load();
    }
  };

  const editPromo=(c:any)=>setPf({
    code:c.code,
    kind:c.kind||'percent',
    value:c.kind==='fixed'?c.amount:c.percent,
    starts:c.starts_at?ld(c.starts_at):'',
    ends:c.expires_at?ld(c.expires_at):'',
    max:c.max_uses??'',
    active:c.active,
    target_type:c.target_type||'all',
    target_id:c.target_id||'',
    target_variant:c.target_variant||''
  });

  const togglePromo=async(c:any)=>{
    await supabase.from('promo_codes').update({active:!c.active}).eq('code',c.code);
    load();
  };

  const delPromo=async(c:any)=>{
    if(confirm(`Supprimer le code ${c.code} ?`)){
      await supabase.from('promo_codes').delete().eq('code',c.code);
      load();
    }
  };

  const upd=async(id:string,patch:any)=>{
    const product=prods.find(p=>p.id===id);
    const {error}=await supabase.from('products').update(patch).eq('id',id);
    if(!error)await logActivity('Modification rapide produit','produit',id,product?.name||'Produit',patch);
    load();
  };

  const toggleBulkProduct=(p:any)=>{
    setBulkSelected(current=>{
      if(current.includes(p.id))return current.filter(id=>id!==p.id);
      setBulkDrafts((drafts:any)=>({
        ...drafts,
        [p.id]:{
          stock:String(p.stock??0),
          variants:(p.variants||[]).map((v:any)=>typeof v==='object'?{...v,stock:String(v.stock??0)}:v)
        }
      }));
      return [...current,p.id];
    });
  };

  const updateBulkDraft=(id:string,patch:any)=>{
    setBulkDrafts((drafts:any)=>({
      ...drafts,
      [id]:{...(drafts[id]||{}),...patch}
    }));
  };

  const saveBulkStocks=async()=>{
    if(!bulkSelected.length||bulkBusy)return;
    setBulkBusy(true);
    let saved=0;
    let failed=0;

    for(const id of bulkSelected){
      const p=prods.find(x=>x.id===id);
      const draft=bulkDrafts[id];
      if(!p||!draft){failed++;continue;}

      let patch:any={};
      if(hasObjVars(p)){
        const variants=(draft.variants||[]).map((v:any)=>{
          if(typeof v!=='object')return v;
          const quantity=Math.max(0,Math.floor(Number(v.stock)||0));
          const status=['available','last','soldout'].includes(v.status||'available')
            ?(quantity<=0?'soldout':quantity<=3?'last':'available')
            :(v.status||'available');
          return {...v,stock:quantity,status};
        });
        const stock=variants
          .filter((v:any)=>typeof v==='object'&&['available','last'].includes(v.status))
          .reduce((sum:number,v:any)=>sum+Number(v.stock||0),0);
        const availability=stock>0
          ?(stock<=3?'last':'available')
          :variants.some((v:any)=>v.status==='arrival')
          ?'arrival'
          :variants.some((v:any)=>v.status==='preorder')
          ?'preorder'
          :'soldout';
        patch={variants,stock,availability};
      }else{
        const stock=Math.max(0,Math.floor(Number(draft.stock)||0));
        patch={stock,availability:autoAv(p.availability,stock)};
      }

      const {error}=await supabase.from('products').update(patch).eq('id',id);
      if(error){failed++;continue;}
      await logActivity('Mise à jour groupée du stock','produit',id,p.name||'Produit',patch);
      saved++;
    }

    setBulkBusy(false);
    setBulkSelected([]);
    setBulkDrafts({});
    setMsg(failed
      ?`Stocks enregistrés pour ${saved} produit(s). ${failed} échec(s).`
      :`Stocks mis à jour pour ${saved} produit(s).`);
    await load();
  };

  const del=async(id:string)=>{
    if(confirm('Supprimer ce produit ?')){
      await supabase.from('products').delete().eq('id',id);
      load();
    }
  };

  const quick=async(t:'brands'|'categories')=>{
    const n=prompt('Nom ?');

    if(!n)return;

    await supabase.from(t).insert(
      t==='brands'
        ?{name:n}
        :{name:n,slug:n.toLowerCase().replace(/[^a-z0-9]+/g,'-')}
    );

    load();
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          ['home','Tableau de bord'],
          ['orders','Commandes'],
          ['products','Produits'],
          ['history','Historique'],
          ['reviews',`Avis (${revs.filter(r=>!r.published).length?revs.filter(r=>!r.published).length+' masqués':revs.length})`],
          ['promos','Codes promo'],
          ['new','Ajouter un produit'],
          ['security','Mot de passe']
        ].map(([k,l])=>(
          <button
            key={k}
            onClick={()=>{
              if(k==='new')resetNew();
              setTab(k);
            }}
            className={`px-4 py-2 border ${tab===k?'bg-ink text-white':''}`}
          >
            {l}
          </button>
        ))}

        <a href="/admin/offres" className="px-4 py-2 border">
          Offres &amp; Packs
        </a>

        <a href="/admin/categories" className="px-4 py-2 border">
          Catégories
        </a>

        <a href="/admin/banniere" className="px-4 py-2 border">
          Bannière
        </a>

        <button
          onClick={()=>supabase.auth.signOut().then(()=>setOk(false))}
          className="ml-auto underline text-sm"
        >
          Déconnexion
        </button>
      </div>

      <p className="text-sm mb-4">
        Chiffre d'affaires : <b>{eur(revenue)}</b>
        {' '}· Commandes : {orders.length}
        {' '}· En attente : {orders.filter(o=>o.status==='pending').length}
      </p>

      {msg&&<p className="text-sm mb-2">{msg}</p>}

      {tab==='home'&&(
        <AdminHome
          go={(t:string)=>{
            if(t==='new')resetNew();
            setTab(t);
            window.scrollTo({top:0});
          }}
          editProduct={(p:any)=>startEdit(p)}
          stats={{
            orders:orders.length,
            pending:orders.filter(o=>o.status==='pending').length,
            revenue:eur(revenue),
            products:prods.length,
            low:lowS.length,
            out:outS.length,
            hiddenReviews:revs.filter(r=>!r.published).length,
            promos:promos.filter((c:any)=>c.active).length,
            orderRows:orders,
            productRows:prods
          }}
        />
      )}

      {tab==='security'&&(
        <section className="max-w-xl space-y-4 rounded-2xl border border-sand bg-white p-4 sm:p-6">
          <div>
            <h2 className="font-serif text-2xl text-plum">Changer mon mot de passe</h2>
            <p className="mt-1 text-sm text-ink/65">Cette modification concerne uniquement ton compte administrateur. Tes droits d’accès à l’administration restent inchangés.</p>
          </div>

          <form onSubmit={changeAdminPassword} className="space-y-3">
            <label className="block text-sm font-medium">
              Mot de passe actuel
              <input
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={e=>setCurrentPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-sand p-3"
                placeholder="Saisis ton mot de passe actuel"
              />
            </label>

            <label className="block text-sm font-medium">
              Nouveau mot de passe
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                value={newPassword}
                onChange={e=>setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-sand p-3"
                placeholder="10 caractères minimum"
              />
            </label>

            <label className="block text-sm font-medium">
              Confirmer le nouveau mot de passe
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                value={confirmPassword}
                onChange={e=>setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-sand p-3"
                placeholder="Répète le nouveau mot de passe"
              />
            </label>

            {passwordMessage&&<p role="status" className={`text-sm ${passwordMessage.includes('succès')?'text-green-700':'text-red-700'}`}>{passwordMessage}</p>}

            <button
              type="submit"
              disabled={passwordBusy}
              className="w-full rounded-lg bg-ink py-3 font-medium text-white disabled:opacity-50"
            >
              {passwordBusy?'Modification en cours…':'Modifier mon mot de passe'}
            </button>
          </form>
        </section>
      )}

      {tab==='history'&&(
        <section className="space-y-3">
          <div><h2 className="font-serif text-2xl text-plum">Historique de gestion</h2><p className="text-xs text-ink/60">100 dernières opérations enregistrées</p></div>
          {activity.length===0?<p className="rounded-xl border border-sand bg-white p-4 text-sm">Aucune opération enregistrée pour le moment.</p>:activity.map((a:any)=>(<article key={a.id} className="rounded-xl border border-sand bg-white p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><b>{a.action}</b><time className="text-xs text-ink/50">{new Date(a.created_at).toLocaleString('fr-FR')}</time></div>
            <p className="mt-1">{a.entity_label||a.entity_type}</p>
            {a.details&&Object.keys(a.details).length>0&&<pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-ink/60">{JSON.stringify(a.details,null,2)}</pre>}
          </article>))}
        </section>
      )}

      {tab==='promos'&&(
        <div className="space-y-4">
          <form
            onSubmit={savePromo}
            className="grid gap-2 rounded-2xl border border-sand bg-white p-4 text-sm"
          >
            <b>Créer ou modifier un code</b>

            <input
              value={pf.code||''}
              onChange={e=>setPf({...pf,code:e.target.value})}
              placeholder="Code (ex : BIENVENUE10)"
              className="border p-2 uppercase"
            />

            <div className="flex gap-2">
              <select
                value={pf.kind}
                onChange={e=>setPf({...pf,kind:e.target.value})}
                className="border p-2"
              >
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (DH)</option>
              </select>

              <input
                type="number"
                step="0.01"
                value={pf.value??''}
                onChange={e=>setPf({...pf,value:e.target.value})}
                placeholder="Valeur"
                className="w-28 border p-2"
              />
            </div>

            <div className="rounded-xl border border-sand bg-blush/20 p-3">
              <label className="block text-xs font-semibold text-plum">
                Ce code s’applique à
                <select value={pf.target_type||'all'} onChange={e=>setPf({...pf,target_type:e.target.value,target_id:'',target_variant:''})} className="mt-1 w-full border bg-white p-2">
                  <option value="all">Tout le catalogue</option>
                  <option value="category">Une catégorie</option>
                  <option value="brand">Une marque</option>
                  <option value="product">Un produit précis</option>
                  <option value="variant">Une variante précise</option>
                </select>
              </label>
              {pf.target_type==='category'&&<select value={pf.target_id||''} onChange={e=>setPf({...pf,target_id:e.target.value})} className="mt-2 w-full border bg-white p-2">
                <option value="">Choisir une catégorie</option>
                {[...cats].sort((a:any,b:any)=>String(a.name).localeCompare(String(b.name))).map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>}
              {pf.target_type==='brand'&&<select value={pf.target_id||''} onChange={e=>setPf({...pf,target_id:e.target.value})} className="mt-2 w-full border bg-white p-2">
                <option value="">Choisir une marque</option>
                {[...brands].sort((a:any,b:any)=>String(a.name).localeCompare(String(b.name))).map((b:any)=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>}
              {(pf.target_type==='product'||pf.target_type==='variant')&&<select value={pf.target_id||''} onChange={e=>setPf({...pf,target_id:e.target.value,target_variant:''})} className="mt-2 w-full border bg-white p-2">
                <option value="">Choisir un produit</option>
                {[...prods].sort((a:any,b:any)=>String(a.name).localeCompare(String(b.name))).map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>}
              {pf.target_type==='variant'&&pf.target_id&&<select value={pf.target_variant||''} onChange={e=>setPf({...pf,target_variant:e.target.value})} className="mt-2 w-full border bg-white p-2">
                <option value="">Choisir une variante</option>
                {(prods.find((p:any)=>p.id===pf.target_id)?.variants||[]).map((v:any,i:number)=><option key={String(v?.name||v)+'-'+i} value={typeof v==='string'?v:v?.name||''}>{typeof v==='string'?v:v?.name||('Variante '+(i+1))}</option>)}
              </select>}
              <p className="mt-2 text-[11px] text-ink/55">Une seule cible par code. La réduction sera calculée uniquement sur les articles concernés.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">
                Début
                <input
                  type="date"
                  value={pf.starts||''}
                  onChange={e=>setPf({...pf,starts:e.target.value})}
                  className="w-full border p-2"
                />
              </label>

              <label className="text-xs">
                Expiration
                <input
                  type="date"
                  value={pf.ends||''}
                  onChange={e=>setPf({...pf,ends:e.target.value})}
                  className="w-full border p-2"
                />
              </label>
            </div>

            <input
              type="number"
              value={pf.max??''}
              onChange={e=>setPf({...pf,max:e.target.value})}
              placeholder="Nombre maximal d’utilisations (vide = illimité)"
              className="border p-2"
            />

            <label>
              <input
                type="checkbox"
                checked={pf.active!==false}
                onChange={e=>setPf({...pf,active:e.target.checked})}
              />
              {' '}Code actif
            </label>

            <button className="bg-rose py-3 text-white">
              Enregistrer le code
            </button>
          </form>

          {promos.map(c=>(
            <div key={c.code} className="rounded-2xl border border-sand bg-white p-4 text-sm">
              <div className="flex justify-between">
                <b>{c.code}</b>
                <span className={c.active?'text-plum':'text-red-700'}>
                  {c.active?'Actif':'Désactivé'}
                </span>
              </div>

              <p>
                {c.kind==='fixed'?`-${c.amount} DH`:`-${c.percent} %`}
                {' '}· {c.uses||0}{c.max_uses?` / ${c.max_uses}`:''} utilisation(s)
              </p>

              <p className="text-xs text-ink/60">
                {c.starts_at?`Du ${new Date(c.starts_at).toLocaleDateString('fr-FR')} `:''}
                {c.expires_at?`jusqu’au ${new Date(c.expires_at).toLocaleDateString('fr-FR')}`:'sans date de fin'}
              </p>

              <div className="mt-2 flex gap-3 text-xs">
                <button type="button" onClick={()=>editPromo(c)} className="underline">
                  Modifier
                </button>
                <button type="button" onClick={()=>togglePromo(c)} className="underline">
                  {c.active?'Désactiver':'Activer'}
                </button>
                <button type="button" onClick={()=>delPromo(c)} className="text-red-700 underline">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='reviews'&&(
        <div className="space-y-3">
          <p className="text-sm">
            {revs.length} avis · {revs.filter(r=>r.published).length} publiés
          </p>

          {revs.length===0&&(
            <p className="text-sm text-ink/60">
              Aucun avis pour le moment : les clientes peuvent noter après la livraison.
            </p>
          )}

          {revs.map(r=>(
            <div
              key={r.id}
              className={`rounded-2xl border bg-white p-4 text-sm ${r.published?'border-sand':'border-red-300'}`}
            >
              <div className="flex justify-between gap-2">
                <b>{r.products?.name||'Produit supprimé'}</b>
                <span className="text-rose">
                  {'★'.repeat(r.rating)}
                  <span className="text-sand">{'★'.repeat(5-r.rating)}</span>
                </span>
              </div>

              {r.comment&&<p className="mt-1">{r.comment}</p>}

              <p className="mt-1 text-xs text-ink/60">
                {r.customer_name} · commande n°{r.order_number}
                {' '}· {new Date(r.created_at).toLocaleString('fr-FR')}
              </p>

              <div className="mt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={()=>toggleRev(r.id,!r.published)}
                  className="underline"
                >
                  {r.published?'Masquer':'Publier'}
                </button>

                <button
                  type="button"
                  onClick={()=>delRev(r.id)}
                  className="text-red-700 underline"
                >
                  Supprimer
                </button>

                <span className={r.published?'text-plum':'text-red-700'}>
                  {r.published?'Publié':'Masqué'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='orders'&&(
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ST.map(st=>(
              <button
                key={st}
                type="button"
                onClick={()=>setOf(of===st?'all':st)}
                className={`rounded-xl border p-3 text-left ${of===st?'border-plum bg-blush/50':'border-sand bg-white'}`}
              >
                <p className="text-2xl font-semibold text-plum">
                  {orders.filter(o=>o.status===st).length}
                </p>
                <p className="text-[10px] uppercase tracking-wider">{SL[st]}</p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-sand bg-white p-3 text-sm">
            <p>
              <b>Stock :</b> {outS.length} épuisé{outS.length>1?'s':''}
              {' '}· {lowS.length} stock faible
            </p>

            {lowS.length>0&&(
              <p className="mt-1 text-xs text-ink/60">
                {lowS.slice(0,8).map(p=>`${p.name} (${p.stock})`).join(' · ')}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={oq}
              onChange={e=>setOq(e.target.value)}
              placeholder="Rechercher : n°, nom, téléphone, ville"
              className="flex-1 rounded-full border p-3"
            />
            <button type="button" onClick={exportCsv} className="text-sm underline">
              CSV
            </button>
          </div>

          <p className="text-xs">
            {shownO.length} commande(s){of!=='all'?` · filtre : ${SL[of]}`:''}
          </p>

          {shownO.map(o=>(
            <div key={o.id} className="rounded-2xl border border-sand bg-white p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <b>#{o.number} · {o.name}</b>
                  <p className="text-xs text-ink/60">
                    {new Date(o.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>

                <span className={`rounded-full px-3 py-1 text-xs ${o.status==='cancelled'?'bg-red-100 text-red-700':o.status==='pending'?'bg-blush text-plum':'bg-plum text-white'}`}>
                  {SL[o.status]}
                </span>
              </div>

              <div className="mt-2 space-y-2">
                <p><span className="font-semibold">Type :</span> {(o.items||[]).some((i:any)=>i.preorder)?'Précommande':'Commande classique'} · <span className="font-semibold">Délai :</span> {(o.items||[]).some((i:any)=>i.preorder)?'2 à 3 semaines':'24 à 48 heures'}</p>
                <p><a href={`tel:${o.phone}`} className="underline">{o.phone}</a>{' '}· {o.address}, {o.city}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button type="button" onClick={()=>navigator.clipboard?.writeText(String(o.phone||''))} className="rounded-full border border-sand px-3 py-1.5">Copier le téléphone</button>
                  <button type="button" onClick={()=>navigator.clipboard?.writeText([o.address,o.city].filter(Boolean).join(', '))} className="rounded-full border border-sand px-3 py-1.5">Copier l’adresse</button>
                </div>
              </div>

              {o.notes&&<p className="text-xs">Note : {o.notes}</p>}

              <ul className="mt-2 divide-y divide-sand">
                {(o.items||[]).map((i:any,k:number)=>(
                  <li key={k} className="flex justify-between py-1.5">
                    <span>
                      {i.qty} × {i.name}
                      {i.variant?` (${i.variant})`:''}
                      {i.preorder?' [PRÉCOMMANDE]':''}
                    </span>
                    <span>{eur(i.price*i.qty)}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-1 flex justify-between border-t border-sand pt-2 text-xs">
                <span>Livraison</span>
                <span>{Number(o.delivery_fee)?eur(o.delivery_fee):'Offerte'}</span>
              </p>

              <p className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{eur(o.total)}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {NEXT[o.status].map(([st,l])=>(
                  <button
                    key={st}
                    type="button"
                    disabled={!!busyId}
                    onClick={()=>changeStatus(o.id,st)}
                    className={`rounded-full px-4 py-2 text-xs disabled:opacity-40 ${st==='cancelled'?'border border-red-400 text-red-700':'bg-rose text-white'}`}
                  >
                    {busyId===o.id?'…':l}
                  </button>
                ))}

                {NMSG[o.status]&&(
                  <a
                    href={`https://wa.me/${waNum(o.phone)}?text=${encodeURIComponent(createWhatsAppMessage(o))}`}
                    className="rounded-full border border-plum px-4 py-2 text-xs text-plum"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Prévenir sur WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='products'&&(
        <div className="space-y-2">
          <OptimizeProductImages />
          <div className="text-sm flex gap-4">
            <button onClick={()=>quick('brands')} className="underline">+ Marque</button>
            <button onClick={()=>quick('categories')} className="underline">+ Catégorie</button>
          </div>

          <p className="text-xs">
            Plus vendus : {[...prods].sort((a,b)=>b.sold-a.sold).slice(0,3).map(p=>`${p.name} (${p.sold})`).join(', ')||'—'}
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Rechercher par nom, marque ou référence"
              className="w-full border p-3 rounded-full"
            />

            <select
              value={flt}
              onChange={e=>setFlt(e.target.value)}
              className="w-full border p-3 rounded-full"
            >
              <option value="all">Tous les produits</option>
              <option value="stock">En vente</option>
              <option value="out">Épuisés</option>
              <option value="hidden">Masqués</option>
              <option value="lowstock">Stock faible (1 à 3)</option>
              <option value="preorder">Précommandes</option>
              <option value="arrival">Arrivages</option>
              <option value="new">Nouveautés</option>
              <option value="bestseller">Best-sellers</option>
              <option value="featured">Mis en avant</option>
              <option value="promo">En promotion</option>
              <option value="variants">Avec variantes</option>
              <option value="novariants">Sans variantes</option>
              <option value="noimage">Sans photo</option>
              <option value="nodesc">Sans description</option>
              <option value="petit_prix">Gamme Petit prix</option>
              <option value="marques">Gamme Marques</option>
              <option value="premium">Gamme Premium</option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={fb}
              onChange={e=>setFb(e.target.value)}
              className="flex-1 border p-2 rounded-full"
            >
              <option value="">Toutes les marques</option>
              {brands.map((b:any)=>(
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select
              value={fc}
              onChange={e=>setFc(e.target.value)}
              className="flex-1 border p-2 rounded-full"
            >
              <option value="">Toutes les catégories</option>
              {[...cats].map((c:any)=>({
                c,
                l:(cats.find((x:any)=>x.id===c.parent_id)?cats.find((x:any)=>x.id===c.parent_id).name+' › ':'')+c.name
              })).sort((a:any,b:any)=>a.l.localeCompare(b.l)).map((o:any)=>(
                <option key={o.c.id} value={o.c.id}>{o.l}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs">{shown.length} produit(s)</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={()=>{
                  const eligible=shown.filter((p:any)=>p.availability==='soldout');
                  setBulkSelected(eligible.map((p:any)=>p.id));
                  setBulkDrafts((drafts:any)=>{
                    const next={...drafts};
                    eligible.forEach((p:any)=>{
                      next[p.id]={
                        stock:String(p.stock??0),
                        variants:(p.variants||[]).map((v:any)=>typeof v==='object'?{...v,stock:String(v.stock??0)}:v)
                      };
                    });
                    return next;
                  });
                }}
                className="underline"
              >
                Sélectionner les épuisés affichés
              </button>
              <button type="button" onClick={()=>{setBulkSelected([]);setBulkDrafts({});}} className="underline">
                Tout désélectionner
              </button>
            </div>
          </div>

          {bulkSelected.length>0&&(
            <div className="sticky top-2 z-10 rounded-xl border border-plum/30 bg-white p-3 shadow-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b>{bulkSelected.length} produit(s) sélectionné(s)</b>
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={saveBulkStocks}
                  className="rounded-full bg-plum px-4 py-2 text-white disabled:opacity-50"
                >
                  {bulkBusy?'Enregistrement…':'Enregistrer les stocks sélectionnés'}
                </button>
              </div>
              <p className="text-xs text-ink/65">
                Saisis la nouvelle quantité pour chaque produit. Pour les produits avec variantes, règle chaque variante séparément.
              </p>
            </div>
          )}

          {shown.map(p=>(
            <div key={p.id} className="bg-white p-3 border border-sand text-sm flex flex-wrap gap-2 items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bulkSelected.includes(p.id)}
                  onChange={()=>toggleBulkProduct(p)}
                  aria-label={`Sélectionner ${p.name}`}
                />
                <span className="text-xs">Sélectionner</span>
              </label>
              <b className="flex-1 min-w-[10rem]">
                {p.name}
                {p.availability==='soldout'
                  ?<span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-normal text-white">Épuisé</span>
                  :(p.stock>0&&p.stock<=3&&!['preorder','arrival'].includes(p.availability))
                  ?<span className="rounded-full bg-rose px-2 py-0.5 text-[10px] font-normal text-white">Stock faible</span>
                  :null}
              </b>

              <label>
                Prix
                <input
                  defaultValue={p.price}
                  onBlur={e=>upd(p.id,{price:Number(e.target.value)})}
                  className="border w-20 p-1"
                />
              </label>

              <label>
                Ancien
                <input
                  defaultValue={p.old_price??''}
                  onBlur={e=>upd(p.id,{old_price:e.target.value?Number(e.target.value):null})}
                  className="border w-20 p-1"
                />
              </label>

              {hasObjVars(p)
                ?<span>Stock : {p.stock} (par variante)</span>
                :<label>
                  Stock
                  <input
                    defaultValue={p.stock}
                    onBlur={e=>{
                      const n=Number(e.target.value);
                      upd(p.id,{stock:n,availability:autoAv(p.availability,n)});
                    }}
                    className="border w-16 p-1"
                  />
                </label>}

              <select
                value={p.availability}
                onChange={e=>upd(p.id,{availability:e.target.value})}
                className="border p-1"
              >
                <option value="available">Disponible</option>
                <option value="arrival">Arrivage</option>
                <option value="preorder">Précommande</option>
                <option value="last">Dernières pièces</option>
                <option value="soldout">Épuisé</option>
              </select>

              <button onClick={()=>startEdit(p)} className="underline font-semibold">
                Modifier
              </button>

              <button onClick={()=>upd(p.id,{featured:!p.featured})} className="underline">
                {p.featured?'★ À la une':'☆ Mettre en avant'}
              </button>

              <button onClick={()=>upd(p.id,{active:!p.active})} className="underline">
                {p.active?'Masquer':'Afficher'}
              </button>

              <button onClick={()=>del(p.id)} className="underline text-red-700">
                Supprimer
              </button>

              {bulkSelected.includes(p.id)&&(
                <div className="w-full border-t border-sand pt-2 space-y-2">
                  {hasObjVars(p)?(
                    <>
                      <p className="text-xs font-semibold">Stock par variante — {p.name}</p>
                      {(bulkDrafts[p.id]?.variants||[]).map((v:any,index:number)=>(
                        typeof v==='object'?(
                          <label key={index} className="flex items-center justify-between gap-3 text-xs">
                            <span className="min-w-0">{v.name||Object.values(v.options||{}).join(' · ')||`Variante ${index+1}`}</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={v.stock??0}
                              onChange={e=>{
                                const variants=[...(bulkDrafts[p.id]?.variants||[])];
                                variants[index]={...variants[index],stock:e.target.value};
                                updateBulkDraft(p.id,{variants});
                              }}
                              className="w-20 rounded border p-2"
                            />
                          </label>
                        ):null
                      ))}
                    </>
                  ):(
                    <label className="flex items-center gap-2 text-xs">
                      Nouvelle quantité en stock
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={bulkDrafts[p.id]?.stock??0}
                        onChange={e=>updateBulkDraft(p.id,{stock:e.target.value})}
                        className="w-24 rounded border p-2"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==='new'&&(
        <form
          key={edit?.id||`new-${formVersion}`}
          onSubmit={saveProduct}
          className="grid gap-3 max-w-lg"
        >
          {!edit&&<ProductImporter onImport={importProduct}/>}

          <h2 className="font-serif text-2xl">
            {edit?`Modifier : ${edit.name}`:'Nouveau produit'}
          </h2>

          <input
            name="name"
            required
            placeholder="Nom"
            defaultValue={importedProduct?.name??edit?.name??''}
            className="border p-2"
          />

          <select
            name="brand"
            defaultValue={importedProduct?.brand_id??edit?.brand_id??''}
            onChange={e=>{
              const selected=brands.find((b:any)=>b.id===e.target.value);
              setCommercialRange(getBrandRange(selected?.name));
            }}
            className="border p-2"
          >
            <option value="">Marque</option>
            {brands.map((b:any)=><option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <input
            name="source_name"
            placeholder="Marque / provenance affichée (ex : SHEIN, Action...)"
            defaultValue={importedProduct?.brand??edit?.source_name??''}
            className="border p-2"
          />

          <label className="grid gap-1 text-sm">
            Gamme du produit
            <select
              name="commercial_range"
              value={commercialRange}
              onChange={e=>setCommercialRange(e.target.value)}
              className="border p-2"
            >
              <option value="">À définir</option>
              <option value="petit_prix">Petit prix</option>
              <option value="marques">Marques</option>
              <option value="premium">Premium</option>
            </select>
            <span className="text-xs text-ink/60">
              La gamme est proposée automatiquement selon la marque. Tu peux toujours la modifier.
            </span>
          </label>

          <select name="cat" defaultValue={edit?.category_id||''} className="border p-2">
            <option value="">Catégorie</option>
            {[...cats].map((c:any)=>({
              c,
              l:(cats.find((x:any)=>x.id===c.parent_id)?cats.find((x:any)=>x.id===c.parent_id).name+' › ':'')+c.name
            })).sort((a:any,b:any)=>a.l.localeCompare(b.l)).map((o:any)=>(
              <option key={o.c.id} value={o.c.id}>{o.l}</option>
            ))}
          </select>

          <input
            name="price"
            type="number"
            step="0.01"
            required
            placeholder="Prix (DH)"
            defaultValue={importedProduct?.price??edit?.price??''}
            className="border p-2"
          />

          <input
            name="old"
            type="number"
            step="0.01"
            placeholder="Ancien prix (promo)"
            defaultValue={edit?.old_price??''}
            className="border p-2"
          />

          <input
            name="stock"
            type="number"
            placeholder="Stock (ignoré s'il y a des variantes)"
            defaultValue={edit?.stock??''}
            className="border p-2"
          />

          <select name="av" defaultValue={edit?.availability||'available'} className="border p-2">
            <option value="available">Disponible immédiatement</option>
            <option value="arrival">Arrivage prochainement</option>
            <option value="preorder">Précommande</option>
            <option value="last">Dernières pièces</option>
            <option value="soldout">Stock épuisé</option>
          </select>

          {/* OPTIONS MULTIPLES */}
          <div className="rounded-2xl border-2 border-plum/20 bg-blush/20 p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-plum">
                Options multiples
              </h3>
              <p className="mt-1 text-xs text-ink/70">
                Pour les produits avec plusieurs choix, comme la couleur et la taille.
                Chaque combinaison aura son propre stock.
              </p>
            </div>

            {optionGroups.map((g:any,i:number)=>(
              <div key={i} className="rounded-xl border border-sand bg-white p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={g.name}
                    onChange={e=>setOptionGroups(previous=>previous.map((x,j)=>j===i?{...x,name:e.target.value}:x))}
                    placeholder="Nom du groupe (ex : Couleur)"
                    className="min-w-0 flex-1 border p-2"
                  />

                  <button
                    type="button"
                    onClick={()=>setOptionGroups(previous=>previous.filter((_,j)=>j!==i))}
                    className="text-xs text-red-700 underline"
                  >
                    Retirer
                  </button>
                </div>

                <input
                  value={g.values}
                  onChange={e=>setOptionGroups(previous=>previous.map((x,j)=>j===i?{...x,values:e.target.value}:x))}
                  placeholder="Valeurs séparées par des virgules : Noir, Blanc, Rose"
                  className="w-full border p-2 text-sm"
                />

                <p className="text-[11px] text-ink/50">
                  Sépare chaque valeur par une virgule.
                </p>
              </div>
            ))}

            <button
              type="button"
              onClick={()=>setOptionGroups(previous=>[
                ...previous,
                {name:'',values:''}
              ])}
              className="w-full rounded-full border border-plum py-2 text-sm text-plum"
            >
              + Ajouter un groupe d’options
            </button>

            {optionGroups.length>0&&(
              <button
                type="button"
                onClick={generateCombinations}
                className="w-full rounded-full bg-plum py-3 text-sm font-semibold text-white"
              >
                Générer les combinaisons
              </button>
            )}

            <p className="text-xs text-ink/60">
              Exemple : Couleur = Noir, Blanc · Taille = S, M, L.
              Le système créera automatiquement 6 combinaisons.
            </p>
          </div>

          {/* VARIANTES ET COMBINAISONS */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">
                Variantes et stocks
              </p>
              <p className="text-xs text-ink/60">
                Configure ici le stock, le prix, les couleurs et les photos de chaque combinaison.
              </p>
            </div>

            {vrows.map((r:any,i:number)=>{
              const swatch=cleanSwatch(r.swatch);

              return (
                <div key={i} className="border border-sand bg-white p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {r.options
                        ?<div>
                          <p className="font-semibold text-sm text-plum">
                            {r.name}
                          </p>
                          <p className="text-[11px] text-ink/50">
                            {r.sku?`SKU : ${r.sku}`:''}
                            {r.sku&&r.mpn?' · ':''}
                            {r.mpn?`MPN : ${r.mpn}`:''}
                          </p>
                        </div>
                        :<input
                          value={r.name}
                          onChange={e=>setV(i,{name:e.target.value})}
                          placeholder="Nom (ex : Rose)"
                          className="w-full border p-2"
                        />}
                    </div>

                    <button
                      type="button"
                      onClick={()=>setVrows(previous=>previous.filter((_,j)=>j!==i))}
                      className="text-sm text-red-700 underline"
                    >
                      Retirer
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <label className="flex-1 text-xs">
                      Stock
                      <input
                        type="number"
                        min="0"
                        value={r.stock}
                        onChange={e=>setV(i,{stock:e.target.value})}
                        placeholder="Stock"
                        className="w-full border p-2"
                      />
                    </label>

                    <label className="flex-1 text-xs">
                      Prix personnalisé (facultatif)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.price}
                        onChange={e=>setV(i,{price:e.target.value})}
                        placeholder="Prix du produit"
                        className="w-full border p-2"
                      />
                    </label>
                  </div>

                  {/* COULEUR DE LA VARIANTE */}
                  <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                    <p className="mb-2 text-xs font-semibold text-gray-800">
                      Couleur du carré de teinte
                    </p>

                    <div className="flex items-center gap-3">
                      <div
                        className="h-11 w-11 shrink-0 rounded-md border-2 border-gray-300 shadow-sm"
                        style={{backgroundColor:swatch||'#ffffff'}}
                        title={swatch||'Aucune couleur définie'}
                      />

                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          type="text"
                          value={r.swatch||''}
                          onChange={e=>setV(i,{swatch:e.target.value})}
                          placeholder="#C98B72"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-rose-400"
                        />

                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={toHexColor(r.swatch||'')}
                            onChange={e=>setV(i,{swatch:e.target.value})}
                            aria-label="Choisir la couleur de la teinte"
                            className="h-9 w-12 cursor-pointer rounded-md border border-gray-200 bg-white p-1"
                          />

                          <p className="text-xs text-gray-500">
                            Choisir ou corriger la couleur manuellement
                          </p>
                        </div>
                      </div>
                    </div>

                    {!swatch&&(
                      <p className="mt-2 text-xs text-gray-500">
                        Aucune couleur définie. Tu peux la choisir ici. Le carré de couleur restera indépendant des photos.
                      </p>
                    )}
                  </div>

                  <select
                    value={r.status||'available'}
                    onChange={e=>setV(i,{status:e.target.value})}
                    className="w-full border p-2"
                  >
                    <option value="available">Disponible immédiatement</option>
                    <option value="last">Dernières pièces</option>
                    <option value="arrival">Arrivage prochainement (réservation)</option>
                    <option value="preorder">Précommande</option>
                    <option value="soldout">Épuisé</option>
                  </select>

                  {r.images?.length>0&&(
                    <div className="flex flex-wrap gap-2">
                      {r.images.map((u:string,j:number)=>(
                        <div key={`${u}-${j}`} className="relative">
                          <img src={u} alt="" className="h-16 w-14 object-cover"/>
                          <button
                            type="button"
                            onClick={()=>setV(i,{images:r.images.filter((_:string,k:number)=>k!==j)})}
                            className="absolute right-0 top-0 bg-ink px-1 text-xs text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="text-xs">
                    Photos de cette variante
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e=>setV(i,{files:Array.from(e.target.files||[])})}
                    />
                  </label>

                  {r.files?.length>0&&(
                    <p className="text-xs text-plum">
                      {r.files.length} photo(s) à ajouter à l’enregistrement
                    </p>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={()=>setVrows(previous=>[
                ...previous,
                {
                  name:'',
                  stock:0,
                  status:'available',
                  price:'',
                  images:[],
                  files:[],
                  options:null,
                  sku:'',
                  mpn:'',
                  swatch:''
                }
              ])}
              className="w-full rounded-full border border-plum py-2 text-sm text-plum"
            >
              + Ajouter une variante simple
            </button>
          </div>

          <textarea
            name="ingredients"
            placeholder="Ingrédients / liste INCI (facultatif — copier depuis une source fiable)"
            defaultValue={importedProduct?.ingredients??edit?.ingredients??''}
            rows={4}
            className="border p-2"
          />

          <p className="text-xs text-ink/60">
            Renseigne uniquement les ingrédients confirmés sur l’emballage ou la fiche officielle du fabricant.
          </p>

          <textarea
            name="benefits"
            placeholder="Bénéfices annoncés par le fabricant (facultatif)"
            defaultValue={importedProduct?.benefits??edit?.benefits??''}
            rows={3}
            className="border p-2"
          />

          <p className="text-xs text-ink/60">
            Indique uniquement les bénéfices confirmés par le fabricant ou l’emballage.
          </p>

          <textarea
            name="desc"
            placeholder="Description"
            defaultValue={importedProduct?.description??edit?.description??''}
            className="border p-2"
          />

          {imgs.length>0&&(
            <div className="flex gap-2 flex-wrap">
              {imgs.map((u,i)=>(
                <div key={`${u}-${i}`} className="relative">
                  <img src={u} alt="" className="w-16 h-20 object-cover"/>
                  <button
                    type="button"
                    onClick={()=>setImgs(previous=>previous.filter((_,j)=>j!==i))}
                    className="absolute top-0 right-0 bg-ink text-white text-xs px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="text-sm">
            Photos générales du produit
            <input name="images" type="file" accept="image/*" multiple/>
          </label>

          <label>
            <input type="checkbox" name="new" defaultChecked={!!edit?.is_new}/>
            {' '}Nouveau
          </label>

          <label>
            <input type="checkbox" name="best" defaultChecked={!!edit?.is_bestseller}/>
            {' '}Best-seller
          </label>

          <label>
            <input type="checkbox" name="feat" defaultChecked={!!edit?.featured}/>
            {' '}Mettre en avant (accueil)
          </label>

          <button
            type="submit"
            disabled={savingProduct}
            className="bg-ink text-white py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingProduct?'Enregistrement en cours…':edit?'Enregistrer les modifications':'Enregistrer'}
          </button>
        </form>
      )}
    </div>
  );
}
