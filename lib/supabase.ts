import {createClient, type SupabaseClient} from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Configuration Supabase manquante : vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans les variables d’environnement Vercel.'
    );
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey);
  }

  return supabaseInstance;
}

// Initialise Supabase uniquement lors de sa première utilisation.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getSupabaseClient();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export const WA = process.env.NEXT_PUBLIC_WHATSAPP || '';

export const eur = (n: number, c?: string) =>
  `${new Intl.NumberFormat('fr-FR', {maximumFractionDigits: 2}).format(Number(n))} DH`;

export const AVAIL: Record<string, string> = {
  available: 'Disponible immédiatement',
  arrival: 'Arrivage prochainement',
  preorder: 'Précommande',
  last: 'Dernières pièces',
  soldout: 'Stock épuisé',
};
