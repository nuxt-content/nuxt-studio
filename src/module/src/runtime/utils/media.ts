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
