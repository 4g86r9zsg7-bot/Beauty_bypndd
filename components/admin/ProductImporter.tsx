
'use client';

import { useState } from 'react';

type ImportedVariant = {
  name?: string;
  value?: string;
  sku?: string;
  price?: number | null;
  stock?: number | null;
  images?: string[];
};

type ImportedProduct = {
  name?: string;
  description?: string;
  price?: number | null;
  currency?: string;
  brand?: string;
  sku?: string;
  mpn?: string;
  images?: string[];
  variants?: ImportedVariant[];
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
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ImportedVariant[]>([]);
  const [saving, setSaving] = useState(false);

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
      setImages([]);
      setVariants([]);

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

      const productImages = Array.isArray(product.images)
        ? [...new Set(product.images.filter(
            (image): image is string =>
              typeof image === 'string' &&
              /^https?:\/\//i.test(image)
          ))]
        : [];

      const productVariants = Array.isArray(product.variants)
        ? product.variants.map((variant: ImportedVariant) => ({
            ...variant,
            images: Array.isArray(variant.images)
              ? variant.images.filter(
                  (image): image is string =>
                    typeof image === 'string' &&
                    /^https?:\/\//i.test(image)
                )
              : [],
          }))
        : [];

      setDetected(product);
      setImages(productImages);
      setVariants(productVariants);
      setMissing(Array.isArray(result.missing) ? result.missing : []);

      setMessage(
        'Analyse terminée. Vérifie les informations, les photos et les variantes.'
      );
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

  function removeImage(index: number) {
    const removed = images[index];

    setImages(current => current.filter((_, i) => i !== index));

    setVariants(current =>
      current.map(variant => ({
        ...variant,
        images: (variant.images || []).filter(image => image !== removed),
      }))
    );
  }

  function moveImage(index: number, direction: number) {
    const target = index + direction;

    if (target < 0 || target >= images.length) return;

    setImages(current => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateVariant(
    index: number,
    field: keyof ImportedVariant,
    value: string
  ) {
    setVariants(current =>
      current.map((variant, i) =>
        i === index
          ? {
              ...variant,
              [field]:
                field === 'price' || field === 'stock'
                  ? value === '' ? null : Number(value)
                  : value,
            }
          : variant
      )
    );
  }

  function addVariant() {
    setVariants(current => [
      ...current,
      { name: 'Option', value: '', images: [] },
    ]);
  }

  function removeVariant(index: number) {
    setVariants(current => current.filter((_, i) => i !== index));
  }

  function toggleVariantImage(variantIndex: number, image: string) {
    setVariants(current =>
      current.map((variant, i) => {
        if (i !== variantIndex) return variant;

        const currentImages = variant.images || [];
        const exists = currentImages.includes(image);

        return {
          ...variant,
          images: exists
            ? currentImages.filter(item => item !== image)
            : [...currentImages, image],
        };
      })
    );
  }

  function validateImport() {
    if (!detected) return;

    setSaving(true);

    onImport({
      ...detected,
      images,
      variants,
    });

    setMessage(
      'Informations transmises au formulaire. Vérifie encore la fiche avant de cliquer sur Enregistrer.'
    );

    setSaving(false);
  }

  return (
    <section className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-900">
          Importer depuis un lien
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-600">
          Colle le lien d’un produit pour récupérer les informations,
          les photos et les variantes disponibles.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
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
        <div className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-white p-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Informations détectées
            </p>

            <p className="mt-2 text-sm text-gray-800">
              <strong>Produit :</strong> {detected.name || 'Non détecté'}
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
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">
                Photos du produit ({images.length})
              </p>
              <p className="text-xs text-gray-500">
                Première photo = principale
              </p>
            </div>

            {images.length === 0 ? (
              <p className="text-xs text-gray-500">
                Aucune photo détectée.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="overflow-hidden rounded-xl border border-gray-200"
                  >
                    <img
                      src={image}
                      alt={`Photo ${index + 1}`}
                      className="h-32 w-full bg-gray-50 object-contain"
                      loading="lazy"
                    />

                    <div className="flex items-center justify-between gap-1 p-2">
                      <span className="text-xs text-gray-500">
                        {index === 0 ? 'Principale' : `Photo ${index + 1}`}
                      </span>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(index, -1)}
                          disabled={index === 0}
                          className="rounded-md border px-2 py-1 text-xs disabled:opacity-30"
                          aria-label="Déplacer vers la gauche"
                        >
                          ←
                        </button>

                        <button
                          type="button"
                          onClick={() => moveImage(index, 1)}
                          disabled={index === images.length - 1}
                          className="rounded-md border px-2 py-1 text-xs disabled:opacity-30"
                          aria-label="Déplacer vers la droite"
                        >
                          →
                        </button>

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600"
                          aria-label="Supprimer cette photo"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Variantes ({variants.length})
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Couleurs, tailles, modèles…
                </p>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
              >
                + Ajouter
              </button>
            </div>

            {variants.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                Aucune variante détectée. Tu peux les ajouter manuellement.
              </p>
            )}

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">
                      Variante {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-xs text-red-600"
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={variant.name || ''}
                      onChange={e =>
                        updateVariant(index, 'name', e.target.value)
                      }
                      placeholder="Type (ex. Couleur)"
                      className="min-w-0 rounded-lg border px-3 py-2 text-sm"
                    />

                    <input
                      value={variant.value || ''}
                      onChange={e =>
                        updateVariant(index, 'value', e.target.value)
                      }
                      placeholder="Valeur (ex. Rouge)"
                      className="min-w-0 rounded-lg border px-3 py-2 text-sm"
                    />

                    <input
                      value={variant.sku || ''}
                      onChange={e =>
                        updateVariant(index, 'sku', e.target.value)
                      }
                      placeholder="Référence"
                      className="min-w-0 rounded-lg border px-3 py-2 text-sm"
                    />

                    <input
                      type="number"
                      value={variant.price ?? ''}
                      onChange={e =>
                        updateVariant(index, 'price', e.target.value)
                      }
                      placeholder="Prix (facultatif)"
                      className="min-w-0 rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>

                  {images.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium text-gray-600">
                        Photos associées à cette variante
                      </p>

                      <div className="grid grid-cols-4 gap-2">
                        {images.map((image, imageIndex) => {
                          const selected = (variant.images || []).includes(image);

                          return (
                            <button
                              key={image}
                              type="button"
                              onClick={() =>
                                toggleVariantImage(index, image)
                              }
                              className={`overflow-hidden rounded-lg border-2 ${
                                selected
                                  ? 'border-rose-600'
                                  : 'border-gray-200'
                              }`}
                              aria-pressed={selected}
                            >
                              <img
                                src={image}
                                alt={`Photo ${imageIndex + 1}`}
                                className="h-16 w-full object-contain"
                              />
                            </button>
                          );
                        })}
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        Appuie sur les photos pour les associer ou les retirer.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {missing.length > 0 && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Informations non trouvées : {missing.join(', ')}
            </p>
          )}

          <button
            type="button"
            onClick={validateImport}
            disabled={saving}
            className="w-full rounded-xl bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
          >
            {saving ? 'Transmission…' : 'Utiliser ces informations'}
          </button>

          <p className="text-xs leading-5 text-gray-500">
            Les informations seront transmises au formulaire pour vérification.
            Aucune sauvegarde ni publication n’est effectuée ici. Tu devras
            toujours valider toi-même avec le bouton Enregistrer.
          </p>
        </div>
      )}
    </section>
  );
}
