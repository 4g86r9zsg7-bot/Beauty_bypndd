
import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import {Cormorant_Garamond,Inter} from 'next/font/google';
import {CartProvider} from '@/lib/cart';
import {WA} from '@/lib/supabase';
import CartLink from '@/components/CartLink';
import SideMenu from '@/components/SideMenu';
import Shortcuts from '@/components/Shortcuts';
import BellLink from '@/components/BellLink';
import HeaderSearch from '@/components/HeaderSearch';
import {ClientProvider} from '@/components/ClientProvider';
import {WhatsAppIcon,InstagramIcon} from '@/components/SocialIcons';
import {IG} from '@/lib/shop';

const serif=Cormorant_Garamond({
  subsets:['latin'],
  weight:['400','500','600'],
  style:['normal','italic'],
  variable:'--f-serif'
});

const sans=Inter({
  subsets:['latin'],
  variable:'--f-sans'
});

export const metadata:Metadata={
  metadataBase:new URL('https://beautybypnd.com'),
  title:{
    default:'Beauty_bypndd | Beauté, Maquillage, Parfums et Soins',
    template:'%s | Beauty_bypndd'
  },
  description:'Découvrez Beauty_bypndd : maquillage, parfums, brumes parfumées, soins et produits de beauté de grandes marques. Découvrez nos nouveautés et offres exclusives.',
  applicationName:'Beauty_bypndd',
  verification:{
    google:'VvULh4JxJ0Kn_J4o-AlyXTQxHC5MYaGg1SEW4u0EmXc'
  },
  keywords:[
    'Beauty_bypndd',
    'boutique beauté',
    'maquillage',
    'parfums',
    'brumes parfumées',
    'soins visage',
    'soins corps',
    'cosmétiques',
    'Huda Beauty',
    'Sephora',
    'Rituals',
    'The Ordinary',
    'MAC',
    'NYX'
  ],
  openGraph:{
    title:'Beauty_bypndd | L’élégance au féminin',
    description:'Maquillage, soins, parfums et produits de beauté de grandes marques. Découvrez les nouveautés et offres exclusives Beauty_bypndd.',
    siteName:'Beauty_bypndd',
    locale:'fr_FR',
    type:'website'
  },
  twitter:{
    card:'summary',
    title:'Beauty_bypndd | L’élégance au féminin',
    description:'Maquillage, soins, parfums et produits de beauté. Découvrez Beauty_bypndd.'
  },
  robots:{
    index:true,
    follow:true,
    googleBot:{
      index:true,
      follow:true
    }
  }
};

export default function L({children}:{children:React.ReactNode}){
  return <html lang="fr">
    <body className={`${serif.variable} ${sans.variable} overflow-x-hidden`}>
      <ClientProvider>
        <CartProvider>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-[#0c0208] px-4 py-2.5 text-center text-[11px] uppercase tracking-[0.18em] text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EE6FB0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/>
              <circle cx="7" cy="17.5" r="1.8"/>
              <circle cx="17" cy="17.5" r="1.8"/>
            </svg>
            <span>Livraison à domicile en 24 à 48 h</span>
            <span className="text-[#EE6FB0]">•</span>
            <span>Paiement à la livraison</span>
          </div>

          <header className="border-b border-white/10 bg-[#14040c]/95 text-white backdrop-blur">
            <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-4 py-3 lg:gap-6 lg:px-8">
              <SideMenu/>
              <Link href="/" className="mx-auto text-center leading-none lg:mx-0 lg:text-left">
                <span className="block font-serif text-3xl italic text-white lg:text-4xl">beautybypnd</span>
                <span className="mt-1 block whitespace-nowrap text-[8px] uppercase tracking-[0.3em] text-[#EE6FB0] lg:text-[10px]">L’élégance au féminin</span>
              </Link>
              <div className="hidden flex-1 justify-center lg:flex">
                <Shortcuts header/>
              </div>
              <div className="flex items-center gap-0.5">
                <HeaderSearch/>
                <BellLink/>
                <CartLink/>
              </div>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 py-6">
            {children}
          </main>

          <footer className="bg-deep text-white px-4 py-10 text-xs tracking-[0.15em] uppercase text-center">
            <p>Beauty_bypndd · L’élégance au féminin</p>
            <nav className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link href="/livraison" aria-label="Livraison" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/>
                  <circle cx="7" cy="17.5" r="1.8"/>
                  <circle cx="17" cy="17.5" r="1.8"/>
                </svg>
              </Link>
              <Link href="/contact" aria-label="Contact" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2"/>
                  <path d="M3.5 7l8.5 6 8.5-6"/>
                </svg>
              </Link>
              <span className="flex items-center gap-3">
                <a href={IG} aria-label="Instagram"><InstagramIcon size={36}/></a>
                <a href={`https://wa.me/${WA}`} aria-label="WhatsApp"><WhatsAppIcon size={36}/></a>
              </span>
            </nav>
          </footer>

          <a href={`https://wa.me/${WA}`} aria-label="WhatsApp" className="fixed bottom-4 right-4 z-30 rounded-full shadow-lg">
            <WhatsAppIcon size={56}/>
          </a>
        </CartProvider>
      </ClientProvider>
    </body>
  </html>
}
