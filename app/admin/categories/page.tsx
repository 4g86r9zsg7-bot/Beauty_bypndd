'use client';import {useEffect,useState} from 'react';import {supabase} from '@/lib/supabase';
type T='categories'|'brands';
export default function Taxo(){const [cats,setC]=useState<any[]>([]);const [brands,setB]=useState<any[]>([]);const [msg,setMsg]=useState('');const [n,setN]=useState({categories:'',brands:''});
const load=async()=>{const [c,b]=await Promise.all([supabase.from('categories').select('*').order('name'),supabase.from('brands').select('*').order('name')]);setC(c.data||[]);setB(b.data||[])};
useEffect(()=>{load()},[]);
const slug=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
async function add(t:T){const name=n[t].trim();if(!name)return;const {error}=await supabase.from(t).insert(t==='brands'?{name}:{name,slug:slug(name)});setMsg(error?error.message:'Ajouté');setN({categories:'',brands:''});load()}
async function rename(t:T,x:any){const name=prompt('Nouveau nom',x.name);if(!name||!name.trim())return;const {error}=await supabase.from(t).update({name:name.trim()}).eq('id',x.id);setMsg(error?error.message:'Modifié');load()}
async function del(t:T,x:any){if(!confirm(`Supprimer « ${x.name} » ?`))return;const {error}=await supabase.from(t).delete().eq('id',x.id);setMsg(error?'Impossible (des produits l’utilisent ou vous n’êtes pas connectée) : '+error.message:'Supprimé');load()}
const box=(t:T,title:string,list:any[])=><section className="bg-white border border-sand p-4"><h2 className="font-serif text-2xl text-plum mb-3">{title}</h2>
<div className="flex gap-2 mb-3"><input value={n[t]} onChange={e=>setN({...n,[t]:e.target.value})} placeholder="Nouveau nom" className="flex-1 border p-2"/><button onClick={()=>add(t)} className="bg-rose text-white px-4">Ajouter</button></div>
{list.map(x=><div key={x.id} className="flex justify-between items-center border-t border-sand py-2 text-sm"><span>{x.name}</span><span className="flex gap-3"><button onClick={()=>rename(t,x)} className="underline">Modifier</button><button onClick={()=>del(t,x)} className="underline text-red-700">Supprimer</button></span></div>)}</section>;
return <div className="space-y-4 max-w-lg mx-auto"><h1 className="font-serif text-3xl">Catégories et marques</h1><p className="text-xs">Connectez-vous d’abord sur <a href="/admin" className="underline">/admin</a>, puis revenez ici.</p>{msg&&<p className="text-sm">{msg}</p>}{box('categories','Catégories',cats)}{box('brands','Marques',brands)}</div>}
