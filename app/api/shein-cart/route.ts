
import {NextResponse} from 'next/server';

export async function GET(req: Request) {
  try {
    const {searchParams} = new URL(req.url);
    const link = searchParams.get('link')?.trim();

    if (!link) {
      return NextResponse.json(
        {error: 'Lien SHEIN manquant'},
        {status: 400}
      );
    }

    const parsed = new URL(link);

    if (
      parsed.protocol !== 'https:' ||
      !['onelink.shein.com', 'm.shein.com'].includes(parsed.hostname)
    ) {
      return NextResponse.json(
        {error: 'Lien SHEIN non valide'},
        {status: 400}
      );
    }

    const api = new URL(
      'https://cart-viewer.ibrahimwithi.com/api/cart'
    );

    api.searchParams.set('link', link);
    api.searchParams.set('currency', 'EUR');

    const response = await fetch(api.toString(), {
      cache: 'no-store',
      headers: {Accept: 'application/json'}
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {error: 'Le lecteur SHEIN a rencontré une erreur', details: data},
        {status: 502}
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json(
      {error: 'Impossible de lire le panier SHEIN pour le moment.'},
      {status: 500}
    );
  }
}
