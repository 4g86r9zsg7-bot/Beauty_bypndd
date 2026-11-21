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
export async function prepareProductImage(file: File): Promise<PreparedImage> {
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
    const maxDimension = 1400;
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

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const converted = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/webp', 0.86);
    });

    if (!converted) return unchanged();

    // Certains navigateurs ne prennent pas en charge l'export WebP.
    if (converted.type !== 'image/webp') {
      return {
        blob: converted,
        extension: converted.type === 'image/png' ? 'png' : 'jpg',
        contentType: converted.type || 'image/jpeg'
      };
    }

    // Ne jamais remplacer un original par un fichier plus lourd.
    if (converted.size >= file.size) {
      return unchanged();
    }

    return {
      blob: converted,
      extension: 'webp',
      contentType: 'image/webp'
    };
  } catch {
    // Ne jamais bloquer l'ajout d'une photo compatible si le navigateur
    // ne sait pas la décoder pour la compresser.
    return unchanged();
  }
}
