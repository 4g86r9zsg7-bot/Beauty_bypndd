export type PreparedImage = {
  blob: Blob;
  extension: string;
  contentType: string;
};

const MAX_UNCOMPRESSED = 1024 * 1024; // 1 Mo
const WEBP_KEEP_BELOW = 300 * 1024;   // un WebP de moins de 300 Ko est gardé tel quel

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

// Décodage avec méthode de secours (certains navigateurs mobiles échouent avec createImageBitmap).
async function decode(file: File): Promise<Decoded> {
  try {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      return {
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        release: () => URL.revokeObjectURL(url)
      };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }
}

/**
 * Optimise les photos produit dans le navigateur.
 * GIF, APNG et SVG sont conservés. Les autres formats (PNG, JPEG, WebP lourd)
 * sont réduits puis convertis en WebP (ou JPEG sur Safari).
 */
export async function prepareProductImage(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier sélectionné n’est pas une image.');
  }

  const originalExtension = (file.name.split('.').pop()?.toLowerCase() || 'img').replace(/[^a-z0-9]/g, '') || 'img';
  const unchanged = (): PreparedImage => ({
    blob: file,
    extension: originalExtension,
    contentType: file.type || 'application/octet-stream'
  });

  if (['image/gif', 'image/apng', 'image/svg+xml'].includes(file.type)) return unchanged();
  if (file.type === 'image/webp' && file.size <= WEBP_KEEP_BELOW) return unchanged();

  try {
    const decoded = await decode(file);
    const maxDimension = Math.max(640, Math.min(2400, options.maxDimension ?? 1200));
    const scale = Math.min(1, maxDimension / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      decoded.release();
      throw new Error('canvas indisponible');
    }

    // Fond blanc : évite un fond noir sur les PNG transparents lors de l'export JPEG.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(decoded.source, 0, 0, width, height);
    decoded.release();

    const quality = Math.max(0.55, Math.min(0.95, options.quality ?? 0.8));
    const toBlob = (type: string) =>
      new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));

    // Safari ne sait pas exporter en WebP : on passe alors en JPEG.
    let converted = await toBlob('image/webp');
    if (!converted || converted.type !== 'image/webp') {
      converted = await toBlob('image/jpeg');
    }

    canvas.width = 0;
    canvas.height = 0;

    if (!converted) throw new Error('conversion impossible');

    // Ne jamais remplacer un original par un fichier plus lourd.
    if (converted.size >= file.size) {
      if (file.size > MAX_UNCOMPRESSED) throw new Error('conversion inefficace');
      return unchanged();
    }

    const isWebp = converted.type === 'image/webp';
    return {
      blob: converted,
      extension: isWebp ? 'webp' : 'jpg',
      contentType: isWebp ? 'image/webp' : 'image/jpeg'
    };
  } catch {
    // Petite photo : on l'accepte telle quelle. Grosse photo : on prévient au lieu de saturer le quota.
    if (file.size > MAX_UNCOMPRESSED) {
      throw new Error(
        `La photo « ${file.name} » est trop lourde (${(file.size / 1048576).toFixed(1)} Mo) et n’a pas pu être compressée. ` +
        'Réduis-la (par exemple avec squoosh.app) ou essaie un autre navigateur.'
      );
    }
    return unchanged();
  }
}
