import {createClient} from '@supabase/supabase-js';
export const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export const WA=process.env.NEXT_PUBLIC_WHATSAPP||'';
export const eur=(n:number,c?:string)=>`${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(Number(n))} DH`;
export const AVAIL:Record<string,string>={available:'Disponible immédiatement',arrival:'Arrivage prochainement',preorder:'Précommande',last:'Dernières pièces',soldout:'Stock épuisé'};
