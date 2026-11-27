import {ImageResponse} from 'next/og';

export const runtime='edge';
export const alt='BeautyByPND — L’élégance au féminin';
export const size={width:1200,height:630};
export const contentType='image/png';

export default function OpenGraphImage(){
  return new ImageResponse(
    (
      <div style={{
        width:'100%',
        height:'100%',
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        position:'relative',
        overflow:'hidden',
        background:'radial-gradient(circle at 50% 42%, #4a1833 0%, #24101c 48%, #10040b 100%)',
        color:'#fff',
        fontFamily:'Georgia, serif'
      }}>
        <div style={{
          position:'absolute',
          inset:26,
          border:'1px solid rgba(198,161,91,.65)',
          display:'flex'
        }}/>
        <div style={{
          position:'absolute',
          top:76,
          width:110,
          height:2,
          background:'#c6a15b',
          display:'flex'
        }}/>
        <div style={{
          color:'#e9b2c9',
          fontSize:22,
          letterSpacing:9,
          textTransform:'uppercase',
          display:'flex'
        }}>
          BEAUTÉ · MAQUILLAGE · PARFUMS · SOINS
        </div>
        <div style={{
          marginTop:38,
          fontSize:112,
          lineHeight:1,
          fontStyle:'italic',
          letterSpacing:-3,
          display:'flex'
        }}>
          BeautyByPND
        </div>
        <div style={{
          marginTop:28,
          fontSize:36,
          color:'#f3e5eb',
          display:'flex'
        }}>
          L’élégance au féminin
        </div>
        <div style={{
          marginTop:34,
          width:150,
          height:2,
          background:'#c6a15b',
          display:'flex'
        }}/>
        <div style={{
          position:'absolute',
          bottom:72,
          fontFamily:'Arial, sans-serif',
          fontSize:20,
          letterSpacing:4,
          color:'#f0dce5',
          display:'flex'
        }}>
          LIVRAISON PARTOUT AU MAROC
        </div>
      </div>
    ),
    { ...size }
  );
}
