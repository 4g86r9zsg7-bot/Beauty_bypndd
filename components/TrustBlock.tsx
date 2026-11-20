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

  const productInfo=p.brands?.name
    ?`Marque indiquée sur la fiche : ${p.brands.name}.`
    :'Consultez la description et les photos pour découvrir les informations disponibles sur cet article.';

  return (
    <section className="mt-10 grid gap-5 border-t border-sand pt-6 text-sm sm:grid-cols-3">
      <div>
        <p className={h}>Informations produit</p>
        <p className="mt-1 text-ink/80">{productInfo} Les détails communiqués sont présentés sur la fiche produit.</p>
      </div>
      <div>
        <p className={h}>Disponibilité et délai</p>
        <p className="mt-1 text-ink/80">{availabilityText}</p>
      </div>
      <div>
        <p className={h}>Livraison et paiement</p>
        <p className="mt-1 text-ink/80">
          Paiement à la livraison. <Link href="/livraison" className="font-medium text-plum underline underline-offset-4">Consulter les frais et conditions</Link>.
        </p>
      </div>
    </section>
  );
}
