export function generateStemFromFsPath(fsPath: string) {
  return fsPath.split('.').slice(0, -1).join('.')
}

export const VIRTUAL_MEDIA_COLLECTION_NAME = 'public-assets' as const

/** Thumbnail size for media picker grid (matches ImagePreview dimensions). */
const THUMBNAIL_SIZE = 200

const IPX_PREFIX = '/__nuxt_studio/ipx'

/**
 * Builds an IPX thumbnail URL for the media picker.
 * Serves resized images (200x200) to avoid browser lag when displaying many large images.
 *
 * @param path - Media path (routePath or fsPath, e.g. `/images/arctic/arctic.jpg`) or full URL
 * @returns IPX thumbnail URL
 */
export function getMediaThumbnailUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  const modifiers = `s_${THUMBNAIL_SIZE}x${THUMBNAIL_SIZE},fit_cover`
  return `${IPX_PREFIX}/${modifiers}/${normalizedPath}`
}
