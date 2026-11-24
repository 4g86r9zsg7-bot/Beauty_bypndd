import Link from 'next/link';
import {DELIVERY,PREORDER} from '@/lib/shop';

const items=[
  {icon:'✧',title:'Produits authentiques',text:'Sélectionnés avec soin'},
  {icon:'⌖',title:'Livraison au Maroc',text:'À domicile partout au Maroc'},
  {icon:'▤',title:'Paiement à la réception',text:'Réglez à la livraison'},
  {icon:'♡',title:'Délais transparents',text:`En stock : ${DELIVERY} · Précommande : ${PREORDER}`}
];

export default function HomeTrust(){
  return (
    <section aria-labelledby="home-trust-title" className="mx-auto mt-12 w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-[#ead9df] bg-gradient-to-r from-[#fffdfd] via-[#FCF6F8] to-[#fffdfd] shadow-sm">
        <div className="px-4 pt-5 text-center sm:pt-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#98783b]">Votre confiance, notre priorité</p>
          <h2 id="home-trust-title" className="mt-1 font-serif text-xl text-plum sm:text-2xl">Achetez en toute sérénité</h2>
        </div>
        <div className="mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-4 [scrollbar-width:thin] sm:grid sm:grid-cols-4 sm:gap-px sm:overflow-visible sm:bg-[#ead9df] sm:px-0 sm:pb-0">
          {items.map(item=>(
            <div key={item.title} className="flex min-w-[150px] snap-start flex-1 flex-col items-center justify-center rounded-xl border border-[#ead9df] bg-white/95 px-3 py-4 text-center sm:min-w-0 sm:rounded-none sm:border-0 sm:px-3 sm:py-5">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C6A15B]/45 bg-[#FCF8F8] font-serif text-xl text-[#98783b]">{item.icon}</span>
              <h3 className="mt-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-plum">{item.title}</h3>
              <p className="mt-1 max-w-[170px] text-[10px] leading-snug text-ink/65">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-1 border-t border-[#ead9df] px-3 py-2 text-center sm:flex-row sm:justify-center sm:gap-3">
          <span className="text-[9px] text-ink/45 sm:hidden">Glissez pour voir les 4 engagements</span>
          <Link href="/livraison" className="inline-flex min-h-9 items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-plum underline decoration-[#C6A15B] underline-offset-4 transition hover:text-[#98783b]">
            Frais et conditions de livraison <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
