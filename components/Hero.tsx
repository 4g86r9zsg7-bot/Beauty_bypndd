import Link from 'next/link';import SearchBox from '@/components/SearchBox';
const POS=['left-[30%] top-[4%] w-[36%] -rotate-3 z-20','left-[3%] top-[27%] w-[27%] -rotate-[9deg] z-10','right-[2%] top-[2%] w-[28%] rotate-[7deg] z-10','right-[9%] bottom-[2%] w-[24%] rotate-[5deg] z-30','left-[22%] bottom-[0%] w-[22%] -rotate-[6deg] z-30'];
export default function Hero({items}:{items:any[]}){
return <section className="relative left-1/2 z-10 w-screen -translate-x-1/2 text-white lg:-mt-6">
<div className="absolute inset-0 overflow-hidden" aria-hidden="true"><div className="absolute inset-0" style={{background:'radial-gradient(60% 70% at 78% 35%,rgba(238,111,176,.28),transparent 62%),radial-gradient(45% 55% at 12% 90%,rgba(142,63,104,.5),transparent 65%),radial-gradient(40% 50% at 55% 8%,rgba(212,44,116,.2),transparent 60%),linear-gradient(118deg,#14040c 0%,#3B0F27 38%,#5b1239 58%,#2a0a1b 80%,#12040b 100%)'}}/>
<div className="absolute inset-0 opacity-60" style={{background:'repeating-linear-gradient(112deg,rgba(255,255,255,.045) 0 1px,transparent 1px 52px)'}}/><div className="absolute inset-0" style={{background:'linear-gradient(100deg,transparent 28%,rgba(255,255,255,.08) 44%,transparent 60%)'}}/></div>
<div className="relative mx-auto grid max-w-[1500px] items-center gap-8 px-6 py-12 lg:grid-cols-[1.05fr_1fr] lg:px-10 lg:py-20">
<div><span className="inline-block rounded-full border border-white/30 px-5 py-2 text-[11px] uppercase tracking-[0.3em]">Nouveauté exclusive</span>
<p className="mt-8 text-xs uppercase tracking-[0.4em] text-white/80">Beauté, mode &amp; accessoires</p>
<h1 className="mt-3 font-serif text-5xl leading-[1.05] md:text-6xl lg:text-7xl">Le luxe à petit prix</h1>
<svg viewBox="0 0 400 20" className="mt-2 h-4 w-72 max-w-full" aria-hidden="true"><defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stopColor="#EE6FB0" stopOpacity="0"/><stop offset=".4" stopColor="#EE6FB0"/><stop offset="1" stopColor="#EE6FB0" stopOpacity="0"/></linearGradient></defs><path d="M0 14C100 2 250 2 400 12" fill="none" stroke="url(#hg)" strokeWidth="2.4" strokeLinecap="round"/></svg>
<p className="mt-4 max-w-md font-serif text-xl text-white/90">Votre beauté, vos marques préférées, vos petits prix.</p>
<div className="mt-8 flex flex-wrap gap-3"><Link href="/categorie/nouveautes" className="rounded-full bg-[#EE6FB0] px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#2a0a1b] shadow-[0_0_30px_rgba(238,111,176,.4)] transition hover:brightness-110 active:scale-95">Voir les nouveautés →</Link>
<Link href="/categorie/promotions" className="rounded-full border border-[#EE6FB0] px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10 active:scale-95">Voir les bonnes affaires</Link></div>
<SearchBox/></div>
{items.length>0&&<div className="relative mx-auto h-[340px] w-full max-w-[560px] sm:h-[430px] lg:h-[540px]"><div className="absolute inset-[8%] rounded-full blur-3xl" style={{background:'radial-gradient(circle,rgba(238,111,176,.35),transparent 65%)'}}/>
{items.slice(0,5).map((p,i)=><Link key={p.id} href={`/produit/${p.slug}`} aria-label={p.name} className={`absolute ${POS[i]} aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,.55)] ring-1 ring-white/20 transition duration-500 hover:z-40 hover:scale-105`}><img src={p.images[0]} alt={p.name} loading={i<2?'eager':'lazy'} decoding="async" className="h-full w-full object-cover"/><span className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"/></Link>)}</div>}
</div></section>}
