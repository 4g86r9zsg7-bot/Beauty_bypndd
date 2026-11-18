
'use client';

import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useCart} from '@/lib/cart';

export default function CardBuy({p}:{p:any}){
  const {add,lines}=useCart();
  const router=useRouter();
  const [ok,setOk]=useState(false);
  const [busy,setBusy]=useState(false);

  const pre=p.availability==='preorder';
  const arr=p.availability==='arrival';
  const hasV=(p.variants||[]).length>0;
  const sold=p.availability==='soldout'||(!pre&&!arr&&p.stock<=0);

  const base="mt-2 block w-full rounded-full border py-2.5 text-center text-[11px] uppercase tracking-[0.16em] transition";

  const href=`/produit/${p.slug}`;

  if(sold)return (
    <Link href={href} className={`${base} border-ink/30 text-ink/50`}>
      Indisponible
    </Link>
  );

  if(arr)return (
    <Link href={href} className={`${base} border-plum text-plum`}>
      Réserver
    </Link>
  );

  if(pre)return (
    <Link href={href} className={`${base} border-plum text-plum`}>
      Précommander
    </Link>
  );

  if(hasV)return (
    <Link href={href} className={`${base} border-ink text-ink`}>
      Choisir les options
    </Link>
  );

  const inCart=(lines||[]).find(
    (l:any)=>l.id===p.id&&!l.variant
  )?.qty||0;

  const full=p.stock!=null&&inCart>=p.stock;

  const addProduct=()=>{
    add({
      id:p.id,
      name:p.name,
      price:Number(p.price),
      qty:1,
      image:p.images?.[0],
      variant:'',
      max:p.stock??null
    });
  };

  const buyNow=()=>{
    if(full||busy)return;

    setBusy(true);
    addProduct();
    router.push('/panier');
  };

  return (
    <div className="mt-2 space-y-2">
      <button
        type="button"
        disabled={full}
        onClick={()=>{
          addProduct();
          setOk(true);
          setTimeout(()=>setOk(false),1800);
        }}
        className={`${base} mt-0 border-ink ${ok?'bg-plum':'bg-ink'} text-white disabled:opacity-40`}
      >
        {full
          ?'Stock maximum atteint'
          :ok
            ?'✓ Ajouté au panier'
            :'Ajouter au panier'}
      </button>

      <button
        type="button"
        disabled={full||busy}
        onClick={buyNow}
        className={`${base} mt-0 border-plum bg-plum text-white hover:bg-rose disabled:opacity-40`}
      >
        {busy?'Redirection…':'Acheter maintenant'}
      </button>
    </div>
  );
}
