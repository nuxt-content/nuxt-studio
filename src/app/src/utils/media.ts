export function generateStemFromFsPath(fsPath: string) {
  return fsPath.split('.').slice(0, -1).join('.')
}

export const VIRTUAL_MEDIA_COLLECTION_NAME = 'public-assets' as const
