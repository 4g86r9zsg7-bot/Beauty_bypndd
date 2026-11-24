import Link from 'next/link';
import {DELIVERY,PREORDER} from '@/lib/shop';

const items=[
  {icon:'✧',title:'Authenticité'},
  {icon:'⌖',title:'Livraison Maroc'},
  {icon:'▤',title:'Paiement réception'},
  {icon:'♡',title:'Délais clairs',text:`En stock : ${DELIVERY}\nPrécommande : ${PREORDER}`}
];

export default function HomeTrust(){
  return (
    <section aria-labelledby="home-trust-title" className="mx-auto mt-12 w-full max-w-6xl px-3 pb-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-[#ead9df] bg-gradient-to-r from-[#fffdfd] via-[#FCF6F8] to-[#fffdfd] shadow-sm">
        <div className="px-3 pt-4 text-center sm:pt-6">
          <p className="text-[9px] uppercase tracking-[0.24em] text-[#98783b]">Votre confiance, notre priorité</p>
          <h2 id="home-trust-title" className="mt-1 font-serif text-lg text-plum sm:text-2xl">Achetez en toute sérénité</h2>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1 px-2 pb-3 sm:mt-4 sm:gap-px sm:bg-[#ead9df] sm:px-0 sm:pb-0">
          {items.map(item=>(
            <div key={item.title} className="flex min-w-0 flex-col items-center justify-start rounded-lg bg-white/80 px-1 py-3 text-center sm:rounded-none sm:px-3 sm:py-5">
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C6A15B]/45 bg-[#FCF8F8] font-serif text-lg text-[#98783b] sm:h-10 sm:w-10 sm:text-xl">{item.icon}</span>
              <h3 className="mt-2 text-[8px] font-semibold uppercase leading-tight tracking-[0.01em] text-plum min-[380px]:text-[9px] sm:text-[11px] sm:tracking-[0.08em]">{item.title}</h3>
              {item.text && <p className="mt-1 whitespace-pre-line text-[7px] leading-tight text-ink/65 sm:text-[10px]">{item.text}</p>}
            </div>
          ))}
        </div>
        <div className="border-t border-[#ead9df] px-3 py-2 text-center">
          <Link href="/livraison" className="inline-flex min-h-8 items-center justify-center gap-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-plum underline decoration-[#C6A15B] underline-offset-4 transition hover:text-[#98783b] sm:text-[10px]">
            Frais et conditions de livraison <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
