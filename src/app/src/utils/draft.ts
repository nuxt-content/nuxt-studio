import type { DatabaseItem, MediaItem, DraftItem, ContentConflict, StudioHost } from '../types'
import { DraftStatus } from '../types'
import { fromBase64ToUTF8 } from '../utils/string'
import { isMediaFile } from './file'

export async function checkConflict(host: StudioHost, draftItem: DraftItem<DatabaseItem | MediaItem>): Promise<ContentConflict | undefined> {
  const generateContentFromDocument = host.document.generate.contentFromDocument

  if (isMediaFile(draftItem.fsPath) || draftItem.fsPath.endsWith('.gitkeep')) {
    return
  }

  if (draftItem.status === DraftStatus.Deleted) {
    return
  }

  // TODO: No remote file found (might have been deleted remotely)
  if (!draftItem.remoteFile || !draftItem.remoteFile.content) {
    return
  }

  const remoteContent = decodeRemote(draftItem.remoteFile)!

  // A locally-created file that now exists on the remote is a genuine collision.
  if (draftItem.status === DraftStatus.Created) {
    return {
      remoteContent,
      localContent: await generateContentFromDocument(draftItem.modified as DatabaseItem) as string,
    }
  }

  // Updated: compare the raw baseline (state A captured at draft creation) against
  // the current remote (state A now). Pure SHA/text — no parsing, no render.
  // Comark formatting drift (A vs E(B)) is handled by the formatting banner, not here.
  const baseline = draftItem.baseRemote
  if (!baseline) {
    // Legacy draft created before baselines existed; load() backfills it.
    return
  }

  const baseSha = baseline.sha
  const currentSha = draftItem.remoteFile.sha
  const remoteMoved = baseSha && currentSha
    ? baseSha !== currentSha
    : (decodeRemote(baseline) ?? '').trim() !== remoteContent.trim()

  if (!remoteMoved) {
    return
  }

  return {
    remoteContent,
    localContent: await generateContentFromDocument(draftItem.original as DatabaseItem) as string,
  }
}

/** Decode a GitFile-like { content, encoding } to raw UTF-8 text. */
function decodeRemote(file?: { content?: string | null, encoding?: string }): string | null {
  if (!file?.content) return null
  return file.encoding === 'base64' ? fromBase64ToUTF8(file.content) : file.content
}

export function findDescendantsFromFsPath(list: DraftItem[], fsPath: string): DraftItem[] {
  if (fsPath === '/') {
    return list
  }

  const descendants: DraftItem[] = []
  for (const item of list) {
    const isExactMatch = item.fsPath === fsPath
    // If exact match it means id refers to a file, there is no need to browse the list further
    if (isExactMatch) {
      return [item]
    }

    // Else it means id refers to a directory, we need to browse the list further to find all descendants
    const isDescendant = item.fsPath.startsWith(fsPath + '/')
    if (isDescendant) {
      descendants.push(item)
    }
  }

  return descendants
}
