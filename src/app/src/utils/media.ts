import type { GitFile, MediaItem } from '../types'

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

/**
 * Builds an IPX URL for full-size image display (no resize modifiers).
 *
 * @param path - Media path (routePath or fsPath, e.g. `/images/arctic/arctic.jpg`) or full URL
 * @returns IPX full-size image URL
 */
export function getMediaFullUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  return `${IPX_PREFIX}/_/${normalizedPath}`
}

/**
 * Returns the URL to use for fetching media metadata (e.g. file size via HEAD).
 * Images use IPX; videos use the public path directly.
 *
 * @param path - Media path (routePath or fsPath)
 * @param isImage - Whether the media is an image (uses IPX) or video
 * @returns Relative URL for fetch
 */
export function getMediaFetchUrl(path: string, isImage: boolean): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return isImage ? getMediaFullUrl(normalized) : normalized
}

/**
 * File name of a media item: the Git provider's name when the file is in the
 * repository, otherwise the last segment of its stem plus its extension.
 */
export function getMediaFileName(mediaItem: MediaItem, remoteFile?: GitFile | null): string {
  if (remoteFile?.name) {
    return remoteFile.name
  }
  const name = mediaItem.stem.split('/').pop()!
  return mediaItem.extension ? `${name}.${mediaItem.extension}` : name
}

/**
 * Markdown link to a media file. Brackets in the name are escaped, and a path
 * with spaces or parentheses is wrapped in angle brackets to keep the link valid.
 */
export function getMediaMarkdownLink(name: string, path: string): string {
  const text = name.replace(/[[\]\\]/g, '\\$&')
  const destination = /[\s()]/.test(path) ? `<${path}>` : path
  return `[${text}](${destination})`
}

/**
 * Size in bytes of a media file as served by the website (HEAD request), for
 * files the Git provider doesn't know (generated or not published yet).
 *
 * @param path - Public path or full URL of the media
 * @returns The size, or null when the server doesn't send it
 */
export async function fetchMediaFileSize(path: string): Promise<number | null> {
  try {
    const response = await fetch(path, { method: 'HEAD' })
    const size = Number(response.headers.get('content-length'))
    return response.ok && size > 0 ? size : null
  }
  catch {
    return null
  }
}
