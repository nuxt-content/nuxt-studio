import type { DatabaseItem, MediaItem, DraftItem, ContentConflict, GitFile, MarkdownFormattingChange, StudioHost } from '../types'
import { ContentFileExtension, DraftStatus } from '../types'
import { fromBase64ToUTF8 } from '../utils/string'
import { getFileExtension, isMediaFile } from './file'
import { areContentEqual } from './content'

export function decodeRemoteContent(remoteFile: GitFile): string {
  return remoteFile.encoding === 'base64' ? fromBase64ToUTF8(remoteFile.content!) : remoteFile.content!
}

export async function checkConflict(host: StudioHost, draftItem: DraftItem<DatabaseItem | MediaItem>): Promise<ContentConflict | undefined> {
  const generateContentFromDocument = host.document.generate.contentFromDocument
  const isDocumentMatchingContent = host.document.utils.isMatchingContent

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

  const remoteContent = decodeRemoteContent(draftItem.remoteFile)

  if (draftItem.status === DraftStatus.Created && remoteContent) {
    return {
      remoteContent,
      localContent: await generateContentFromDocument(draftItem.modified as DatabaseItem) as string,
    }
  }

  if (await isDocumentMatchingContent(remoteContent, draftItem.original! as DatabaseItem)) {
    return
  }

  const localContent = await generateContentFromDocument(draftItem.original as DatabaseItem) as string
  if (localContent.trim() === remoteContent.trim()) {
    return
  }

  return {
    remoteContent,
    localContent,
  }
}

export async function getMarkdownFormattingChange(host: StudioHost, draftItem: DraftItem<DatabaseItem | MediaItem>): Promise<MarkdownFormattingChange | undefined> {
  if (getFileExtension(draftItem.fsPath) !== ContentFileExtension.Markdown) {
    return
  }

  if (!draftItem.original || !draftItem.remoteFile?.content) {
    return
  }

  const formattedContent = await host.document.generate.contentFromDocument(draftItem.original as DatabaseItem)
  if (typeof formattedContent !== 'string') return

  const originalContent = decodeRemoteContent(draftItem.remoteFile)
  if (areContentEqual(formattedContent, originalContent)) return

  return { originalContent, formattedContent }
}

export function getPristineMarkdownRemoteContent(draftItem: DraftItem<DatabaseItem | MediaItem>): string | undefined {
  if (draftItem.status !== DraftStatus.Pristine || !draftItem.original || !draftItem.remoteFile?.content || getFileExtension(draftItem.fsPath) !== ContentFileExtension.Markdown) return
  return decodeRemoteContent(draftItem.remoteFile)
}

export function shouldShowMarkdownFormattingBanner(draftItem: DraftItem<DatabaseItem | MediaItem>): boolean {
  return !!draftItem.formatting && draftItem.status !== DraftStatus.Pristine
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
