import { join } from 'pathe'
import { withLeadingSlash } from 'ufo'
import { VIRTUAL_MEDIA_COLLECTION_NAME } from './constants'

export function generateIdFromFsPath(fsPath: string) {
  return join(VIRTUAL_MEDIA_COLLECTION_NAME, fsPath)
}

export function generateStemFromFsPath(fsPath: string) {
  return fsPath.split('.').slice(0, -1).join('.')
}

export interface MediaItemKeyFields {
  id: string
  extension: string
  stem: string
  path: string
  fsPath: string
  [key: string]: unknown
}

// eslint-disable-next-line no-control-regex
const UNSAFE_KEY_CHAR_RE = /[?#\\\x00-\x1F\x7F]/
const DOT_SEGMENT_RE = /^[.\s]+$/

// Rejects keys that could escape the storage prefix once a driver turns them into a path or URL.
export function isSafeStorageKey(key: string): boolean {
  let current = key
  for (let i = 0; i < 5; i++) {
    if (UNSAFE_KEY_CHAR_RE.test(current) || current.split(/[:/]/).some(segment => DOT_SEGMENT_RE.test(segment))) {
      return false
    }

    let decoded: string
    try {
      decoded = decodeURIComponent(current)
    }
    catch {
      return false
    }

    if (decoded === current) {
      return true
    }
    current = decoded
  }

  return false
}

// `key` must be a raw, unprefixed storage key — strip VIRTUAL_MEDIA_COLLECTION_NAME first if present
export function mediaItemFieldsFromKey(key: string): MediaItemKeyFields {
  const fsPath = withLeadingSlash(key.replace(/:/g, '/'))
  return {
    id: generateIdFromFsPath(fsPath),
    extension: key.split('.').pop() || '',
    stem: generateStemFromFsPath(fsPath),
    path: fsPath,
    fsPath,
  }
}
