'use client';

import {useEffect,useState} from 'react';
import Shelf from '@/components/Shelf';

type Group={
  tone:string;
  title:string;
  href:string;
  items:any[];
};

const VIEWED_KEY='beautybypndd_viewed_products';
const SESSION_KEY='beautybypndd_discovery_session';

function hash(value:string){
  let h=2166136261;
  for(let i=0;i<value.length;i++){
    h^=value.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

function readViewed(){
  try{
    const saved=JSON.parse(localStorage.getItem(VIEWED_KEY)||'[]');
    return new Set<string>(Array.isArray(saved)?saved.filter((id:any)=>typeof id==='string'):[]);
  }catch{
    return new Set<string>();
  }
}

function getSessionSeed(){
  try{
    let seed=sessionStorage.getItem(SESSION_KEY);
    if(!seed){
      seed=String(Math.random()).slice(2);
      sessionStorage.setItem(SESSION_KEY,seed);
    }
    return seed;
  }catch{
    return String(Date.now());
  }
}

export default function HomeShelves({groups,olderItems}:{groups:Group[];olderItems:any[]}){
  const [selection,setSelection]=useState<{groups:Group[];older:any[]}>({
    groups:groups.map(group=>({...group,items:group.items.slice(0,8)})),
    older:olderItems.slice(0,8)
  });

  useEffect(()=>{
    const viewed=readViewed();
    const seed=getSessionSeed();
    const used=new Set<string>();

    const rank=(items:any[],tone:string)=>{
      return [...items]
        .filter((p:any)=>p&&p.id&&p.availability!=='soldout')
        .filter((p:any)=>tone!=='promo'||(Number(p.old_price)>Number(p.price)&&Number(p.price)>0))
        .sort((a:any,b:any)=>{
          const aSeen=viewed.has(a.id)?1:0;
          const bSeen=viewed.has(b.id)?1:0;
          if(aSeen!==bSeen)return aSeen-bSeen;
          return hash(seed+tone+String(a.id))-hash(seed+tone+String(b.id));
        });
    };

    const selected=groups.map(group=>{
      const candidates=rank(group.items,group.tone);
      const unseen=candidates.filter((p:any)=>!viewed.has(p.id)&&!used.has(p.id));
      const seen=candidates.filter((p:any)=>viewed.has(p.id)&&!used.has(p.id));
      const items=[...unseen,...seen].slice(0,8);
      items.forEach((p:any)=>used.add(p.id));
      return {...group,items};
    }).filter(group=>group.items.length>0);

    const olderCandidates=rank(olderItems,'anciens')
      .filter((p:any)=>!used.has(p.id));
    const olderUnseen=olderCandidates.filter((p:any)=>!viewed.has(p.id));
    const olderSeen=olderCandidates.filter((p:any)=>viewed.has(p.id));
    const older=[...olderUnseen,...olderSeen].slice(0,8);

    setSelection({groups:selected,older});
  },[groups,olderItems]);

  return (
    <div className="mt-8 space-y-2">
      {selection.groups.map(group=>(
        <Shelf
          key={group.tone}
          tone={group.tone}
          title={group.title}
          href={group.href}
          items={group.items}
        />
      ))}
      {selection.older.length>0&&(
        <Shelf
          tone="anciens"
          title="À redécouvrir"
          href="/categorie/tous?sort=old"
          items={selection.older}
        />
      )}
    </div>
  );
}
