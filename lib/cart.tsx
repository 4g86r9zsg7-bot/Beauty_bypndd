'use client';
import {createContext,useContext,useEffect,useState} from 'react';
export type Line={id:string;name:string;price:number;qty:number;image?:string;variant?:string;max?:number|null;pre?:boolean;offer?:string};
const C=createContext<any>(null);
export const useCart=()=>useContext(C);
const cap=(q:number,m?:number|null)=>m!=null?Math.min(q,Math.max(m,1)):q;
export function CartProvider({children}:{children:React.ReactNode}){
 const [lines,setLines]=useState<Line[]>([]);
 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{
  try{
   const saved=localStorage.getItem('cart');
   const parsed=saved?JSON.parse(saved):[];
   setLines(Array.isArray(parsed)?parsed:[]);
  }catch{
   setLines([]);
  }finally{
   setHydrated(true);
  }
 },[]);
 useEffect(()=>{
  if(!hydrated)return;
  try{
   localStorage.setItem('cart',JSON.stringify(lines));
  }catch{}
 },[lines,hydrated]);
 const add=(l:Line)=>setLines(a=>{const k=a.find(x=>x.id===l.id&&x.variant===l.variant);if(k){const m=l.max??k.max;return a.map(x=>x===k?{...x,max:m,pre:l.pre,qty:cap(x.qty+l.qty,m)}:x)}return [...a,{...l,qty:cap(l.qty,l.max)}]});
 const setQty=(i:number,q:number)=>setLines(a=>a.map((x,j)=>j===i?{...x,qty:cap(Math.max(1,q),x.max)}:x));
 const remove=(i:number)=>setLines(a=>a.filter((_,j)=>j!==i));
 const clear=()=>setLines([]);
 const count=lines.reduce((s,l)=>s+l.qty,0),subtotal=lines.reduce((s,l)=>s+l.qty*l.price,0);
 return <C.Provider value={{lines,add,setQty,remove,clear,count,subtotal}}>{children}</C.Provider>}
