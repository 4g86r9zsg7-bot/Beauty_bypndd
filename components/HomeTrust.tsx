import Link from 'next/link';
import {DELIVERY,PREORDER} from '@/lib/shop';

const items=[
  {
    icon:'✧',
    title:'Produits authentiques',
    text:'Une sélection de produits authentiques, choisis avec soin.'
  },
  {
    icon:'⌖',
    title:'Livraison au Maroc',
    text:'Recevez votre commande à domicile partout au Maroc.'
  },
  {
    icon:'₫',
    title:'Paiement à la réception',
    text:'Réglez votre commande en espèces à la livraison.'
  },
  {
    icon:'♡',
    title:'Délais transparents',
    text:`En stock : ${DELIVERY}. Précommande : ${PREORDER}.`
  }
];

export default function HomeTrust(){
  return (
    <section aria-labelledby="home-trust-title" className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-[#ead9df] bg-gradient-to-br from-white via-[#fffdfd] to-[#FCF6F8] shadow-sm">
        <div className="px-5 pt-7 text-center sm:px-8 sm:pt-9">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#98783b]">Votre confiance, notre priorité</p>
          <h2 id="home-trust-title" className="mt-2 font-serif text-2xl text-plum sm:text-3xl">Achetez en toute sérénité</h2>
        </div>
        <div className="grid grid-cols-2 gap-px bg-[#ead9df] sm:grid-cols-4">
          {items.map(item=>(
            <div key={item.title} className="flex min-w-0 flex-col items-center bg-white/90 px-3 py-6 text-center sm:px-5 sm:py-7">
              <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C6A15B]/45 bg-[#FCF8F8] font-serif text-2xl text-[#98783b]">{item.icon}</span>
              <h3 className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-plum sm:text-[11px]">{item.title}</h3>
              <p className="mt-2 max-w-[210px] text-[11px] leading-relaxed text-ink/65 sm:text-xs">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-[#ead9df] px-4 py-3 text-center">
          <Link href="/livraison" className="inline-flex min-h-10 items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-plum underline decoration-[#C6A15B] underline-offset-4 transition hover:text-[#98783b]">
            Consulter les frais et conditions de livraison <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
