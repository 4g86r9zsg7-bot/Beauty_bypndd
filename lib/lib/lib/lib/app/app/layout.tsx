import './globals.css';import Link from 'next/link';import {Playfair_Display,Jost} from 'next/font/google';
import {CartProvider} from '@/lib/cart';import {WA} from '@/lib/supabase';import CartLink from '@/components/CartLink';
const serif=Playfair_Display({subsets:['latin'],variable:'--f-serif'});const sans=Jost({subsets:['latin'],variable:'--f-sans'});
export const metadata={title:'Beauty_bypndd | Le luxe à petit prix',description:'Sephora, Rituals, Huda Beauty, The Ordinary, MAC, NYX et plus. Authentique, tendance, prix accessibles.'};
const nav=[['maquillage','Maquillage'],['soins-visage','Visage'],['soins-corps','Corps'],['parfums-brumes','Parfums'],['coffrets-cadeaux','Coffrets'],['rituals','Rituals'],['cheveux','Cheveux'],['mode','Mode'],['sacs-accessoires','Sacs'],['nouveautes','Nouveautés'],['promotions','Promos']];
export default function L({children}:{children:React.ReactNode}){return <html lang="fr"><body className={`${serif.variable} ${sans.variable}`}><CartProvider>
<header className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-sand"><div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
<Link href="/" className="font-serif text-2xl">Beauty_bypndd</Link><CartLink/></div>
<nav className="flex gap-5 overflow-x-auto px-4 pb-3 max-w-6xl mx-auto text-sm whitespace-nowrap">{nav.map(([s,n])=><Link key={s} href={`/categorie/${s}`}>{n}</Link>)}</nav></header>
<main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
<footer className="border-t border-sand px-4 py-8 text-sm text-center">Beauty_bypndd · Votre beauté, vos marques préférées, vos petits prix.<br/><a className="underline" href={process.env.NEXT_PUBLIC_INSTAGRAM}>Instagram</a></footer>
<a href={`https://wa.me/${WA}`} className="fixed bottom-4 right-4 bg-ink text-white rounded-full px-5 py-3 text-sm shadow-lg">WhatsApp</a>
</CartProvider></body></html>}
