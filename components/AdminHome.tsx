'use client';
import Link from 'next/link';

type S={orders:number;pending:number;revenue:string;products:number;low:number;out:number;hiddenReviews:number;promos:number};
const ic={width:24,height:24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
type Card={key:string;label:string;desc:string;badge?:string;alert?:boolean;icon:any;tab?:string;href?:string};

export default function AdminHome({stats:s,go}:{stats:S;go:(t:string)=>void}){
  const cards:Card[]=[
    {key:'orders',tab:'orders',label:'Commandes',desc:'Suivre, confirmer et livrer les commandes',badge:s.pending>0?`${s.pending} en attente`:`${s.orders} au total`,alert:s.pending>0,
      icon:<svg {...ic}><path d="M5 8.5h14l-1 11.5H6z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/></svg>},
    {key:'products',tab:'products',label:'Produits',desc:'Prix, stock, disponibilité et mise en avant',badge:`${s.products} produits${s.out?` · ${s.out} épuisés`:''}`,alert:s.low>0,
      icon:<svg {...ic}><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2.5 12.5V3.5h9l9.1 9.1a2 2 0 0 1 0 2.8z"/><circle cx="7.6" cy="8" r="1"/></svg>},
    {key:'new',tab:'new',label:'Ajouter un produit',desc:'Créer un nouveau produit avec ses variantes et photos',
      icon:<svg {...ic}><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>},
    {key:'offers',href:'/admin/offres',label:'Offres & Packs',desc:'Packs, « 2+1 offert », dates et quantités',
      icon:<svg {...ic}><path d="M3.5 9h17v4h-17z"/><path d="M5 13v7h14v-7"/><path d="M12 9v11"/><path d="M12 9S10.5 4 8 4.5 7 9 12 9z"/><path d="M12 9s1.5-5 4-4.5S17 9 12 9z"/></svg>},
    {key:'promos',tab:'promos',label:'Codes promo',desc:'Créer et suivre les codes de réduction',badge:`${s.promos} actif${s.promos>1?'s':''}`,
      icon:<svg {...ic}><path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.2"/><circle cx="17" cy="17" r="2.2"/></svg>},
    {key:'reviews',tab:'reviews',label:'Avis clientes',desc:'Publier ou masquer les avis',badge:s.hiddenReviews>0?`${s.hiddenReviews} masqué${s.hiddenReviews>1?'s':''}`:undefined,
      icon:<svg {...ic}><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/></svg>},
    {key:'categories',href:'/admin/categories',label:'Catégories & marques',desc:'Ordre des catégories, images et logos des marques',
      icon:<svg {...ic}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>},
    {key:'banner',href:'/admin/banniere',label:'Bannière d’accueil',desc:'Changer l’image de la bannière',
      icon:<svg {...ic}><rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/></svg>},
    {key:'site',href:'/',label:'Voir le site',desc:'Ouvrir la boutique telle que la voient les clientes',
      icon:<svg {...ic}><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10"/></svg>},
  ];
  const cls="group flex items-start gap-4 rounded-2xl border border-sand bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-plum hover:shadow-md active:scale-[0.99]";
  const inner=(c:Card)=><>
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blush text-plum transition group-hover:bg-plum group-hover:text-white">{c.icon}</span>
    <span className="min-w-0 flex-1"><span className="block font-serif text-xl text-plum">{c.label}</span><span className="mt-0.5 block text-xs text-ink/60">{c.desc}</span>
      {c.badge&&<span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] ${c.alert?'bg-rose text-white':'bg-sand text-ink/70'}`}>{c.badge}</span>}</span>
    <span className="self-center text-plum/40" aria-hidden="true">›</span></>;
  return (
    <div>
      <h1 className="font-serif text-3xl text-plum">Tableau de bord</h1>
      <p className="mt-1 text-sm text-ink/60">Chiffre d’affaires : <b>{s.revenue}</b> · {s.orders} commande{s.orders>1?'s':''}{s.pending>0?` · ${s.pending} à traiter`:''}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {cards.map(c=>c.href
          ?<Link key={c.key} href={c.href} className={cls}>{inner(c)}</Link>
          :<button key={c.key} type="button" onClick={()=>go(c.tab as string)} className={cls}>{inner(c)}</button>)}
      </div>
    </div>
  );
}
