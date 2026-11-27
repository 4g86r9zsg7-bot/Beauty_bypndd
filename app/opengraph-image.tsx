import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'BeautyByPND — L’élégance au féminin. Maquillage, soins et parfums au Maroc.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #14040c 0%, #321020 58%, #190711 100%)',
          color: '#fff',
          position: 'relative',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ position: 'absolute', inset: 28, border: '1px solid rgba(238,111,176,.42)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 82, width: 76, height: 1, background: '#C6A15B' }} />
        <div style={{ color: '#EE6FB0', fontSize: 23, letterSpacing: 9, textTransform: 'uppercase' }}>Boutique beauté au Maroc</div>
        <div style={{ marginTop: 38, fontSize: 100, fontStyle: 'italic', letterSpacing: -3 }}>BeautyByPND</div>
        <div style={{ marginTop: 24, color: '#E9C6D5', fontSize: 31, letterSpacing: 3 }}>L’ÉLÉGANCE AU FÉMININ</div>
        <div style={{ position: 'absolute', bottom: 92, color: '#E8DCE2', fontSize: 22, letterSpacing: 2 }}>MAQUILLAGE  ·  SOINS  ·  PARFUMS</div>
        <div style={{ position: 'absolute', bottom: 54, color: '#C6A15B', fontSize: 17, letterSpacing: 3 }}>LIVRAISON PARTOUT AU MAROC</div>
        <div style={{ position: 'absolute', top: 56, left: 72, width: 12, height: 12, borderRadius: 99, background: '#C6A15B' }} />
        <div style={{ position: 'absolute', top: 56, right: 72, width: 12, height: 12, borderRadius: 99, background: '#C6A15B' }} />
      </div>
    ),
    { ...size }
  );
}
