
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

function extractSheinLink(value: string) {
  const match = value.match(
    /https?:\/\/(?:onelink\.shein\.com|(?:www\.|m\.)?shein\.com)\/[^\s<>"']+/i
  );

  if (!match) return '';

  return match[0].replace(/[),.;!?]+$/, '');
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
    'w-full rounded-2xl border border-[#ead5d5] bg-white px-4 py-4 text-base text-[#44212d] placeholder:text-[#a28b91] focus:outline-none focus:ring-2 focus:ring-[#a51f48]';

  const card =
    'rounded-3xl border border-[#f0dddd] bg-white p-5 shadow-sm';

  const cleanLink = extractSheinLink(link);

  const totalEUR = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalDH = Math.round(totalEUR * 1.15 * 11.80 * 100) / 100;
  const avance = Math.round(totalDH * 50) / 100;
  const solde = Math.round((totalDH - avance) * 100) / 100;

  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  async function readCart(e: any) {
    e.preventDefault();
    setErr('');
    setItems([]);

    if (!cleanLink) {
      setErr(
        'Nous n’avons pas trouvé de lien SHEIN. Collez le message complet de partage ou simplement le lien.'
      );
      return;
    }

    let parsedLink: URL;
    try {
      parsedLink = new URL(cleanLink);
    } catch {
      setErr('Veuillez coller un lien de partage SHEIN valide.');
      return;
    }

    if (
      parsedLink.protocol !== 'https:' ||
      !['onelink.shein.com', 'www.shein.com', 'm.shein.com', 'shein.com'].includes(parsedLink.hostname)
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
Lien du panier : ${cleanLink}

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
    <div className="mx-auto max-w-2xl space-y-6 pb-8">

      {/* Bannière */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#fff0ef] via-[#f8d9dc] to-[#edb9c3] px-6 py-10 shadow-sm sm:px-9 sm:py-14">
        <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/30 blur-2xl" />
        <div className="absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-[#a51f48]/10 blur-2xl" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#84213e]">
            BeautyByPND · Beauté · Mode · Style
          </p>

          <h1 className="mt-5 font-serif text-4xl leading-tight text-[#57152c] sm:text-5xl">
            Votre shopping SHEIN,
            <span className="mt-1 block italic text-[#a51f48]">
              en toute simplicité.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-[#603747] sm:text-base">
            Vous partagez votre panier, nous nous occupons du reste.
            Retrouvez automatiquement vos articles et leur prix en dirhams.
          </p>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-medium text-[#74203b]">
            <span>♡</span>
            Simple, rapide et pratique
          </div>

          <div className="mt-8 flex items-center gap-3 text-5xl" aria-hidden="true">
            <span>🛍️</span>
            <span>💄</span>
            <span>👜</span>
            <span>✨</span>
          </div>
        </div>
      </section>

      {/* Guide en 3 étapes */}
      <section className={card}>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a51f48]">
            Comment ça marche ?
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[#57152c]">
            Votre précommande en 3 étapes
          </h2>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fbe5e8] text-2xl">
              🛒
            </div>
            <span className="mt-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#851c3d] text-sm font-bold text-white">
              1
            </span>
            <h3 className="mt-2 font-semibold text-[#57152c]">
              Préparez votre panier
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#806873]">
              Ajoutez vos articles préférés sur SHEIN.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fbe5e8] text-2xl">
              🔗
            </div>
            <span className="mt-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#851c3d] text-sm font-bold text-white">
              2
            </span>
            <h3 className="mt-2 font-semibold text-[#57152c]">
              Partagez votre panier
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#806873]">
              Appuyez sur « Partager le panier » et copiez le message.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fbe5e8] text-2xl">
              💬
            </div>
            <span className="mt-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#851c3d] text-sm font-bold text-white">
              3
            </span>
            <h3 className="mt-2 font-semibold text-[#57152c]">
              Confirmez sur WhatsApp
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#806873]">
              Vérifiez votre récapitulatif et envoyez votre demande.
            </p>
          </div>
        </div>
      </section>

      {/* Lecture du panier */}
      <section className={card}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbe5e8] text-2xl">
            🛍️
          </div>
          <div>
            <h2 className="font-serif text-2xl text-[#57152c]">
              Votre panier SHEIN
            </h2>
            <p className="text-xs text-[#806873]">
              Collez votre message de partage ici
            </p>
          </div>
        </div>

        <form onSubmit={readCart} className="mt-5 grid gap-3">
          <label className="text-sm font-medium text-[#57152c]">
            Lien ou message complet SHEIN

            <textarea
              required
              rows={4}
              value={link}
              onChange={e => {
                setLink(e.target.value);
                if (err) setErr('');
              }}
              placeholder={'I found some great items at SHEIN!\nhttps://onelink.shein.com/...'}
              className={`${inp} mt-2 resize-y`}
            />
          </label>

          <p className="text-xs leading-relaxed text-[#806873]">
            Pas besoin de supprimer « I found some great items… ».
            Collez directement tout le message : nous récupérons le lien automatiquement.
          </p>

          {cleanLink && (
            <p className="rounded-xl bg-[#f5f0eb] px-3 py-2 text-xs text-[#6c4a55]">
              <span className="font-semibold">Lien détecté :</span> {cleanLink}
            </p>
          )}

          <button
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-[#74132f] to-[#a51f48] px-5 py-4 text-sm font-semibold tracking-wide text-white shadow-md transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? 'Lecture de votre panier...' : 'Lire mon panier SHEIN →'}
          </button>

          {err && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {err}
            </p>
          )}
        </form>
      </section>

      {/* Articles importés */}
      {items.length > 0 && (
        <section className={card}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl text-[#57152c]">
                Votre sélection
              </h2>
              <p className="mt-1 text-xs text-[#806873]">
                {items.length} référence(s) · {totalQuantity} article(s) au total
              </p>
            </div>
            <span className="rounded-full bg-[#fbe5e8] px-3 py-2 text-xs font-semibold text-[#851c3d]">
              Panier importé
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            {items.map(item => (
              <div
                key={item.id}
                className="flex gap-3 border-b border-[#f0dddd] pb-4"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="h-24 w-24 rounded-2xl bg-[#f8eeee] object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-[#f8eeee]" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#57152c]">
                    {item.name}
                  </p>

                  {item.attr && (
                    <p className="mt-1 text-xs text-[#806873]">
                      {item.attr}
                    </p>
                  )}

                  <p className="mt-2 text-sm font-bold text-[#851c3d]">
                    {euro(item.price)}
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, -1)}
                      className="h-8 w-8 rounded-full border border-[#d9aab6] text-lg text-[#851c3d]"
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
                      className="h-8 w-8 rounded-full border border-[#d9aab6] text-lg text-[#851c3d]"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-6 font-serif text-2xl text-[#57152c]">
            Votre précommande
          </h2>

          <p className="mt-4 flex items-baseline justify-between border-b border-[#f0dddd] pb-3">
            <span className="text-sm text-[#6c4a55]">Total estimé</span>
            <b className="font-serif text-3xl text-[#851c3d]">
              {dh(totalDH)}
            </b>
          </p>

          <p className="flex justify-between border-b border-[#f0dddd] py-3 text-sm">
            <span>Acompte à verser (50 %)</span>
            <b>{dh(avance)}</b>
          </p>

          <p className="flex justify-between border-b border-[#f0dddd] py-3 text-sm">
            <span>Solde à la réception</span>
            <b>{dh(solde)}</b>
          </p>

          <p className="flex justify-between py-3 text-sm">
            <span>Livraison estimée</span>
            <b>2 à 3 semaines</b>
          </p>

          <div className="mt-3 rounded-2xl border border-[#ead5bd] bg-[#fff7ed] p-4 text-xs leading-relaxed text-[#674a3b]">
            <b className="text-[#851c3d]">Information importante</b>
            <p className="mt-2">
              Les prix SHEIN peuvent varier à la hausse comme à la baisse
              à tout moment. Le montant affiché est une estimation et le
              prix définitif sera calculé selon les tarifs SHEIN en vigueur
              le jour où nous passons la commande.
            </p>
          </div>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-xs leading-relaxed text-[#806873]">
            <li>Un acompte de 50 % est obligatoire pour valider la précommande.</li>
            <li>Votre commande SHEIN n’est passée qu’après réception de l’acompte.</li>
            <li>Le solde est à régler à la réception du colis.</li>
            <li>L’envoi du message WhatsApp ne vaut pas confirmation : la précommande est validée après réception de l’acompte.</li>
          </ul>

          <div className="mt-6 grid gap-3">
            <a
              href={`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#74132f] to-[#a51f48] px-4 py-4 text-center text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
            >
              <span className="text-xl">☏</span>
              J’accepte, continuer sur WhatsApp →
            </a>

            <button
              type="button"
              onClick={() => {
                setItems([]);
                setLink('');
                setErr('');
              }}
              className="rounded-full border border-[#b98796] py-3 text-sm font-semibold text-[#74132f] transition hover:bg-[#fff4f5]"
            >
              Refuser
            </button>
          </div>
        </section>
      )}

      {/* Informations rassurantes */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['♡', 'Service client'],
          ['✧', 'Sélection SHEIN'],
          ['⌁', 'Livraison 2 à 3 semaines'],
          ['✓', 'Suivi de votre demande']
        ].map(([symbol, label]) => (
          <div
            key={label}
            className="rounded-2xl border border-[#f0dddd] bg-white p-3 text-center"
          >
            <span className="text-2xl text-[#a51f48]">{symbol}</span>
            <p className="mt-1 text-xs font-medium text-[#704555]">
              {label}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
