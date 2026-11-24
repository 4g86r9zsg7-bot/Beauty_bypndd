import Link from 'next/link';

const items=[
  {icon:'✧',title:'Authenticité'},
  {icon:'⌖',title:'Livraison Maroc'},
  {icon:'▤',title:'Paiement réception'},
  {icon:'♡',title:'Délais clairs'}
];

export default function HomeTrust(){
  return (
    <section aria-label="Nos engagements" className="mx-auto mt-8 w-full max-w-6xl px-3 pb-5 sm:px-6 lg:px-8">
      <div className="bg-[#FCF6F8]">
        <div className="grid grid-cols-4 items-center gap-1 px-1 py-3 sm:px-4 sm:py-4">
          {items.map(item=>(
            <div key={item.title} className="flex min-w-0 flex-col items-center justify-center gap-1 text-center">
              <span aria-hidden="true" className="text-base leading-none text-[#98783b] sm:text-lg">{item.icon}</span>
              <span className="text-[8px] font-semibold uppercase leading-tight tracking-[0.01em] text-plum min-[380px]:text-[9px] sm:text-[11px] sm:tracking-[0.06em]">{item.title}</span>
            </div>
          ))}
        </div>
        <div className="pb-2 text-center">
          <Link href="/livraison" className="text-[8px] font-medium text-plum/70 underline decoration-[#C6A15B] underline-offset-2 sm:text-[9px]">
            Voir les conditions de livraison
          </Link>
        </div>
      </div>
    </section>
  );
}
