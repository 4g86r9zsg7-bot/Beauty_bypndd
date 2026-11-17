import Link from 'next/link';import SearchBox from '@/components/SearchBox';
export default function Hero({items}:{items?:any[]}){
return <section className="relative left-1/2 z-10 w-screen -translate-x-1/2 overflow-hidden text-white lg:-mt-6">
<style>{`
.hero-art{position:absolute;left:0;bottom:0;width:100%;height:330px;object-fit:cover;object-position:50% 40%;mix-blend-mode:lighten;pointer-events:none;user-select:none;
-webkit-mask-image:linear-gradient(to bottom,transparent 0%,#000 42%),linear-gradient(to right,transparent 0%,#000 14%,#000 86%,transparent 100%);-webkit-mask-composite:source-in;
mask-image:linear-gradient(to bottom,transparent 0%,#000 42%),linear-gradient(to right,transparent 0%,#000 14%,#000 86%,transparent 100%);mask-composite:intersect}
@media(min-width:1024px){.hero-art{left:auto;right:0;top:0;bottom:auto;width:62%;height:100%;object-position:55% 50%;
-webkit-mask-image:linear-gradient(to right,transparent 0%,#000 40%),linear-gradient(to bottom,transparent 0%,#000 14%,#000 86%,transparent 100%);-webkit-mask-composite:source-in;
mask-image:linear-gradient(to right,transparent 0%,#000 40%),linear-gradient(to bottom,transparent 0%,#000 14%,#000 86%,transparent 100%);mask-composite:intersect}}
`}</style>
<div className="absolute inset-0 overflow-hidden" aria-hidden="true"><div className="absolute inset-0" style={{background:'radial-gradient(60% 70% at 78% 35%,rgba(238,111,176,.28),transparent 62%),radial-gradient(45% 55% at 12% 90%,rgba(142,63,104,.5),transparent 65%),radial-gradient(40% 50% at 55% 8%,rgba(212,44,116,.2),transparent 60%),linear-gradient(118deg,#14040c 0%,#3B0F27 38%,#5b1239 58%,#2a0a1b 80%,#12040b 100%)'}}/>
<div className="absolute inset-0 opacity-60" style={{background:'repeating-linear-gradient(112deg,rgba(255,255,255,.045) 0 1px,transparent 1px 52px)'}}/><div className="absolute inset-0" style={{background:'linear-gradient(100deg,transparent 28%,rgba(255,255,255,.08) 44%,transparent 60%)'}}/></div>
<img src="/hero-beaute.jpg" alt="" aria-hidden="true" fetchPriority="high" decoding="async" className="hero-art"/>
<div className="relative mx-auto max-w-[1500px] px-6 pb-[330px] pt-12 lg:px-10 lg:pb-20 lg:pt-20"><div className="lg:max-w-[46%]">
<span className="inline-block rounded-full border border-white/30 px-5 py-2 text-[11px] uppercase tracking-[0.3em]">Nouveauté exclusive</span>
<p className="mt-8 text-xs uppercase tracking-[0.4em] text-white/80">Beauté, mode &amp; accessoires</p>
<h1 className="mt-3 font-serif text-5xl leading-[1.05] md:text-6xl lg:text-7xl">Le luxe à petit prix</h1>
<svg viewBox="0 0 400 20" className="mt-2 h-4 w-72 max-w-full" aria-hidden="true"><defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stopColor="#EE6FB0" stopOpacity="0"/><stop offset=".4" stopColor="#EE6FB0"/><stop offset="1" stopColor="#EE6FB0" stopOpacity="0"/></linearGradient></defs><path d="M0 14C100 2 250 2 400 12" fill="none" stroke="url(#hg)" strokeWidth="2.4" strokeLinecap="round"/></svg>
<p className="mt-4 max-w-md font-serif text-xl text-white/90">Votre beauté, vos marques préférées, vos petits prix.</p>
<div className="mt-8 flex flex-wrap gap-3"><Link href="/categorie/nouveautes" className="rounded-full bg-[#EE6FB0] px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#2a0a1b] shadow-[0_0_30px_rgba(238,111,176,.4)] transition hover:brightness-110 active:scale-95">Voir les nouveautés →</Link>
<Link href="/categorie/promotions" className="rounded-full border border-[#EE6FB0] px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10 active:scale-95">Voir les bonnes affaires</Link></div>
<SearchBox/></div></div></section>}
