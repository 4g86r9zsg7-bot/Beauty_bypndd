import {supabase,eur} from '@/lib/supabase';import {DELIVERY,PREORDER} from '@/lib/shop';
export const revalidate=300;
export const metadata={title:'Livraison | Beauty_bypndd',description:'Livraison à domicile, paiement à la livraison, frais et conditions chez Beauty_bypndd.'};
export default async function Livraison(){
const {data}=await supabase.from('settings').select('value').eq('key','delivery').single();const v:any=data?.value||{};
const zones:any[]=v.zones||[];const base=zones.find((z:any)=>z.city==='*')?.fee;const cities=zones.filter((z:any)=>z.city!=='*');
const h="font-serif text-2xl text-plum mt-8";
return <div className="mx-auto max-w-2xl space-y-3"><h1 className="font-serif text-4xl text-plum">Livraison</h1>
<h2 className={h}>Livraison à domicile</h2><p>Nous livrons vos commandes à l’adresse que vous indiquez lors de la validation.</p>
<h2 className={h}>Frais de livraison</h2>
{base!=null&&<p>Frais standard : <b>{eur(base)}</b>.</p>}
{cities.length>0&&<ul className="list-disc pl-5">{cities.map((z:any)=><li key={z.city}>{z.city} : {eur(z.fee)}</li>)}</ul>}
{v.free_over&&<p>Livraison <b>offerte</b> dès {eur(v.free_over)} d’achats.</p>}
<h2 className={h}>Délais</h2><p>Livraison à domicile en <b>{DELIVERY}</b> après confirmation de votre commande.</p>
<h2 className={h}>Paiement à la livraison</h2><p>Vous payez en espèces à la réception de votre commande.</p>
<h2 className={h}>Arrivages et précommandes</h2><p>Précommande : comptez <b>{PREORDER}</b> d’attente, le délai exact vous est confirmé par WhatsApp. Arrivage : réservez votre article, nous vous prévenons par WhatsApp dès sa réception.</p>
<p className="pt-4"><a href="/contact" className="underline">Une question ? Contactez-nous</a></p></div>}
