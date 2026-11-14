import Link from 'next/link';import {supabase} from '@/lib/supabase';import ProductCard from '@/components/ProductCard';import Suggestions from '@/components/Suggestions';
export const revalidate=30;
const rank=(p:any)=>{const pre=p.availability==='preorder',arr=p.availability==='arrival';const sold=p.availability==='soldout'||(!pre&&!arr&&p.stock<=0);return sold?2:(pre||arr)?1:0};
const uniq=(a:any[]|null)=>{const s=new Set<string>();return (a||[]).filter(x=>{const k=x.name.trim().toLowerCase();if(s.has(k))return false;s.add(k);return true})};
async function row(seen:Set<string>,title:string,f:(q:any)=>any,href?:string,track=true){
const {data}=await f(supabase.from('products').select('*,brands(name)').eq('active',true).order('created_at',{ascending:false}).limit(16));
const items=(data||[]).filter((p:any)=>!seen.has(p.id)).sort((a:any,b:any)=>rank(a)-rank(b)).slice(0,8);if(!items.length)return null;if(track)items.forEach((p:any)=>seen.add(p.id));
return <section className="mt-12"><div className="text-center mb-5"><h2 className="font-serif text-3xl text-plum">{title}</h2><div className="w-16 h-px bg-rose mx-auto mt-3"/>{href&&<Link href={href} className="text-[11px] tracking-[0.2em] uppercase text-rose mt-3 inline-block">Tout voir</Link>}</div>
<div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">{items.map((p:any)=><ProductCard key={p.id} p={p}/>)}</div></section>}
export default async function Home(){
const seen=new Set<string>();
const {data:c}=await supabase.from('categories').select('*').order('name');const {data:b}=await supabase.from('brands').select('*').order('name');
const cats=uniq(c),brands=uniq(b);
return <>
<section className="-mx-4 -mt-6 px-6 py-14 md:py-24 text-white bg-gradient-to-br from-deep via-[#4a1230] to-black">
<span className="inline-block border border-white/30 rounded-full px-4 py-1.5 text-[11px] tracking-[0.25em] uppercase">Nouveauté exclusive</span>
<p className="mt-8 text-xs tracking-[0.35em] uppercase text-blush">Beauté, mode &amp; accessoires</p>
<h1 className="font-serif text-5xl md:text-7xl mt-3 leading-tight max-w-2xl">Le luxe à petit prix</h1>
<p className="mt-4 max-w-md text-white/80 text-lg">Votre beauté, vos marques préférées, vos petits prix.</p>
<div className="mt-8 grid gap-3 max-w-sm"><Link href="/categorie/nouveautes" className="bg-rose text-center rounded-full py-4 text-xs tracking-[0.2em] uppercase font-semibold">Voir les nouveautés →</Link>
<Link href="/categorie/promotions" className="border border-white/40 text-center rounded-full py-4 text-xs tracking-[0.2em] uppercase font-semibold">Voir les bonnes affaires</Link></div></section>
<div className="text-center mt-12"><p className="text-xs tracking-[0.35em] uppercase text-rose">Inspiration élégante</p><h2 className="font-serif text-3xl text-plum mt-2">Achetez par catégorie</h2><div className="w-16 h-px bg-rose mx-auto mt-3"/></div>
<div className="flex flex-wrap justify-center gap-2 mt-5">{cats.map((x:any)=><Link key={x.id} href={`/categorie/${x.slug}`} className="border border-plum/30 bg-white text-plum rounded-full px-4 py-2 text-[11px] tracking-[0.15em] uppercase">{x.name}</Link>)}</div>
{await row(seen,'Disponibles immédiatement',q=>q.in('availability',['available','last']).gt('stock',0),'/categorie/tous',false)}
{await row(seen,'Nouveautés',q=>q.eq('is_new',true).not('availability','in','(arrival,preorder)'),'/categorie/nouveautes')}
{await row(seen,'Meilleures ventes',q=>q.eq('is_bestseller',true).not('availability','in','(arrival,preorder)'))}
{await row(seen,'Promotions et bonnes affaires',q=>q.not('old_price','is',null).not('availability','in','(arrival,preorder)'),'/categorie/promotions')}
{await row(seen,'Coffrets cadeaux',q=>q.eq('category_id',cats.find((x:any)=>x.slug==='coffrets-cadeaux')?.id??'00000000-0000-0000-0000-000000000000'),'/categorie/coffrets-cadeaux')}
{await row(seen,'Prochains arrivages',q=>q.in('availability',['arrival','preorder']),'/categorie/arrivages')}
{brands.length>0&&<section className="mt-12 text-center"><h2 className="font-serif text-3xl text-plum">Marques populaires</h2><div className="flex flex-wrap justify-center gap-2 mt-4">{brands.map((x:any)=><Link key={x.id} href={`/categorie/tous?brand=${x.id}`} className="border border-plum px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase text-plum">{x.name}</Link>)}</div></section>}
<Suggestions title="Coups de cœur" exclude={Array.from(seen)} limit={4}/>
</>}
