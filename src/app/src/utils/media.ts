import { joinURL } from 'ufo'
import { TreeRootId } from '../types'

export function generateStemFromFsPath(fsPath: string) {
  return fsPath.split('.').slice(0, -1).join('.')
}

export function generateIdFromFsPath(fsPath: string) {
  return joinURL(TreeRootId.Media, fsPath)
}
