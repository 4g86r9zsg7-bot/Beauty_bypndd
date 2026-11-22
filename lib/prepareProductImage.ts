export type PreparedImage = {
  blob: Blob;
  extension: string;
  contentType: string;
};

/**
 * Optimise les photos produit dans le navigateur, sans service payant.
 * Les GIF, SVG et WebP existants sont conservés tels quels pour éviter
 * de casser les animations ou de réencoder inutilement un format déjà optimisé.
 */
export async function prepareProductImage(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier sélectionné n’est pas une image.');
  }

  const originalExtension = file.name.split('.').pop()?.toLowerCase() || 'img';
  const unchanged = (): PreparedImage => ({
    blob: file,
    extension: originalExtension.replace(/[^a-z0-9]/g, '') || 'img',
    contentType: file.type || 'application/octet-stream'
  });

  if (
    file.type === 'image/gif' ||
    file.type === 'image/apng' ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/webp'
  ) {
    return unchanged();
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxDimension = Math.max(640, Math.min(2400, options.maxDimension ?? 1400));
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return unchanged();
    }

    // Fond blanc : évite un fond noir sur les PNG transparents lors de l'export JPEG.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const quality = Math.max(0.55, Math.min(0.95, options.quality ?? 0.86));
    const toBlob = (type: string) =>
      new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));

    // Safari ne sait pas exporter en WebP : il renverrait un PNG très lourd.
    // On passe alors en JPEG.
    let converted = await toBlob('image/webp');
    if (!converted || converted.type !== 'image/webp') {
      converted = await toBlob('image/jpeg');
    }

    // Libère la mémoire (important sur iPhone).
    canvas.width = 0;
    canvas.height = 0;

    // Ne jamais remplacer un original par un fichier plus lourd.
    if (!converted || converted.size >= file.size) return unchanged();

    const isWebp = converted.type === 'image/webp';
    return {
      blob: converted,
      extension: isWebp ? 'webp' : 'jpg',
      contentType: isWebp ? 'image/webp' : 'image/jpeg'
    };
  } catch {
    // Ne jamais bloquer l'ajout d'une photo si le navigateur
    // ne sait pas la décoder pour la compresser.
    return unchanged();
  }
}
