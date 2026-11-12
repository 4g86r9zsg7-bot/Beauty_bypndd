import {createClient} from '@supabase/supabase-js';
export const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export const WA=process.env.NEXT_PUBLIC_WHATSAPP||'';
export const eur=(n:number,c='EUR')=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:c}).format(n);
export const AVAIL:Record<string,string>={available:'Disponible immédiatement',arrival:'Arrivage prochainement',preorder:'Précommande',last:'Dernières pièces',soldout:'Stock épuisé'};
