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
    icon:'▤',
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
    <section aria-labelledby="home-trust-title" className="relative left-1/2 mt-8 w-screen -translate-x-1/2 border-y border-[#ead9df] bg-gradient-to-r from-[#FCF6F8] via-white to-[#FCF6F8]">
      <div className="mx-auto max-w-[1500px] px-0 sm:px-6 lg:px-10">
        <div className="px-4 py-5 text-center sm:py-7">
          <p className="text-[9px] uppercase tracking-[0.28em] text-[#98783b]">Votre confiance, notre priorité</p>
          <h2 id="home-trust-title" className="mt-1 font-serif text-xl text-plum sm:text-2xl">Achetez en toute sérénité</h2>
        </div>
        <div className="flex snap-x snap-mandatory gap-0 overflow-x-auto border-y border-[#ead9df] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible">
          {items.map(item=>(
            <div key={item.title} className="flex w-[78vw] max-w-[260px] shrink-0 snap-start flex-col items-center justify-center px-4 py-4 text-center sm:w-auto sm:max-w-none sm:border-r sm:border-[#ead9df] sm:px-3 sm:py-5 last:sm:border-r-0">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C6A15B]/45 bg-white font-serif text-xl text-[#98783b]">{item.icon}</span>
              <h3 className="mt-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-plum sm:text-[10px]">{item.title}</h3>
              <p className="mt-1 max-w-[210px] text-[10px] leading-relaxed text-ink/65">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 text-center">
          <Link href="/livraison" className="inline-flex min-h-9 items-center justify-center gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-plum underline decoration-[#C6A15B] underline-offset-4 transition hover:text-[#98783b]">
            Frais et conditions de livraison <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
