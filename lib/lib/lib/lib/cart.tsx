'use client';
import {createContext,useContext,useEffect,useState} from 'react';
export type Line={id:string;name:string;price:number;qty:number;image?:string;variant?:string};
const C=createContext<any>(null);
export const useCart=()=>useContext(C);
export function CartProvider({children}:{children:React.ReactNode}){
 const [lines,setLines]=useState<Line[]>([]);
 useEffect(()=>{try{setLines(JSON.parse(localStorage.getItem('cart')||'[]'))}catch{}},[]);
 useEffect(()=>{localStorage.setItem('cart',JSON.stringify(lines))},[lines]);
 const add=(l:Line)=>setLines(a=>{const k=a.find(x=>x.id===l.id&&x.variant===l.variant);return k?a.map(x=>x===k?{...x,qty:x.qty+l.qty}:x):[...a,l]});
 const setQty=(i:number,q:number)=>setLines(a=>a.map((x,j)=>j===i?{...x,qty:Math.max(1,q)}:x));
 const remove=(i:number)=>setLines(a=>a.filter((_,j)=>j!==i));
 const clear=()=>setLines([]);
 const count=lines.reduce((s,l)=>s+l.qty,0),subtotal=lines.reduce((s,l)=>s+l.qty*l.price,0);
 return <C.Provider value={{lines,add,setQty,remove,clear,count,subtotal}}>{children}</C.Provider>}
