import { join } from 'pathe'
import { withLeadingSlash } from 'ufo'
import { VIRTUAL_MEDIA_COLLECTION_NAME } from './constants'

export function generateIdFromFsPath(fsPath: string) {
  return join(VIRTUAL_MEDIA_COLLECTION_NAME, fsPath)
}

export interface MediaItemKeyFields {
  id: string
  extension: string
  stem: string
  path: string
  fsPath: string
  [key: string]: unknown
}

// `key` must be a raw, unprefixed storage key — strip VIRTUAL_MEDIA_COLLECTION_NAME first if present
export function mediaItemFieldsFromKey(key: string): MediaItemKeyFields {
  const fsPath = withLeadingSlash(key.replace(/:/g, '/'))
  return {
    id: generateIdFromFsPath(fsPath),
    extension: key.split('.').pop() || '',
    stem: fsPath.split('.').slice(0, -1).join('.'),
    path: fsPath,
    fsPath,
  }
}

// Splits a base64 data URL into its media type (parameters dropped) and base64 payload
export function parseDataUrl(dataUrl: string): { mimeType: string, base64: string } | undefined {
  const match = dataUrl.match(/^data:([^;,]*)(?:;[^,]*)?;base64,/)
  if (!match) {
    return undefined
  }

  return { mimeType: match[1] || 'application/octet-stream', base64: dataUrl.slice(match[0].length) }
}

export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

// Decodes a base64 data URL into a typed Blob so it can be uploaded as raw bytes.
// Uses atob instead of fetch(dataUrl), which a site CSP may block (connect-src data:)
export function dataUrlToBlob(dataUrl: string): Blob | undefined {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) {
    return undefined
  }

  return new Blob([base64ToBytes(parsed.base64)], { type: parsed.mimeType })
}

// `allowedTypes` entries are prefixes, with an optional wildcard: 'video/*' matches 'video/mp4', '*/*' matches everything
export function isMediaTypeAllowed(mimeType: string, allowedTypes: string[]): boolean {
  const type = mimeType.toLowerCase()
  return allowedTypes.some(allowed => type.startsWith(allowed.toLowerCase().replace(/\*.*$/, '')))
}
