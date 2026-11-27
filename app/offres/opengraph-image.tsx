import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Packs et offres beauté exclusives BeautyByPND au Maroc.';
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
          background: 'linear-gradient(135deg, #fff8fa 0%, #f5e7ed 54%, #f8f1e6 100%)',
          color: '#321020',
          position: 'relative',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ position: 'absolute', inset: 28, border: '1px solid #d9bdc9', display: 'flex' }} />
        <div style={{ color: '#a17b39', fontSize: 22, letterSpacing: 8, textTransform: 'uppercase' }}>BeautyByPND</div>
        <div style={{ marginTop: 48, fontSize: 82, fontStyle: 'italic', letterSpacing: -2 }}>Packs & Offres</div>
        <div style={{ marginTop: 16, fontSize: 42, color: '#963e66' }}>Exclusives</div>
        <div style={{ marginTop: 36, width: 100, height: 2, background: '#C6A15B' }} />
        <div style={{ marginTop: 34, fontSize: 25, letterSpacing: 2 }}>Vos essentiels beauté, réunis à prix doux</div>
        <div style={{ position: 'absolute', bottom: 62, color: '#795365', fontSize: 18, letterSpacing: 3 }}>LIVRAISON PARTOUT AU MAROC</div>
      </div>
    ),
    { ...size }
  );
}
