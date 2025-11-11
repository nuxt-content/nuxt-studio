import { join } from 'pathe'
import { VirtualMediaCollectionName } from 'nuxt-studio/app'

export function generateIdFromFsPath(fsPath: string) {
  return join(VirtualMediaCollectionName, fsPath)
}
