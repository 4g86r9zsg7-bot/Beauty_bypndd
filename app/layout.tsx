import './globals.css';import Link from 'next/link';import {Cormorant_Garamond,Inter} from 'next/font/google';
import {CartProvider} from '@/lib/cart';import {WA} from '@/lib/supabase';import CartLink from '@/components/CartLink';
const serif=Cormorant_Garamond({subsets:['latin'],weight:['400','500','600'],style:['normal','italic'],variable:'--f-serif'});const sans=Inter({subsets:['latin'],variable:'--f-sans'});
export const metadata={title:'Beauty_bypndd | L’élégance au féminin',description:'Sephora, Rituals, Huda Beauty, The Ordinary, MAC, NYX et plus. Authentique, tendance, prix accessibles.'};
const nav=[['maquillage','Maquillage'],['soins-visage','Visage'],['soins-corps','Corps'],['parfums-brumes','Parfums'],['coffrets-cadeaux','Coffrets'],['rituals','Rituals'],['cheveux','Cheveux'],['mode','Mode'],['sacs-accessoires','Sacs'],['nouveautes','Nouveautés'],['promotions','Promos']];
export default function L({children}:{children:React.ReactNode}){return <html lang="fr"><body className={`${serif.variable} ${sans.variable}`}><CartProvider>
<div className="bg-plum text-white text-center text-[11px] tracking-[0.2em] uppercase py-2.5 px-4">Livraison rapide à domicile &amp; paiement à la livraison</div>
<header className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-sand"><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 max-w-6xl mx-auto"><span/>
<Link href="/" className="text-center leading-none"><span className="block font-serif italic text-2xl text-plum">beautybypndd</span><span className="block mt-1 text-[8px] tracking-[0.25em] uppercase text-rose whitespace-nowrap">L’élégance au féminin</span></Link>
<div className="text-right"><CartLink/></div></div>
<nav className="flex gap-6 overflow-x-auto px-4 pb-3 max-w-6xl mx-auto text-[11px] tracking-[0.18em] uppercase whitespace-nowrap">{nav.map(([s,n])=><Link key={s} href={`/categorie/${s}`} className="text-plum">{n}</Link>)}</nav></header>
<main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
<footer className="bg-deep text-white px-4 py-10 text-xs tracking-[0.15em] uppercase text-center">Beauty_bypndd · Le luxe à petit prix<br/><a className="underline mt-3 inline-block" href={process.env.NEXT_PUBLIC_INSTAGRAM}>Instagram</a></footer>
<a href={`https://wa.me/${WA}`} className="fixed bottom-4 right-4 bg-rose text-white rounded-full px-5 py-3 text-sm shadow-lg">WhatsApp</a>
</CartProvider></body></html>}
