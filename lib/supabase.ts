import {createClient} from '@supabase/supabase-js';

// Les variables définies dans Vercel restent prioritaires.
// La clé publishable est publique et peut être utilisée côté navigateur.
// Le secours permet aux builds Preview de fonctionner même si Vercel
// ne transmet pas les variables NEXT_PUBLIC_* à cette branche.
const SUPABASE_URL=
  process.env.NEXT_PUBLIC_SUPABASE_URL||
  'https://aiuraeivdfihnialarfz.supabase.co';

const SUPABASE_PUBLIC_KEY=
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||
  'sb_publishable_jtUEf0ze_Lid_oFDV6-0Qg_UcTkMtAu';

export const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLIC_KEY);
export const WA=process.env.NEXT_PUBLIC_WHATSAPP||'';
export const eur=(n:number,c?:string)=>`${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(Number(n))} DH`;
export const AVAIL:Record<string,string>={available:'Disponible immédiatement',arrival:'Arrivage prochainement',preorder:'Précommande',last:'Dernières pièces',soldout:'Stock épuisé'};
