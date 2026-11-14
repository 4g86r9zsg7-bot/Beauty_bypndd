import {notFound} from 'next/navigation';import {supabase} from '@/lib/supabase';import ProductCard from '@/components/ProductCard';import Suggestions from '@/components/Suggestions';
export const dynamic='force-dynamic';
type SP={brand?:string;sort?:string;stock?:string;q?:string;min?:string;max?:string};
export default async function Cat({params,searchParams}:{params:{slug:string};searchParams:SP}){
const s=params.slug,sp=searchParams;let q:any=supabase.from('products').select('*,brands(name)').eq('active',true);let title='';
if(s==='tous'){title=sp.q?`Recherche : ${sp.q}`:'Tous les produits'}
else if(s==='nouveautes'){title='Nouveautés';q=q.eq('is_new',true)}
else if(s==='promotions'){title='Promotions';q=q.not('old_price','is',null)}
else{const {data:c}=await supabase.from('categories').select('id,name').eq('slug',s).single();if(!c)notFound();title=c.name;q=q.eq('category_id',c.id)}
const t=(sp.q||'').replace(/[%,()*]/g,' ').trim();if(t)q=q.or(`name.ilike.%${t}%,description.ilike.%${t}%`);
if(sp.brand)q=q.eq('brand_id',sp.brand);if(sp.stock)q=q.neq('availability','soldout');
if(sp.min&&isFinite(Number(sp.min)))q=q.gte('price',Number(sp.min));if(sp.max&&isFinite(Number(sp.max)))q=q.lte('price',Number(sp.max));
const o=sp.sort;q=o==='asc'?q.order('price'):o==='desc'?q.order('price',{ascending:false}):o==='pop'?q.order('sold',{ascending:false}):q.order('created_at',{ascending:false});
const [{data},{data:b}]=await Promise.all([q,supabase.from('brands').select('*').order('name')]);
const rank=(p:any)=>{const pre=p.availability==='preorder',arr=p.availability==='arrival';const sold=p.availability==='soldout'||(!pre&&!arr&&p.stock<=0);return sold?2:(pre||arr)?1:0};
const list=[...(data||[])].sort((x:any,y:any)=>rank(x)-rank(y));
const seen=new Set<string>();const brands=(b||[]).filter((x:any)=>{const k=x.name.trim().toLowerCase();if(seen.has(k))return false;seen.add(k);return true});
const inp="border border-sand bg-white p-3 rounded-full";
return <><h1 className="font-serif text-4xl text-plum">{title}</h1>
<form className="grid grid-cols-2 gap-2 my-4 text-sm"><input name="q" defaultValue={sp.q||''} placeholder="Rechercher un produit" className={`col-span-2 ${inp}`}/>
<select name="brand" defaultValue={sp.brand||''} className={inp}><option value="">Toutes les marques</option>{brands.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
<select name="sort" defaultValue={o||''} className={inp}><option value="">Plus récents</option><option value="pop">Plus vendus</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option></select>
<input name="min" type="number" inputMode="numeric" defaultValue={sp.min||''} placeholder="Prix min (DH)" className={inp}/><input name="max" type="number" inputMode="numeric" defaultValue={sp.max||''} placeholder="Prix max (DH)" className={inp}/>
<label className="flex items-center gap-2 px-2"><input type="checkbox" name="stock" value="1" defaultChecked={!!sp.stock}/>En stock</label><button className="bg-rose text-white rounded-full py-3 text-xs tracking-[0.2em] uppercase">Filtrer</button></form>
<p className="text-sm text-plum mb-3">{list.length} produit(s)</p>
{list.length?<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{list.map((p:any)=><ProductCard key={p.id} p={p}/>)}</div>:<p>Aucun produit trouvé.</p>}<Suggestions title="Vous aimerez aussi" exclude={list.map((p:any)=>p.id)} limit={4}/></>}
