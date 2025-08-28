import { ref, type Ref } from 'vue'
import type { StorageValue, Storage } from 'unstorage'
import type { DatabaseItem, DraftFileItem } from '../types'
import type { useHost } from './useHost'
import type { useGit } from './useGit'
import { createCollectionDocument, getCollectionInfo } from '../utils/collections'
import { deleteItemInDatabase, upsertItemInDatabase } from '../utils/database'
import { generateMarkdown } from '../utils/content'

export function useDraftFiles(host: ReturnType<typeof useHost>, git: ReturnType<typeof useGit>, storage: Storage<StorageValue>) {
  const draftFiles = ref<DraftFileItem[]>([])

  async function get(id: string, { generateContent = false }: { generateContent?: boolean } = {}) {
    const item = await storage.getItem(id) as DraftFileItem
    if (generateContent) {
      const { collection } = getCollectionInfo(id, host.content.collections)
      const doc = createCollectionDocument(collection, id, item.document!)
      return {
        ...item,
        content: await generateMarkdown(doc) || '',
      }
    }
    return item
  }

  async function upsert(id: string, document: DatabaseItem) {
    id = id.replace(/:/g, '/')
    let draft = await storage.getItem(id) as DraftFileItem
    if (!draft) {
      const { path } = getCollectionInfo(id, host.content.collections)

      // Fetch github file before creating draft to detect non deployed changes before publishing
      const originalGithubFile = await git.fetchFile(path, { cached: true })
      const originalDatabaseItem = await host.content.getDocumentById(id)

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

    await upsertItemInDatabase(host, id, draft.document!)

    host.nuxtApp.hooks.callHookParallel('app:data:refresh')
  }

  async function remove(id: string) {
    const draft = await storage.getItem(id) as DraftFileItem
    const { collection, path } = getCollectionInfo(id, host.content.collections)

    if (draft) {
      if (draft.status === 'deleted') return

      await storage.removeItem(id)
      await deleteItemInDatabase(host, id, collection)

      if (draft.originalDatabaseItem) {
        const deleteDraft: DraftFileItem = {
          id,
          path: draft.path,
          status: 'deleted',
          originalDatabaseItem: draft.originalDatabaseItem,
          originalGithubFile: draft.originalGithubFile,
        }

        await storage.setItem(id, deleteDraft)
        await upsertItemInDatabase(host, id, draft.originalDatabaseItem!)
      }
    }
    else {
      // Fetch github file before creating draft to detect non deployed changes
      const originalGithubFile = await git.fetchFile(path, { cached: true })
      const originalDatabaseItem = await host.content.getDocumentById(id)

      const deleteDraft: DraftFileItem = {
        id,
        path,
        status: 'deleted',
        originalDatabaseItem,
        originalGithubFile,
      }

      await storage.setItem(id, deleteDraft)

      await deleteItemInDatabase(host, id, collection)
    }

    draftFiles.value = draftFiles.value.filter(item => item.id !== id)
    host.nuxtApp.hooks.callHookParallel('app:data:refresh')
  }

  async function revert(id: string) {
    const draft = await storage.getItem(id) as DraftFileItem
    if (!draft) return

    await storage.removeItem(id)

    draftFiles.value = draftFiles.value.filter(item => item.id !== id)

    if (draft.originalDatabaseItem) {
      await upsertItemInDatabase(host, id, draft.originalDatabaseItem)
    }

    if (draft.status === 'created') {
      await deleteItemInDatabase(host, id)
    }

    host.nuxtApp.hooks.callHookParallel('app:data:refresh')
  }

  async function revertAll() {
    await storage.clear()
    for (const draft of draftFiles.value) {
      if (draft.originalDatabaseItem) {
        await upsertItemInDatabase(host, draft.id, draft.originalDatabaseItem)
      }
      else if (draft.status === 'created') {
        await deleteItemInDatabase(host, draft.id)
      }
    }
    draftFiles.value = []
    host.nuxtApp.hooks.callHookParallel('app:data:refresh')
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
