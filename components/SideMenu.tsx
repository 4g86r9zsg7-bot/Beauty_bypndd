'use client';import {useEffect,useState} from 'react';import {createPortal} from 'react-dom';import Link from 'next/link';import {supabase} from '@/lib/supabase';
const MAIN=['maquillage','parfums-brumes','soins-visage','soins-corps','cheveux'];
const LABEL:Record<string,string>={maquillage:'Maquillage','parfums-brumes':'Parfums','soins-visage':'Visage','soins-corps':'Corps et bain',cheveux:'Cheveux'};
export default function SideMenu(){
const [mounted,setMounted]=useState(false);const [open,setOpen]=useState(false);const [sec,setSec]=useState('');
const [cats,setCats]=useState<any[]>([]);const [brands,setBrands]=useState<any[]>([]);const [usedC,setUsedC]=useState<Set<string>>(new Set());const [usedB,setUsedB]=useState<Set<string>>(new Set());
const show=()=>{setMounted(true);requestAnimationFrame(()=>requestAnimationFrame(()=>setOpen(true)))};const hide=()=>setOpen(false);
useEffect(()=>{if(!mounted)return;Promise.all([supabase.from('categories').select('id,slug,name,parent_id'),supabase.from('brands').select('id,name').order('name'),supabase.from('products').select('category_id,brand_id').eq('active',true)]).then(([c,b,p])=>{setCats(c.data||[]);setBrands(b.data||[]);setUsedC(new Set((p.data||[]).map((x:any)=>x.category_id)));setUsedB(new Set((p.data||[]).map((x:any)=>x.brand_id)))})},[mounted]);
useEffect(()=>{document.body.style.overflow=open?'hidden':'';const k=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',k);return()=>{window.removeEventListener('keydown',k);document.body.style.overflow=''}},[open]);
const byName=(a:any,b:any)=>a.name.localeCompare(b.name);
const tops=cats.filter(c=>!c.parent_id);const ORDER:Record<string,string[]>={maquillage:['Teint','Lèvres','Yeux','Sourcils','Palettes','Pinceaux et éponges'],'parfums-brumes':['Parfums','Brumes parfumées','Parfums à petits prix','Coffrets parfum'],'soins-visage':['Protection solaire','Crème visage','Sérum','Contour du visage','Soins des lèvres','Gommage visage','Soins des cils et sourcils','Démaquillants et nettoyants','Soins des dents'],'soins-corps':['Crème hydratante','Gommage corps','Brume corps','Déodorants','Soins des mains','Soins des pieds'],cheveux:['Shampooings','Coiffants et fixants','Sprays cheveux','Huiles','Lisseurs & boucleurs']};
const kids=(c:any)=>cats.filter(x=>x.parent_id===c.id).sort((a:any,b:any)=>{const o=ORDER[c.slug]||[];const ia=o.indexOf(a.name),ib=o.indexOf(b.name);return (ia<0?99:ia)-(ib<0?99:ib)||byName(a,b)});
const mains=MAIN.map(s=>tops.find(c=>c.slug===s)).filter(Boolean) as any[];
const others=tops.filter(c=>!MAIN.includes(c.slug)&&c.name.trim().toLowerCase()!=='mercadona').sort(byName);const brandsU=brands.filter(b=>usedB.has(b.id)&&b.name.trim().toLowerCase()!=='mercadona');
const row="flex w-full items-center justify-between border-b border-sand px-5 py-4 text-left text-[13px] uppercase tracking-[0.16em] text-plum";
const lnk="block py-2.5 text-sm text-ink";
const Acc=({k,label,children}:{k:string;label:string;children:any})=><div><button type="button" aria-expanded={sec===k} onClick={()=>setSec(sec===k?'':k)} className={row}><span>{label}</span><span className={`text-lg leading-none transition-transform ${sec===k?'rotate-45':''}`}>+</span></button>{sec===k&&<div className="border-b border-sand bg-cream px-5 py-2">{children}</div>}</div>;
return <>
<button type="button" onClick={show} aria-label="Ouvrir le menu" className="-ml-2 p-2 text-plum"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
{mounted&&createPortal(<div className={`fixed inset-0 z-50 transition-all duration-300 ${open?'':'invisible'}`}>
<div onClick={hide} className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open?'opacity-100':'opacity-0'}`}/>
<aside className={`absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ${open?'translate-x-0':'-translate-x-full'}`}>
<div className="flex items-center justify-between border-b border-sand px-5 py-4"><span className="font-serif text-2xl italic text-plum">beautybypndd</span><button type="button" onClick={hide} aria-label="Fermer le menu" className="p-1 text-3xl leading-none text-plum">×</button></div>
<form action="/categorie/tous" onSubmit={hide} className="border-b border-sand p-4"><input name="q" type="search" enterKeyHint="search" placeholder="Rechercher un produit" className="w-full rounded-full border border-sand bg-cream px-4 py-3 text-sm"/></form>
<div className="flex-1 overflow-y-auto" style={{paddingBottom:'env(safe-area-inset-bottom)'}}>
<Link href="/categorie/nouveautes" onClick={hide} className={row}>Nouveautés</Link><Link href="/categorie/promotions" onClick={hide} className={row}>Promotions</Link><Link href="/categorie/arrivages" onClick={hide} className={row}>Prochains arrivages</Link>
{mains.map(c=><Acc key={c.id} k={c.slug} label={LABEL[c.slug]||c.name}><Link href={`/categorie/${c.slug}`} onClick={hide} className={`${lnk} font-semibold`}>Voir tout</Link>{kids(c).map(k=><Link key={k.id} href={`/categorie/${k.slug}`} onClick={hide} className={lnk}>{k.name}</Link>)}</Acc>)}
<Acc k="marques" label="Marques">{brandsU.map(b=><Link key={b.id} href={`/categorie/tous?brand=${b.id}`} onClick={hide} className={lnk}>{b.name}</Link>)}</Acc>
{others.map(c=><Link key={c.id} href={`/categorie/${c.slug}`} onClick={hide} className={row}>{c.name}</Link>)}
<div className="px-5 py-5 text-sm text-ink/70"><Link href="/livraison" onClick={hide} className="mr-5 underline">Livraison</Link><Link href="/contact" onClick={hide} className="underline">Contact</Link></div>
</div></aside></div>,document.body)}</>}
