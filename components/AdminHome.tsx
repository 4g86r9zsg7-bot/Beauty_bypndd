
'use client';

import {useMemo,useState} from 'react';
import Link from 'next/link';

type Order={
  id:string;
  number?:number|string;
  name?:string;
  total?:number|string;
  status:string;
  created_at:string;
  items?:any[];
};

type Product={
  id:string;
  name:string;
  sold?:number;
  stock?:number;
  availability?:string;
  active?:boolean;
};

type S={
  orders:number;
  pending:number;
  revenue:string;
  products:number;
  low:number;
  out:number;
  hiddenReviews:number;
  promos:number;
  orderRows?:Order[];
  productRows?:Product[];
};

type Card={
  key:string;
  label:string;
  desc:string;
  badge?:string;
  alert?:boolean;
  icon:string;
  tab?:string;
  href?:string;
};

const money=(n:number)=>new Intl.NumberFormat('fr-MA',{
  style:'currency',
  currency:'MAD',
  maximumFractionDigits:0
}).format(n);

export default function AdminHome({stats:s,go,editProduct}:{
  stats:S;
  go:(t:string)=>void;
  editProduct:(p:Product)=>void
}){
  const [period,setPeriod]=useState<'7'|'30'|'all'>('7');

  const orders=s.orderRows||[];
  const products=s.productRows||[];

  const delivered=orders.filter(o=>o.status==='delivered');
  const ongoing=orders.filter(o=>['confirmed','preparing','shipped'].includes(o.status));
  const pending=orders.filter(o=>o.status==='pending');
  const preorderOrders=orders.filter(o=>!['delivered','cancelled'].includes(o.status)&&(o.items||[]).some(i=>i.preorder));

  const periodOrders=useMemo(()=>{
    if(period==='all'){
      const from=new Date();
      from.setDate(1);
      from.setHours(0,0,0,0);
      from.setMonth(from.getMonth()-11);
      return delivered.filter(o=>new Date(o.created_at)>=from);
    }
    const days=Number(period);
    const from=new Date();
    from.setHours(0,0,0,0);
    from.setDate(from.getDate()-days+1);
    return delivered.filter(o=>new Date(o.created_at)>=from);
  },[orders,period]);

  const periodRevenue=periodOrders.reduce((sum,o)=>sum+Number(o.total||0),0);
  const average=delivered.length
    ?delivered.reduce((sum,o)=>sum+Number(o.total||0),0)/delivered.length
    :0;

  const chart=useMemo(()=>{
    const count=period==='7'?7:period==='30'?30:12;
    return Array.from({length:count},(_,i)=>{
      const date=new Date();
      if(period==='all'){
        date.setDate(1);
        date.setMonth(date.getMonth()-(count-1-i));
      }else{
        date.setHours(0,0,0,0);
        date.setDate(date.getDate()-(count-1-i));
      }

      const total=periodOrders
        .filter(o=>{
          const d=new Date(o.created_at);
          return period==='all'
            ?d.getFullYear()===date.getFullYear()&&d.getMonth()===date.getMonth()
            :d.toDateString()===date.toDateString();
        })
        .reduce((sum,o)=>sum+Number(o.total||0),0);

      return {
        label:period==='all'
          ?date.toLocaleDateString('fr-FR',{month:'short',year:'2-digit'})
          :date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}),
        total
      };
    });
  },[period,periodOrders]);

  const maxBar=Math.max(1,...chart.map(x=>x.total));

  const best=products
    .filter(p=>Number(p.sold||0)>0)
    .sort((a,b)=>Number(b.sold||0)-Number(a.sold||0))
    .slice(0,5);

  const low=products.filter(p=>
    p.active&&
    !['preorder','arrival','soldout'].includes(p.availability||'')&&
    Number(p.stock)>0&&Number(p.stock)<=3
  );

  const out=products.filter(p=>p.active&&p.availability==='soldout');

  const cards:Card[]=[
    {
      key:'orders',tab:'orders',label:'Commandes',
      desc:'Suivre, confirmer et livrer les commandes',
      badge:pending.length?`${pending.length} en attente`:`${s.orders} au total`,
      alert:pending.length>0,icon:'▤'
    },
    {
      key:'products',tab:'products',label:'Produits',
      desc:'Prix, stock, disponibilité et mise en avant',
      badge:`${s.products} produits${out.length?` · ${out.length} épuisés`:''}`,
      alert:low.length>0,icon:'◇'
    },
    {
      key:'new',tab:'new',label:'Ajouter un produit',
      desc:'Créer un produit avec ses variantes et photos',
      icon:'+'
    },
    {
      key:'offers',href:'/admin/offres',label:'Offres & Packs',
      desc:'Packs, 2+1 offert, dates et quantités',
      icon:'♧'
    },
    {
      key:'promos',tab:'promos',label:'Codes promo',
      desc:'Créer et suivre les codes de réduction',
      badge:`${s.promos} actif${s.promos>1?'s':''}`,
      icon:'%'
    },
    {
      key:'reviews',tab:'reviews',label:'Avis clientes',
      desc:'Valider les avis avant leur publication',
      badge:s.hiddenReviews?`${s.hiddenReviews} à valider`:undefined,
      alert:s.hiddenReviews>0,icon:'☆'
    },
    {
      key:'categories',href:'/admin/categories',
      label:'Catégories & marques',
      desc:'Ordre, images et logos des marques',
      icon:'▦'
    },
    {
      key:'banner',href:'/admin/banniere',
      label:'Bannière d’accueil',
      desc:'Changer l’image de la bannière',
      icon:'▧'
    },
    {
      key:'site',href:'/',
      label:'Voir le site',
      desc:'Ouvrir la boutique comme vos clientes',
      icon:'↗'
    }
  ];

  const cls="group flex items-start gap-4 rounded-2xl border border-sand bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-plum hover:shadow-md active:scale-[0.99]";

  const inner=(c:Card)=>(
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blush text-2xl text-plum transition group-hover:bg-plum group-hover:text-white">
        {c.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-xl text-plum">{c.label}</span>
        <span className="mt-0.5 block text-xs text-ink/60">{c.desc}</span>
        {c.badge&&(
          <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] ${c.alert?'bg-rose text-white':'bg-sand text-ink/70'}`}>
            {c.badge}
          </span>
        )}
      </span>
      <span className="self-center text-plum/40" aria-hidden="true">›</span>
    </>
  );

  return (
    <div className="space-y-7">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-rose">
          BeautyByPND · Administration
        </p>
        <h1 className="mt-1 font-serif text-3xl text-plum">Tableau de bord</h1>
        <p className="mt-1 text-sm text-ink/60">
          Vue d’ensemble de votre boutique
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-sand bg-white p-4">
          <p className="text-xs text-ink/60">Chiffre d’affaires livré</p>
          <p className="mt-2 font-serif text-2xl text-plum">{s.revenue}</p>
          <p className="mt-1 text-[11px] text-ink/50">Commandes livrées uniquement</p>
        </div>
        <div className="rounded-2xl border border-sand bg-white p-4">
          <p className="text-xs text-ink/60">Commandes livrées</p>
          <p className="mt-2 font-serif text-2xl text-plum">{delivered.length}</p>
          <p className="mt-1 text-[11px] text-ink/50">Terminées</p>
        </div>
        <div className="rounded-2xl border border-sand bg-white p-4">
          <p className="text-xs text-ink/60">Ventes en cours</p>
          <p className="mt-2 font-serif text-2xl text-plum">{ongoing.length}</p>
          <p className="mt-1 text-[11px] text-ink/50">Confirmées à livrer</p>
        </div>
        <div className={`rounded-2xl border p-4 ${pending.length?'border-rose/40 bg-blush/40':'border-sand bg-white'}`}>
          <p className="text-xs text-ink/60">À traiter</p>
          <p className="mt-2 font-serif text-2xl text-plum">{pending.length}</p>
          <p className="mt-1 text-[11px] text-ink/50">Commandes en attente</p>
        </div>
      </div>

      <section className="rounded-2xl border border-sand bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl text-plum">Chiffre d’affaires</h2>
            <p className="mt-1 text-xs text-ink/60">Commandes livrées uniquement</p>
          </div>
          <div className="flex rounded-full bg-blush p-1 text-xs">
            {([
              ['7','7 jours'],
              ['30','30 jours'],
              ['all','12 mois']
            ] as const).map(([v,label])=>(
              <button
                key={v}
                type="button"
                onClick={()=>setPeriod(v)}
                className={`rounded-full px-3 py-2 transition ${period===v?'bg-plum text-white':'text-plum'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 font-serif text-3xl text-plum">{money(periodRevenue)}</p>
        <p className="mt-1 text-xs text-ink/50">
          {periodOrders.length} commande(s) livrée(s) sur cette période
        </p>

        <div className="mt-6 flex h-36 items-end gap-1.5">
          {chart.map((x,i)=>(
            <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <div className="flex h-full w-full items-end">
                <div
                  title={`${x.label} : ${money(x.total)}`}
                  className="w-full rounded-t-md bg-rose/80 transition-all"
                  style={{height:`${x.total?Math.max(5,x.total/maxBar*100):2}%`}}
                />
              </div>
              {(period!=='30'||i%5===0||i===chart.length-1)&&(
                <span className="whitespace-nowrap text-[9px] text-ink/50">{x.label}</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-sand pt-4">
          <p className="text-xs text-ink/60">Panier moyen depuis le début de l’activité</p>
          <p className="mt-1 font-semibold text-plum">{money(average)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-4">
        <h2 className="font-serif text-xl text-plum">À faire aujourd’hui</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" onClick={()=>go("orders")} className="rounded-xl border border-sand p-3 text-left">
            <b className="block text-2xl text-plum">{pending.length}</b>
            <span className="text-sm">Commandes à confirmer</span>
          </button>
          <button type="button" onClick={()=>go("orders")} className="rounded-xl border border-sand p-3 text-left">
            <b className="block text-2xl text-plum">{ongoing.length}</b>
            <span className="text-sm">Commandes à préparer / suivre</span>
          </button>
          <button type="button" onClick={()=>go("orders")} className="rounded-xl border border-sand p-3 text-left">
            <b className="block text-2xl text-plum">{preorderOrders.length}</b>
            <span className="text-sm">Précommandes à suivre</span>
          </button>
        </div>
        {(low.length>0||out.length>0)&&<div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-ink/60">Stocks à vérifier</p>
          {[...out,...low].slice(0,5).map(p=><div key={p.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <span className="text-xs text-rose">{p.availability==="soldout"?"Épuisé":String(p.stock)+" restant(s)"}</span>
            <button type="button" onClick={()=>editProduct(p)} className="text-xs underline">Modifier</button>
          </div>)}
        </div>}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-sand bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-plum">Alertes de stock</h2>
            <span className="rounded-full bg-blush px-3 py-1 text-xs text-plum">
              {low.length+out.length}
            </span>
          </div>
          {low.length===0&&out.length===0?(
            <p className="mt-4 text-sm text-ink/60">Aucune alerte de stock.</p>
          ):(
            <div className="mt-3 space-y-3">
              {low.slice(0,4).map(p=>(
                <div key={p.id} className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 text-rose">{p.stock} restant(s)</span>
                </div>
              ))}
              {out.slice(0,3).map(p=>(
                <div key={p.id} className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 text-red-700">Épuisé</span>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={()=>go('products')} className="mt-4 text-xs font-semibold text-plum underline">
            Gérer les produits
          </button>
        </div>

        <div className="rounded-2xl border border-sand bg-white p-4">
          <h2 className="font-serif text-xl text-plum">Meilleures ventes</h2>
          {best.length===0?(
            <p className="mt-4 text-sm text-ink/60">Aucune vente enregistrée pour le moment.</p>
          ):(
            <div className="mt-3 space-y-3">
              {best.map((p,i)=>(
                <div key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blush text-xs text-plum">{i+1}</span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="shrink-0 font-semibold text-plum">{p.sold} vendus</span>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={()=>go('products')} className="mt-4 text-xs font-semibold text-plum underline">
            Voir les produits
          </button>
        </div>
      </section>

      <div>
        <h2 className="mb-3 font-serif text-xl text-plum">Gestion de la boutique</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {cards.map(c=>c.href
            ?<Link key={c.key} href={c.href} className={cls}>{inner(c)}</Link>
            :<button key={c.key} type="button" onClick={()=>go(c.tab as string)} className={cls}>{inner(c)}</button>
          )}
        </div>
      </div>
    </div>
  );
}
