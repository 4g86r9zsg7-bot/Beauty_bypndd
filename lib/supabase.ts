import {createClient, type SupabaseClient} from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let missingConfigWarningShown = false;

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (!missingConfigWarningShown) {
      console.error(
        '[BeautyByPND] Configuration Supabase absente : les données distantes seront indisponibles jusqu’à la configuration des variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
      missingConfigWarningShown = true;
    }
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey);
  }

  return supabaseInstance;
}

/**
 * Réponse inoffensive utilisée uniquement lorsque les variables Supabase
 * sont absentes (notamment pendant un build Preview mal configuré).
 * Elle permet au rendu statique de terminer sans inventer de données.
 */
function createUnavailableQuery(): any {
  const result = {
    data: null,
    error: {
      message: 'Supabase indisponible : variables d’environnement manquantes.',
      code: 'SUPABASE_ENV_MISSING',
    },
    count: null,
    status: 503,
    statusText: 'Supabase configuration missing',
  };

  let query: any;
  query = new Proxy({}, {
    get(_target, property) {
      if (property === 'then') {
        return (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, reject);
      }
      if (property === 'catch') {
        return (reject: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject);
      }
      if (property === 'finally') {
        return (callback: () => void) => Promise.resolve(result).finally(callback);
      }
      return () => query;
    },
  });
  return query;
}

// Le client n’est créé qu’au premier accès, après vérification de la configuration.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getSupabaseClient();
    if (!client) {
      if (property === 'from' || property === 'rpc') {
        return () => createUnavailableQuery();
      }
      return undefined;
    }

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
