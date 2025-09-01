import { ref, type Ref } from 'vue'
import type { StorageValue, Storage } from 'unstorage'
import type { DatabaseItem, DraftFileItem, StudioHost } from '../types'
import type { useGit } from './useGit'
import { generateMarkdown } from '../utils/content'

export function useDraftFiles(host: StudioHost, git: ReturnType<typeof useGit>, storage: Storage<StorageValue>) {
  const draftFiles = ref<DraftFileItem[]>([])

  async function get(id: string, { generateContent = false }: { generateContent?: boolean } = {}) {
    const item = await storage.getItem(id) as DraftFileItem
    if (generateContent) {
      return {
        ...item,
        content: await generateMarkdown(item.document!) || '',
      }
    }
    return item
  }

  async function upsert(id: string, document: DatabaseItem) {
    id = id.replace(/:/g, '/')
    let draft = await storage.getItem(id) as DraftFileItem
    if (!draft) {
      const path = host.document.getFileSystemPath(id)

      // Fetch github file before creating draft to detect non deployed changes before publishing
      const originalGithubFile = await git.fetchFile(path, { cached: true })
      const originalDatabaseItem = await host.document.get(id)

      draft = {
        id,
        path,
        originalDatabaseItem,
        originalGithubFile,
        status: originalGithubFile || originalDatabaseItem ? 'updated' : 'created',
        document,
      }
    }
    else {
      draft.document = document
    }

    await storage.setItem(id, draft)

    // Update draftFiles
    const draftItem = draftFiles.value.find(item => item.id == id)
    if (draftItem) {
      draftItem.document = document
    }
    else {
      draftFiles.value.push(draft)
    }

    await host.document.upsert(id, draft.document!)
    host.requestRerender()
  }

  async function remove(id: string) {
    const draft = await storage.getItem(id) as DraftFileItem
    const path = host.document.getFileSystemPath(id)

    if (draft) {
      if (draft.status === 'deleted') return

      await storage.removeItem(id)
      await host.document.delete(id)

      if (draft.originalDatabaseItem) {
        const deleteDraft: DraftFileItem = {
          id,
          path: draft.path,
          status: 'deleted',
          originalDatabaseItem: draft.originalDatabaseItem,
          originalGithubFile: draft.originalGithubFile,
        }

        await storage.setItem(id, deleteDraft)
        await host.document.upsert(id, draft.originalDatabaseItem!)
      }
    }
    else {
      // Fetch github file before creating draft to detect non deployed changes
      const originalGithubFile = await git.fetchFile(path, { cached: true })
      const originalDatabaseItem = await host.document.get(id)

      const deleteDraft: DraftFileItem = {
        id,
        path,
        status: 'deleted',
        originalDatabaseItem,
        originalGithubFile,
      }

      await storage.setItem(id, deleteDraft)

      await host.document.delete(id)
    }

    draftFiles.value = draftFiles.value.filter(item => item.id !== id)
    host.requestRerender()
  }

  async function revert(id: string) {
    const draft = await storage.getItem(id) as DraftFileItem
    if (!draft) return

    await storage.removeItem(id)

    draftFiles.value = draftFiles.value.filter(item => item.id !== id)

    if (draft.originalDatabaseItem) {
      await host.document.upsert(id, draft.originalDatabaseItem)
    }

    if (draft.status === 'created') {
      await host.document.delete(id)
    }
    host.requestRerender()
  }

  async function revertAll() {
    await storage.clear()
    for (const draft of draftFiles.value) {
      if (draft.originalDatabaseItem) {
        await host.document.upsert(draft.id, draft.originalDatabaseItem)
      }
      else if (draft.status === 'created') {
        await host.document.delete(draft.id)
      }
    }
    draftFiles.value = []
    host.requestRerender()
  }

  async function load() {
    const list = await storage.getKeys().then(keys => Promise.all(keys.map(key => storage.getItem(key) as unknown as DraftFileItem)))
    draftFiles.value = list
    return list
  }

  return {
    get,
    upsert,
    remove,
    revert,
    revertAll,
    list: draftFiles as Ref<Readonly<DraftFileItem[]>>,
    load,
  }
}
