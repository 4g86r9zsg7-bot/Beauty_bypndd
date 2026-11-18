
import {NextResponse} from 'next/server';

// Calcul exécuté côté serveur.
const FACTOR = 1.15 * 11.80;

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const p = Number(String(b?.price ?? '').replace(',', '.'));

  if (!isFinite(p) || p <= 0 || p > 5000) {
    return NextResponse.json(
      {error: 'Montant invalide'},
      {status: 400}
    );
  }

  const total = Math.round(p * FACTOR * 100) / 100;
  const avance = Math.round(total * 100 / 2) / 100;
  const solde = Math.round((total - avance) * 100) / 100;

  return NextResponse.json({
    total,
    avance,
    solde,
    delai: '2 à 3 semaines'
  });
}
