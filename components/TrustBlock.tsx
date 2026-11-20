import Link from 'next/link';
import {DELIVERY,PREORDER} from '@/lib/shop';

export default function TrustBlock({p}:{p:any}){
  const availability=p.availability;

  let availabilityText=`En stock : livraison à domicile en ${DELIVERY}.`;
  if(availability==='preorder'){
    availabilityText=`Précommande : délai estimé de ${PREORDER}, confirmé par WhatsApp.`;
  }else if(availability==='arrival'){
    availabilityText='Prochain arrivage : contactez-nous pour réserver et connaître la disponibilité.';
  }else if(availability==='soldout'||Number(p.stock||0)<=0){
    availabilityText='Article actuellement indisponible. Contactez-nous pour connaître son retour.';
  }

  const sections=[
    {
      title:'Authenticité',
      content:'Des produits exclusivement authentiques, avec une attention particulière portée à leur provenance et à leur qualité.'
    },
    {
      title:'Disponibilité',
      content:availabilityText
    },
    {
      title:'Livraison et paiement',
      content:<>Paiement à la livraison. <Link href="/livraison" className="font-medium text-plum underline underline-offset-4">Voir les frais et conditions</Link>.</>
    }
  ];

  return (
    <section className="mx-auto mt-8 w-full max-w-6xl px-4 md:px-8" aria-label="Informations utiles">
      <div className="overflow-hidden rounded-2xl border border-sand bg-white">
        <div className="border-b border-sand px-5 py-4 sm:px-6">
          <h2 className="font-serif text-xl text-plum">Informations utiles</h2>
        </div>
        <div className="grid divide-y divide-sand sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {sections.map(section=>(
            <div key={section.title} className="px-5 py-4 sm:px-5 sm:py-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-plum">
                {section.title}
              </h3>
              <div className="mt-2 text-sm leading-relaxed text-ink/75">{section.content}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
