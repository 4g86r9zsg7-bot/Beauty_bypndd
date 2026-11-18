'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

// Barre de navigation affichée sur les sous-pages de l'administration (pas sur /admin, qui a son propre tableau de bord).
const ITEMS:[string,string,string][]=[
  ['/admin','/admin','Tableau de bord'],
  ['/admin?tab=orders','','Commandes'],
  ['/admin?tab=products','','Produits'],
  ['/admin/offres','/admin/offres','Offres & Packs'],
  ['/admin/categories','/admin/categories','Catégories & marques'],
  ['/admin/banniere','/admin/banniere','Bannière'],
];
export default function AdminSubNav(){
  const p=usePathname();
  if(!p||p==='/admin'||p==='/admin/')return null;
  return (
    <nav aria-label="Administration" className="-mx-4 mb-5 flex gap-2 overflow-x-auto border-b border-sand px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ITEMS.map(([href,match,label])=>{
        const on=!!match&&p.startsWith(match)&&match!=='/admin';
        return <Link key={href} href={href} aria-current={on?'page':undefined} className={`shrink-0 rounded-full border px-4 py-2 text-xs ${on?'border-plum bg-plum text-white':'border-sand bg-white text-plum'}`}>{label}</Link>;
      })}
    </nav>
  );
}
