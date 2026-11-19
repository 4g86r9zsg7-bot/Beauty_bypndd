

'use client';

import { useState } from 'react';

type ImportedVariant = {
  name?: string;
  value?: string;
  sku?: string;
  mpn?: string;
  price?: number | null;
  stock?: number | null;
  images?: string[];
  options?: Record<string, string>;
  currency?: string;
  swatch?: string;
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

const primaryButton =
  '!bg-[#9f1239] !text-white !border-[#9f1239] rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition hover:!bg-[#881337] disabled:cursor-not-allowed disabled:opacity-60';

function cleanSwatch(value: unknown): string {
  if (typeof value !== 'string') return '';

  const color = value.trim();

  if (
    /^#[0-9a-f]{3,4}$/i.test(color) ||
    /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color) ||
    /^rgba?\([\d\s.,%/]+\)$/i.test(color) ||
    /^hsla?\([\d\s.,%/deg]+\)$/i.test(color)
  ) {
    return color;
  }

  return '';
}

export default function ProductImporter({ onImport }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [missing, setMissing] = useState<string[]>([]);
  const [detected, setDetected] = useState<ImportedProduct | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ImportedVariant[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
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
      setSelectedVariants([]);

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

      const cleanImages = (values: unknown): string[] =>
        Array.isArray(values)
          ? [...new Set(values.filter(
              (image): image is string =>
                typeof image === 'string' &&
                /^https?:\/\//i.test(image)
            ))]
          : [];

      const productImages = cleanImages(product.images);

      const productVariants = Array.isArray(product.variants)
        ? product.variants.map((variant: ImportedVariant & Record<string, unknown>) => ({
            ...variant,
            swatch: cleanSwatch(
              variant.swatch ??
              variant.colorHex ??
              variant.hex ??
              variant.colorCode
            ),
            images: cleanImages(variant.images),
          }))
        : [];

      setDetected(product);
      setImages(productImages);
      setVariants(productVariants);
      setSelectedVariants([]);
      setMissing(Array.isArray(result.missing) ? result.missing : []);

      setMessage(
        productVariants.length
          ? `Analyse terminée : ${productVariants.length} variante(s) détectée(s). Coche celles que tu souhaites vendre.`
          : 'Analyse terminée. Aucune variante détectée ; tu peux les ajouter manuellement.'
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
                  : field === 'swatch'
                    ? cleanSwatch(value) || value.trim()
                    : value,
            }
          : variant
      )
    );
  }

  function toggleVariant(index: number) {
    setSelectedVariants(current =>
      current.includes(index)
        ? current.filter(item => item !== index)
        : [...current, index]
    );
  }

  function selectAllVariants() {
    setSelectedVariants(variants.map((_, index) => index));
  }

  function deselectAllVariants() {
    setSelectedVariants([]);
  }

  function addVariant() {
    const newIndex = variants.length;

    setVariants(current => [
      ...current,
      { name: 'Teinte', value: '', images: [], options: {}, swatch: '' },
    ]);

    setSelectedVariants(current => [...current, newIndex]);
  }

  function removeVariant(index: number) {
    setVariants(current => current.filter((_, i) => i !== index));

    setSelectedVariants(current =>
      current
        .filter(item => item !== index)
        .map(item => item > index ? item - 1 : item)
    );
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
    if (!detected || saving) return;

    const selected = variants.filter((_, index) =>
      selectedVariants.includes(index)
    );

    if (variants.length > 0 && selected.length === 0) {
      setMessage(
        'Coche au moins une variante avant de transférer le produit.'
      );
      return;
    }

    const emptyVariants = selected.filter(
      variant => !variant.value?.trim() && !variant.name?.trim()
    );

    if (emptyVariants.length > 0) {
      setMessage(
        'Une variante sélectionnée est vide. Complète-la ou décoche-la avant de continuer.'
      );
      return;
    }

    setSaving(true);

    try {
      onImport({
        ...detected,
        images: [...images],
        variants: selected.map(variant => ({
          ...variant,
          swatch: cleanSwatch(variant.swatch) || '',
          images: [...(variant.images || [])],
        })),
      });

      setMessage(
        `Transfert effectué : ${selected.length} variante(s) transmise(s) au formulaire. Vérifie toutes les informations avant de cliquer sur Enregistrer.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Le transfert a échoué. Réessaie.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-900">
          Importer depuis un lien
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-600">
          Colle le lien d’un produit pour récupérer les informations,
          la description, les photos et les variantes disponibles.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://exemple.com/produit"
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-rose-400"
        />

        <button
          type="button"
          onClick={analyze}
          disabled={loading}
          style={{
            backgroundColor: '#9f1239',
            color: '#ffffff',
            border: '1px solid #9f1239',
            WebkitAppearance: 'none',
            appearance: 'none',
          }}
          className={primaryButton}
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
                Référence : {[detected.sku, detected.mpn].filter(Boolean).join(' / ')}
              </p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="mb-2 text-sm font-semibold text-gray-900">
              Description détectée
            </p>

            <textarea
              value={detected.description || ''}
              onChange={e =>
                setDetected(current =>
                  current ? { ...current, description: e.target.value } : current
                )
              }
              placeholder="Aucune description détectée. Tu peux la saisir manuellement."
              rows={5}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-rose-400"
            />

            {!detected.description && (
              <p className="mt-1 text-xs text-amber-700">
                La description n’a pas été trouvée automatiquement.
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
              <p className="text-xs text-gray-500">Aucune photo détectée.</p>
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
                        >
                          ←
                        </button>

                        <button
                          type="button"
                          onClick={() => moveImage(index, 1)}
                          disabled={index === images.length - 1}
                          className="rounded-md border px-2 py-1 text-xs disabled:opacity-30"
                        >
                          →
                        </button>

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600"
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
                  Choisir les variantes ({selectedVariants.length}/{variants.length})
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Coche uniquement les teintes, couleurs, tailles ou modèles que tu souhaites vendre.
                </p>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="shrink-0 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700"
              >
                + Créer une variante manuellement
              </button>
            </div>

            {variants.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAllVariants}
                  className="rounded-lg border bg-white px-3 py-2 text-xs font-medium text-gray-800"
                >
                  Tout sélectionner
                </button>

                <button
                  type="button"
                  onClick={deselectAllVariants}
                  className="rounded-lg border bg-white px-3 py-2 text-xs font-medium text-gray-800"
                >
                  Tout désélectionner
                </button>
              </div>
            )}

            {variants.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                Aucune variante détectée. Tu peux les ajouter manuellement.
              </p>
            )}

            <div className="space-y-3">
              {variants.map((variant, index) => {
                const selected = selectedVariants.includes(index);
                const variantImages = variant.images || [];
                const swatch = cleanSwatch(variant.swatch);

                return (
                  <div
                    key={`${variant.sku || variant.value || 'variant'}-${index}`}
                    className={`rounded-xl border p-3 ${
                      selected
                        ? 'border-rose-300 bg-rose-50/40'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <label className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-800">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleVariant(index)}
                          className="h-4 w-4 accent-rose-700"
                        />
                        <span className="break-words">
                          {variant.value || `Variante ${index + 1}`}
                          {selected ? ' · Sélectionnée' : ''}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="shrink-0 text-xs text-red-600"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={variant.name || ''}
                        onChange={e => updateVariant(index, 'name', e.target.value)}
                        placeholder="Type (ex. Teinte)"
                        className="min-w-0 rounded-lg border px-3 py-2 text-sm text-gray-900"
                      />

                      <input
                        value={variant.value || ''}
                        onChange={e => updateVariant(index, 'value', e.target.value)}
                        placeholder="Valeur (ex. 01 Beige)"
                        className="min-w-0 rounded-lg border px-3 py-2 text-sm text-gray-900"
                      />

                      <input
                        value={variant.sku || ''}
                        onChange={e => updateVariant(index, 'sku', e.target.value)}
                        placeholder="Référence SKU"
                        className="min-w-0 rounded-lg border px-3 py-2 text-sm text-gray-900"
                      />

                      <input
                        value={variant.mpn || ''}
                        onChange={e => updateVariant(index, 'mpn', e.target.value)}
                        placeholder="Référence MPN"
                        className="min-w-0 rounded-lg border px-3 py-2 text-sm text-gray-900"
                      />

                      <input
                        type="number"
                        value={variant.price ?? ''}
                        onChange={e => updateVariant(index, 'price', e.target.value)}
                        placeholder="Prix (facultatif)"
                        className="min-w-0 rounded-lg border px-3 py-2 text-sm text-gray-900"
                      />
                    </div>

                    <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                      <p className="mb-2 text-xs font-semibold text-gray-800">
                        Couleur du carré de teinte
                      </p>

                      <div className="flex items-center gap-3">
                        <div
                          className="h-11 w-11 shrink-0 rounded-md border-2 border-gray-300 shadow-sm"
                          style={{
                            backgroundColor: swatch || '#ffffff',
                          }}
                          title={swatch || 'Aucune couleur définie'}
                        />

                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={variant.swatch || ''}
                            onChange={e =>
                              updateVariant(index, 'swatch', e.target.value)
                            }
                            placeholder="#C98B72"
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-rose-400"
                          />

                          <p className="mt-1 text-xs text-gray-500">
                            Code HEX, par exemple #C98B72. Tu peux le corriger manuellement.
                          </p>
                        </div>
                      </div>

                      {variant.swatch && !swatch && (
                        <p className="mt-2 text-xs text-amber-700">
                          Format non reconnu. Utilise un code HEX valide, par exemple #C98B72.
                        </p>
                      )}

                      {!swatch && (
                        <p className="mt-2 text-xs text-gray-500">
                          Couleur non détectée : tu peux la compléter ici. Elle ne sera pas remplacée par la photo du produit.
                        </p>
                      )}
                    </div>

                    {variantImages.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-xs font-medium text-gray-600">
                          Photos récupérées pour cette teinte
                        </p>

                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {variantImages.map((image, imageIndex) => (
                            <button
                              key={`${image}-${imageIndex}`}
                              type="button"
                              onClick={() => toggleVariantImage(index, image)}
                              className="overflow-hidden rounded-lg border-2 border-rose-600"
                              aria-pressed={true}
                            >
                              <img
                                src={image}
                                alt={`Photo de ${variant.value || 'la variante'}`}
                                className="h-20 w-full bg-gray-50 object-contain"
                                loading="lazy"
                              />
                            </button>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Ces photos restent associées à cette teinte pour la grande photo de la fiche produit.
                        </p>
                      </div>
                    )}

                    {variantImages.length === 0 && (
                      <p className="mt-2 text-xs text-amber-700">
                        Aucune photo individuelle récupérée pour cette variante.
                      </p>
                    )}
                  </div>
                );
              })}
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
            style={{
              backgroundColor: '#9f1239',
              color: '#ffffff',
              border: '1px solid #9f1239',
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
            className={`${primaryButton} w-full`}
          >
            {saving
              ? 'Transmission en cours…'
              : `Transférer le produit et ses ${selectedVariants.length} variante(s) sélectionnée(s)`}
          </button>

          <p className="text-xs leading-5 text-gray-500">
            Seules les variantes cochées seront transmises au formulaire.
            Aucune sauvegarde ni publication n’est effectuée ici. Tu devras
            toujours valider toi-même avec le bouton Enregistrer.
          </p>
        </div>
      )}
    </section>
  );
}
