export interface ImageOptimizationOptions {
  maxSizeMB: number
  maxWidthOrHeight: number
  useWebP: boolean
  quality: number
}

export const OPTIMIZATION_PRESETS = {
  bookCover: {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 1200,
    useWebP: true,
    quality: 0.85,
  },
  authorPhoto: {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 800,
    useWebP: true,
    quality: 0.85,
  },
  heroBackground: {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1920,
    useWebP: true,
    quality: 0.85,
  },
  postFeaturedImage: {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1200,
    useWebP: true,
    quality: 0.85,
  },
  postInlineImage: {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 1000,
    useWebP: true,
    quality: 0.85,
  },
} as const

export async function optimizeImage(
  file: File,
  preset: keyof typeof OPTIMIZATION_PRESETS,
): Promise<File> {
  const options = OPTIMIZATION_PRESETS[preset]

  try {
    const { default: imageCompression } = await import('browser-image-compression')

    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
      useWebWorker: true,
      fileType: options.useWebP ? 'image/webp' : 'image/jpeg',
      initialQuality: options.quality,
    })

    return compressedFile
  } catch (error) {
    console.error('Image optimization failed:', error)
    throw new Error('Falha ao otimizar imagem. Tente outro arquivo.')
  }
}

export async function validateAndOptimizeImage(
  file: File,
  preset: keyof typeof OPTIMIZATION_PRESETS,
): Promise<File> {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo invalido. Use JPG, PNG ou WebP.')
  }

  const maxSizeMB = 50
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`Arquivo muito grande. Maximo permitido: ${maxSizeMB}MB.`)
  }

  return optimizeImage(file, preset)
}
