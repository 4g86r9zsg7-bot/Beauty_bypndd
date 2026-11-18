
'use client';

import {useState} from 'react';
import {WA} from '@/lib/supabase';

type SheinItem = {
  id: string;
  name: string;
  attr: string;
  image: string;
  url: string;
  price: number;
  quantity: number;
};

const dh = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n) + ' DH';

const euro = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(n);

function fixText(value: string) {
  if (!/[ÃÂâ]/.test(value)) return value;
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function getPrice(item: any): number {
  const candidates = [
    item?.price?.sale?.amount,
    item?.price?.amount,
    item?.salePrice,
    item?.price
  ];

  for (const value of candidates) {
    const n = Number(String(value ?? '').replace(',', '.'));
    if (Number.isFinite(n) && n > 0) return n;
  }

  return 0;
}

export default function SheinForm() {
  const [link, setLink] = useState('');
  const [items, setItems] = useState<SheinItem[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const inp =
    'w-full rounded-xl border border-sand bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-rose';

  const card = 'rounded-2xl bg-white p-5 shadow-sm';

  const totalEUR = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalDH = Math.round(totalEUR * 1.15 * 11.80 * 100) / 100;
  const avance = Math.round(totalDH * 50) / 100;
  const solde = Math.round((totalDH - avance) * 100) / 100;

  async function readCart(e: any) {
    e.preventDefault();
    setErr('');
    setItems([]);

    const cleanLink = link.trim();

    if (
      !/^https:\/\/(www\.|m\.)?shein\./i.test(cleanLink) &&
      !/^https:\/\/onelink\.shein\.com\//i.test(cleanLink)
    ) {
      setErr('Veuillez coller un lien de partage SHEIN valide.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        `/api/shein-cart?link=${encodeURIComponent(cleanLink)}`,
        {cache: 'no-store'}
      );

      const data = await response.json();

      if (!response.ok || !data?.ok || !Array.isArray(data?.cart?.items)) {
        throw new Error(
          data?.error || 'Impossible de lire votre panier SHEIN.'
        );
      }

      const imported: SheinItem[] = data.cart.items.map(
        (item: any, index: number) => ({
          id: String(item.id || item.sku || index),
          name: fixText(String(item.name || 'Article SHEIN')),
          attr: fixText(String(item.attr || '')),
          image: String(item.image || ''),
          url: String(item.url || ''),
          price: getPrice(item),
          quantity: 1
        })
      );

      if (!imported.length || imported.some(item => item.price <= 0)) {
        throw new Error(
          'Certains prix des articles n’ont pas pu être récupérés. Réessayez avec votre lien.'
        );
      }

      setItems(imported);
    } catch (error: any) {
      setErr(
        error?.message ||
        'Une erreur est survenue pendant la lecture du panier.'
      );
    } finally {
      setBusy(false);
    }
  }

  function changeQuantity(id: string, amount: number) {
    setItems(current =>
      current.map(item =>
        item.id === id
          ? {...item, quantity: Math.max(1, item.quantity + amount)}
          : item
      )
    );
  }

  const msg = items.length
    ? `Bonjour, je souhaite faire une précommande SHEIN.
Lien du panier : ${link.trim()}

Articles :
${items.map(item =>
  `- ${item.name} | ${item.attr} | Quantité : ${item.quantity} | ${euro(item.price * item.quantity)}`
).join('\n')}

Total estimé : ${dh(totalDH)}
Acompte à verser (50 %) : ${dh(avance)}
Solde à la réception : ${dh(solde)}
Livraison estimée : 2 à 3 semaines

Je souhaite confirmer cette précommande.`
    : '';

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-serif text-4xl text-plum">
        Précommande SHEIN
      </h1>

      <p className="mt-2 text-sm text-ink/70">
        Collez le lien de votre panier SHEIN et retrouvez automatiquement
        vos articles et leur prix en dirhams.
      </p>

      <form onSubmit={readCart} className={`${card} mt-5 grid gap-4`}>
        <label className="text-sm font-medium text-plum">
          Lien de votre panier SHEIN

          <input
            required
            type="url"
            inputMode="url"
            placeholder="https://..."
            value={link}
            onChange={e => setLink(e.target.value)}
            className={`${inp} mt-1`}
          />
        </label>

        <button
          disabled={busy}
          className="rounded-full bg-rose py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
        >
          {busy ? 'Lecture du panier...' : 'Lire mon panier SHEIN'}
        </button>

        {err && (
          <p className="text-sm text-red-700">{err}</p>
        )}
      </form>

      {items.length > 0 && (
        <div className={`${card} mt-5`}>
          <h2 className="font-serif text-2xl text-plum">
            Votre panier SHEIN
          </h2>

          <p className="mt-1 text-sm text-ink/60">
            {items.length} article(s) importé(s)
          </p>

          <div className="mt-4 grid gap-4">
            {items.map(item => (
              <div
                key={item.id}
                className="flex gap-3 border-b border-sand pb-4"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-24 rounded-xl bg-sand object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-xl bg-sand" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-plum">
                    {item.name}
                  </p>

                  {item.attr && (
                    <p className="mt-1 text-xs text-ink/60">
                      {item.attr}
                    </p>
                  )}

                  <p className="mt-2 text-sm font-semibold text-plum">
                    {euro(item.price)}
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, -1)}
                      className="h-8 w-8 rounded-full border border-plum text-plum"
                      aria-label="Diminuer la quantité"
                    >
                      −
                    </button>

                    <span className="min-w-5 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, 1)}
                      className="h-8 w-8 rounded-full border border-plum text-plum"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-5 font-serif text-2xl text-plum">
            Votre précommande
          </h2>

          <p className="mt-4 flex items-baseline justify-between border-b border-sand pb-3">
            <span>Total estimé</span>
            <b className="font-serif text-3xl text-plum">
              {dh(totalDH)}
            </b>
          </p>

          <p className="flex justify-between border-b border-sand py-3 text-sm">
            <span>Acompte à verser (50 %)</span>
            <b>{dh(avance)}</b>
          </p>

          <p className="flex justify-between border-b border-sand py-3 text-sm">
            <span>Solde à la réception</span>
            <b>{dh(solde)}</b>
          </p>

          <p className="flex justify-between py-3 text-sm">
            <span>Livraison estimée</span>
            <b>2 à 3 semaines</b>
          </p>

          <div className="mt-3 rounded-xl border border-sand bg-[#faf7f3] p-4 text-xs leading-relaxed text-ink/80">
            <b className="text-plum">Information importante</b>
            <p className="mt-2">
              Les prix SHEIN peuvent varier à la hausse comme à la baisse
              à tout moment. Le montant affiché est une estimation et le
              prix définitif sera calculé selon les tarifs SHEIN en vigueur
              le jour où nous passons la commande.
            </p>
          </div>

          <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-ink/70">
            <li>Un acompte de 50 % est obligatoire pour valider la précommande.</li>
            <li>Votre commande SHEIN n’est passée qu’après réception de l’acompte.</li>
            <li>Le solde est à régler à la réception du colis.</li>
            <li>L’envoi du message WhatsApp ne vaut pas confirmation : la précommande est validée après réception de l’acompte.</li>
          </ul>

          <div className="mt-5 grid gap-3">
            <a
              href={`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`}
              className="rounded-full bg-rose py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white"
            >
              J’accepte, continuer sur WhatsApp
            </a>

            <button
              type="button"
              onClick={() => {
                setItems([]);
                setLink('');
                setErr('');
              }}
              className="rounded-full border border-plum py-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum"
            >
              Refuser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
