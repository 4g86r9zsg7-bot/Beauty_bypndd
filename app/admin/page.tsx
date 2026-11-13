'use client';import {useEffect,useState} from 'react';import {supabase,eur} from '@/lib/supabase';
const ST=['pending','confirmed','shipped','delivered','cancelled'];const SL:any={pending:'En attente',confirmed:'Confirmée',shipped:'Expédiée',delivered:'Livrée',cancelled:'Annulée'};
export default function Admin(){const [ok,setOk]=useState<boolean|null>(null);const [em,setEm]=useState('');const [pw,setPw]=useState('');const [tab,setTab]=useState('orders');
const [orders,setO]=useState<any[]>([]);const [prods,setP]=useState<any[]>([]);const [cats,setC]=useState<any[]>([]);const [brands,setB]=useState<any[]>([]);const [msg,setMsg]=useState('');
const [edit,setEdit]=useState<any>(null);const [imgs,setImgs]=useState<string[]>([]);
async function check(){const {data:{user}}=await supabase.auth.getUser();if(!user)return setOk(false);const {data}=await supabase.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();setOk(!!data);if(data)load()}
async function load(){const [o,p,c,b]=await Promise.all([supabase.from('orders').select('*').order('created_at',{ascending:false}),supabase.from('products').select('*,brands(name)').order('created_at',{ascending:false}),supabase.from('categories').select('*'),supabase.from('brands').select('*')]);setO(o.data||[]);setP(p.data||[]);setC(c.data||[]);setB(b.data||[])}
useEffect(()=>{check()},[]);
async function login(e:any){e.preventDefault();const {error}=await supabase.auth.signInWithPassword({email:em,password:pw});if(error)setMsg(error.message);else check()}
if(ok===null)return <p>Chargement…</p>;
if(!ok)return <form onSubmit={login} className="max-w-sm mx-auto space-y-3"><h1 className="font-serif text-3xl">Administration</h1><input type="email" required placeholder="Email" value={em} onChange={e=>setEm(e.target.value)} className="w-full border p-3"/><input type="password" required placeholder="Mot de passe" value={pw} onChange={e=>setPw(e.target.value)} className="w-full border p-3"/><button className="w-full bg-ink text-white py-3">Se connecter</button><p className="text-sm text-red-700">{msg}</p></form>;
const revenue=orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+Number(o.total),0);
const setStatus=async(id:string,status:string)=>{await supabase.from('orders').update({status}).eq('id',id);load()};
const exportCsv=()=>{const r=[['N','Date','Client','Tel','Ville','Adresse','Total','Statut'],...orders.map(o=>[o.number,o.created_at,o.name,o.phone,o.city,o.address,o.total,o.status])];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([r.map(x=>x.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')],{type:'text/csv'}));a.download='commandes.csv';a.click()};
async function saveProduct(e:any){e.preventDefault();const form=e.target;const fd=new FormData(form);const urls:string[]=[];
for(const file of Array.from((form.images as HTMLInputElement).files||[])){const path=`${Date.now()}-${file.name.replace(/[^\w.]/g,'_')}`;const {error}=await supabase.storage.from('product-images').upload(path,file);if(!error)urls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)}
const name=String(fd.get('name'));
const row:any={name,brand_id:fd.get('brand')||null,category_id:fd.get('cat')||null,description:fd.get('desc'),price:Number(fd.get('price')),old_price:fd.get('old')?Number(fd.get('old')):null,stock:Number(fd.get('stock')||0),availability:fd.get('av'),variants:String(fd.get('vars')||'').split(',').map(s=>s.trim()).filter(Boolean),is_new:fd.get('new')==='on',is_bestseller:fd.get('best')==='on',images:[...imgs,...urls]};
const slug=name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-')+'-'+Date.now().toString(36);
const {error}=edit?await supabase.from('products').update(row).eq('id',edit.id):await supabase.from('products').insert({...row,slug});
setMsg(error?error.message:(edit?'Produit modifié':'Produit ajouté'));if(!error){setEdit(null);setImgs([]);load();setTab('products')}}
const startEdit=(p:any)=>{setEdit(p);setImgs(p.images||[]);setMsg('');setTab('new')};
const upd=async(id:string,patch:any)=>{await supabase.from('products').update(patch).eq('id',id);load()};
const del=async(id:string)=>{if(confirm('Supprimer ce produit ?')){await supabase.from('products').delete().eq('id',id);load()}};
const quick=async(t:'brands'|'categories')=>{const n=prompt('Nom ?');if(!n)return;await supabase.from(t).insert(t==='brands'?{name:n}:{name:n,slug:n.toLowerCase().replace(/[^a-z0-9]+/g,'-')});load()};
return <div><div className="flex gap-2 flex-wrap mb-4">{[['orders','Commandes'],['products','Produits'],['new','Ajouter un produit']].map(([k,l])=><button key={k} onClick={()=>{if(k==='new'){setEdit(null);setImgs([])}setTab(k)}} className={`px-4 py-2 border ${tab===k?'bg-ink text-white':''}`}>{l}</button>)}<button onClick={()=>supabase.auth.signOut().then(()=>setOk(false))} className="ml-auto underline text-sm">Déconnexion</button></div>
<p className="text-sm mb-4">Chiffre d'affaires : <b>{eur(revenue)}</b> · Commandes : {orders.length} · En attente : {orders.filter(o=>o.status==='pending').length}</p>{msg&&<p className="text-sm mb-2">{msg}</p>}
{tab==='orders'&&<div className="space-y-3"><button onClick={exportCsv} className="underline text-sm">Exporter en CSV</button>{orders.map(o=><div key={o.id} className="bg-white p-3 text-sm border border-sand"><div className="flex justify-between"><b>#{o.number} · {o.name}</b><span>{eur(o.total)}</span></div><p>{o.phone} · {o.address}, {o.city}</p>{o.notes&&<p>Note : {o.notes}</p>}<p>{o.items.map((i:any)=>`${i.qty}× ${i.name}${i.variant?` (${i.variant})`:''}`).join(', ')}</p>
<select value={o.status} onChange={e=>setStatus(o.id,e.target.value)} className="border mt-2 p-1">{ST.map(s=><option key={s} value={s}>{SL[s]}</option>)}</select></div>)}</div>}
{tab==='products'&&<div className="space-y-2"><div className="text-sm flex gap-4"><button onClick={()=>quick('brands')} className="underline">+ Marque</button><button onClick={()=>quick('categories')} className="underline">+ Catégorie</button></div>
<p className="text-xs">Plus vendus : {[...prods].sort((a,b)=>b.sold-a.sold).slice(0,3).map(p=>`${p.name} (${p.sold})`).join(', ')||'—'}</p>
{prods.map(p=><div key={p.id} className="bg-white p-3 border border-sand text-sm flex flex-wrap gap-2 items-center"><b className="flex-1 min-w-[10rem]">{p.name}</b>
<label>Prix <input defaultValue={p.price} onBlur={e=>upd(p.id,{price:Number(e.target.value)})} className="border w-20 p-1"/></label>
<label>Ancien <input defaultValue={p.old_price??''} onBlur={e=>upd(p.id,{old_price:e.target.value?Number(e.target.value):null})} className="border w-20 p-1"/></label>
<label>Stock <input defaultValue={p.stock} onBlur={e=>upd(p.id,{stock:Number(e.target.value)})} className="border w-16 p-1"/></label>
<select value={p.availability} onChange={e=>upd(p.id,{availability:e.target.value})} className="border p-1"><option value="available">Disponible</option><option value="arrival">Arrivage</option><option value="preorder">Précommande</option><option value="last">Dernières pièces</option><option value="soldout">Épuisé</option></select>
<button onClick={()=>startEdit(p)} className="underline font-semibold">Modifier</button><button onClick={()=>upd(p.id,{active:!p.active})} className="underline">{p.active?'Masquer':'Afficher'}</button><button onClick={()=>del(p.id)} className="underline text-red-700">Supprimer</button></div>)}</div>}
{tab==='new'&&<form key={edit?.id||'new'} onSubmit={saveProduct} className="grid gap-2 max-w-lg"><h2 className="font-serif text-2xl">{edit?`Modifier : ${edit.name}`:'Nouveau produit'}</h2>
<input name="name" required placeholder="Nom" defaultValue={edit?.name||''} className="border p-2"/>
<select name="brand" defaultValue={edit?.brand_id||''} className="border p-2"><option value="">Marque</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
<select name="cat" defaultValue={edit?.category_id||''} className="border p-2"><option value="">Catégorie</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
<input name="price" type="number" step="0.01" required placeholder="Prix" defaultValue={edit?.price??''} className="border p-2"/>
<input name="old" type="number" step="0.01" placeholder="Ancien prix (promo)" defaultValue={edit?.old_price??''} className="border p-2"/>
<input name="stock" type="number" placeholder="Stock" defaultValue={edit?.stock??''} className="border p-2"/>
<select name="av" defaultValue={edit?.availability||'available'} className="border p-2"><option value="available">Disponible immédiatement</option><option value="arrival">Arrivage prochainement</option><option value="preorder">Précommande</option><option value="last">Dernières pièces</option><option value="soldout">Stock épuisé</option></select>
<input name="vars" placeholder="Variantes séparées par des virgules (Rose, Nude, 50ml)" defaultValue={(edit?.variants||[]).join(', ')} className="border p-2"/>
<textarea name="desc" placeholder="Description" defaultValue={edit?.description||''} className="border p-2"/>
{imgs.length>0&&<div className="flex gap-2 flex-wrap">{imgs.map(u=><div key={u} className="relative"><img src={u} alt="" className="w-16 h-20 object-cover"/><button type="button" onClick={()=>setImgs(imgs.filter(x=>x!==u))} className="absolute top-0 right-0 bg-ink text-white text-xs px-1">×</button></div>)}</div>}
<label className="text-sm">Ajouter des photos <input name="images" type="file" accept="image/*" multiple/></label>
<label><input type="checkbox" name="new" defaultChecked={!!edit?.is_new}/> Nouveau</label><label><input type="checkbox" name="best" defaultChecked={!!edit?.is_bestseller}/> Best-seller</label>
<button className="bg-ink text-white py-3">{edit?'Enregistrer les modifications':'Enregistrer'}</button></form>}</div>}
