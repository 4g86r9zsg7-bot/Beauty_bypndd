'use client';

import { useState } from 'react';

type ImportedProduct = {
  name?: string;
  description?: string;
  price?: number | null;
  currency?: string;
  brand?: string;
  sku?: string;
  mpn?: string;
  images?: string[];
};

type Props = {
  onImport: (product: ImportedProduct) => void;
};

export default function ProductImporter({ onImport }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [missing, setMissing] = useState<string[]>([]);
  const [detected, setDetected] = useState<ImportedProduct | null>(null);

  async function analyze() {
    if (!url.trim()) {
      setMessage('Colle d’abord le lien du produit.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setMissing([]);
      setDetected(null);

      const response = await fetch('/api/product-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Impossible d’analyser cette page.');
      }

      const product: ImportedProduct = result.product || {};

      setDetected(product);
      setMissing(Array.isArray(result.missing) ? result.missing : []);
      onImport(product);
      setMessage('Analyse terminée. Vérifie les informations dans le formulaire avant de les enregistrer.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue pendant l’analyse.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-900">
          Importer depuis un lien
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-600">
          Colle le lien d’un produit pour récupérer automatiquement les
          informations et les photos disponibles.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemple.com/produit"
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-rose-400"
        />

        <button
          type="button"
          onClick={analyze}
          disabled={loading}
          className="rounded-xl bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Analyse en cours…' : 'Analyser le produit'}
        </button>
      </div>

      {message && (
        <p className="mt-3 text-sm text-gray-700" role="status">
          {message}
        </p>
      )}

      {detected && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Informations détectées
          </p>

          <p className="mt-2 text-sm text-gray-800">
            **Produit :** {detected.name || 'Non détecté'}
          </p>

          {detected.brand && (
            <p className="mt-1 text-sm text-gray-700">
              Marque : {detected.brand}
            </p>
          )}

          {detected.price != null && (
            <p className="mt-1 text-sm text-gray-700">
              Prix source : {detected.price} {detected.currency || ''}
            </p>
          )}

          {(detected.sku || detected.mpn) && (
            <p className="mt-1 text-sm text-gray-700">
              Référence : {[detected.sku, detected.mpn]
                .filter(Boolean)
                .join(' / ')}
            </p>
          )}

          <p className="mt-2 text-sm text-gray-700">
            Photos détectées : {detected.images?.length || 0}
          </p>

          {missing.length > 0 && (
            <p className="mt-3 text-xs text-amber-700">
              Informations non trouvées : {missing.join(', ')}
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Rien n’est enregistré automatiquement. Tu gardes le contrôle et tu
        valides toi-même avec le bouton Enregistrer.
      </p>
    </section>
  );
}
