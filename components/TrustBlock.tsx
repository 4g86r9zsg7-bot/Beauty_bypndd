import Link from 'next/link';import {DELIVERY,PREORDER} from '@/lib/shop';
export default function TrustBlock({p}:{p:any}){
const order=['preorder','arrival','soldout'].includes(p.availability)||p.stock<=0;
const h="text-[11px] uppercase tracking-[0.2em] text-plum";
return <section className="mt-10 grid gap-5 border-t border-sand pt-6 text-sm sm:grid-cols-3">
<div><p className={h}>Authenticité</p><p className="mt-1 text-ink/80">Produits authentiques, de grandes marques, à prix accessibles.</p></div>
<div><p className={h}>Disponibilité</p><p className="mt-1 text-ink/80">{order?`Précommande : délai de ${PREORDER}, confirmé par WhatsApp.`:`En stock : livraison à domicile en ${DELIVERY}.`}</p></div>
<div><p className={h}>Livraison et paiement</p><p className="mt-1 text-ink/80">Paiement à la livraison. <Link href="/livraison" className="underline">Frais et conditions</Link></p></div>
</section>}
