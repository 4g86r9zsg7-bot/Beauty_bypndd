import Link from 'next/link';
import {DELIVERY,PREORDER} from '@/lib/shop';

export default function TrustBlock({p}:{p:any}){
  const availability=p.availability;
  const h="text-[11px] uppercase tracking-[0.2em] text-plum";

  let availabilityText=`En stock : livraison à domicile en ${DELIVERY}.`;
  if(availability==='preorder'){
    availabilityText=`Précommande : délai estimé de ${PREORDER}, confirmé par WhatsApp.`;
  }else if(availability==='arrival'){
    availabilityText='Prochain arrivage : contactez-nous pour réserver et connaître la disponibilité.';
  }else if(availability==='soldout'||Number(p.stock||0)<=0){
    availabilityText='Article actuellement indisponible. Contactez-nous pour connaître son retour.';
  }

  const sections=[
    {title:'Authenticité garantie',content:'Chez BeautyByPND, nous proposons exclusivement des produits authentiques. Nous accordons une attention particulière à la provenance et à la qualité de chaque article afin de vous offrir une expérience d’achat en toute confiance.'},
    {title:'Disponibilité et délai',content:availabilityText},
    {title:'Livraison et paiement',content:< >Paiement à la livraison. <Link href="/livraison" className="font-medium text-plum underline underline-offset-4">Consulter les frais et conditions</Link>.</>}
  ].filter(section=>typeof section.content==='string'?section.content.trim().length>0:Boolean(section.content));

  if(!sections.length)return null;

  return (
    <section className="mt-10 grid gap-3 border-t border-sand pt-6 text-sm sm:grid-cols-3" aria-label="Informations utiles">
      {sections.map(section=>(
        <div key={section.title} className="rounded-2xl border border-sand bg-white p-4">
          <p className={h}>{section.title}</p>
          <div className="mt-2 leading-relaxed text-ink/80">{section.content}</div>
        </div>
      ))}
    </section>
  );
}
