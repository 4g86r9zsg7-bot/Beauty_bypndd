import Link from 'next/link';
const ic={width:26,height:26,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
const items=[
{href:'/categorie/nouveautes',label:'Nouveautés',icon:<svg {...ic}><path d="M11 3.5l1.9 5.3 5.3 1.9-5.3 1.9L11 17.9l-1.9-5.3L3.8 10.7l5.3-1.9z"/><path d="M19 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/><path d="M18.5 3.5v3M17 5h3"/></svg>},
{href:'/categorie/promotions',label:'Promotions',icon:<svg {...ic}><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2.5 12.5V3.5h9l9.1 9.1a2 2 0 0 1 0 2.8z" transform="translate(0 0)"/><circle cx="7.6" cy="8" r="1"/><circle cx="11.6" cy="12" r="1"/><path d="M12 7.6l-4.8 4.8"/></svg>},
{href:'/categorie/arrivages',label:'Prochains arrivages',icon:<svg {...ic}><rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 17.5h.01M12 17.5h.01" strokeWidth="2.2"/></svg>},
{href:'/categorie/precommandes',label:'Précommander',icon:<svg {...ic}><path d="M5 8.5h14l-1 11.5H6z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/><circle cx="12" cy="14.2" r="2.7"/><path d="M12 12.9v1.3l.9.6"/><path d="M19.6 2.6l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" fill="currentColor" stroke="none"/></svg>},
];
export default function Shortcuts(){return <section aria-label="Raccourcis" className="-mt-2 pb-5"><div className="grid grid-cols-4 gap-2 sm:gap-4">
{items.map(i=><Link key={i.href} href={i.href} className="group flex flex-col items-center justify-start gap-2 rounded-2xl border border-plum/15 bg-white px-1.5 py-3 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95">
<span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush text-plum transition duration-300 group-hover:scale-110 group-hover:bg-plum group-hover:text-white">{i.icon}</span>
<span className="text-[9.5px] font-medium uppercase leading-tight tracking-[0.12em] text-plum sm:text-xs">{i.label}</span></Link>)}</div></section>}
