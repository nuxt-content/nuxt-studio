import { ref } from 'vue'
import type { StorageValue, Storage } from 'unstorage'
import type { DatabaseItem, DraftFileItem, StudioHost, GithubFile, DatabasePageItem } from '../types'
import { DraftStatus } from '../types/draft'
import type { useGit } from './useGit'
import { generateContentFromDocument } from '../utils/content'
import { getDraftStatus } from '../utils/draft'
import { createSharedComposable } from '@vueuse/core'
import { useHooks } from './useHooks'

export const useDraftFiles = createSharedComposable((host: StudioHost, git: ReturnType<typeof useGit>, storage: Storage<StorageValue>) => {
  const list = ref<DraftFileItem[]>([])
  const current = ref<DraftFileItem | null>(null)

  const hooks = useHooks()

  async function get(id: string, { generateContent = false }: { generateContent?: boolean } = {}) {
    const item = list.value.find(item => item.id === id)
    if (item && generateContent) {
      return {
        ...item,
        content: await generateContentFromDocument(item!.document as DatabasePageItem) || '',
      }
    }
    return item
  }

  async function create(document: DatabaseItem, status: DraftStatus = DraftStatus.Created) {
    const existingItem = list.value.find(item => item.id === document.id)
    if (existingItem) {
      throw new Error(`Draft file already exists for document ${document.id}`)
    }

    const fsPath = host.document.getFileSystemPath(document.id)
    const originalGithubFile = await git.fetchFile(fsPath, { cached: true }) as GithubFile

    const item: DraftFileItem = {
      id: document.id,
      fsPath,
      originalDatabaseItem: document,
      originalGithubFile,
      status,
      document,
    }

    await storage.setItem(document.id, item)

    list.value.push(item)

    await hooks.callHook('studio:draft:updated')

    return item
  }

  async function update(id: string, document: DatabaseItem) {
    const existingItem = list.value.find(item => item.id === id)
    if (!existingItem) {
      throw new Error(`Draft file not found for document ${id}`)
    }

    const oldStatus = existingItem.status
    existingItem.status = getDraftStatus(document, existingItem.originalDatabaseItem)
    existingItem.document = document

    await storage.setItem(id, existingItem)

    list.value = list.value.map(item => item.id === id ? existingItem : item)

    // Upsert document in database
    await host.document.upsert(id, existingItem.document)

    // Rerender host app
    host.app.requestRerender()

    // Trigger hook to warn that draft list has changed
    if (existingItem.status !== oldStatus) {
      await hooks.callHook('studio:draft:updated')
    }

    return existingItem
  }

  async function remove(id: string) {
    const item = await storage.getItem(id) as DraftFileItem
    const fsPath = host.document.getFileSystemPath(id)

    if (item) {
      if (item.status === DraftStatus.Deleted) return

      await storage.removeItem(id)
      await host.document.delete(id)

      if (item.originalDatabaseItem) {
        const deleteDraft: DraftFileItem = {
          id,
          fsPath: item.fsPath,
          status: DraftStatus.Deleted,
          originalDatabaseItem: item.originalDatabaseItem,
          originalGithubFile: item.originalGithubFile,
        }

        await storage.setItem(id, deleteDraft)
        await host.document.upsert(id, item.originalDatabaseItem!)
      }
    }
    else {
      // Fetch github file before creating draft to detect non deployed changes
      const originalGithubFile = await git.fetchFile(fsPath, { cached: true }) as GithubFile
      const originalDatabaseItem = await host.document.get(id)

      const deleteItem: DraftFileItem = {
        id,
        fsPath,
        status: DraftStatus.Deleted,
        originalDatabaseItem,
        originalGithubFile,
      }

      await storage.setItem(id, deleteItem)

      await host.document.delete(id)
    }

    list.value = list.value.filter(item => item.id !== id)
    host.app.requestRerender()
  }

  async function revert(id: string) {
    const existingItem = list.value.find(item => item.id === id)
    if (!existingItem) {
      return
    }

    if (existingItem.status === DraftStatus.Created) {
      await host.document.delete(id)
      await storage.removeItem(id)
      list.value = list.value.filter(item => item.id !== id)
    }
    else {
      await host.document.upsert(id, existingItem.originalDatabaseItem!)
      existingItem.status = DraftStatus.Opened
      existingItem.document = existingItem.originalDatabaseItem
      await storage.setItem(id, existingItem)
    }

    await hooks.callHook('studio:draft:updated')

    host.app.requestRerender()
  }

  async function revertAll() {
    await storage.clear()
    for (const item of list.value) {
      if (item.originalDatabaseItem) {
        await host.document.upsert(item.id, item.originalDatabaseItem)
      }
      else if (item.status === DraftStatus.Created) {
        await host.document.delete(item.id)
      }
    }
    list.value = []
    host.app.requestRerender()
  }

  async function load() {
    const storedList = await storage.getKeys().then(async (keys) => {
      return Promise.all(keys.map(async (key) => {
        const item = await storage.getItem(key) as DraftFileItem
        if (item.status === DraftStatus.Opened) {
          await storage.removeItem(key)
          return null
        }
        return item
      }))
    })

    list.value = storedList.filter(Boolean) as DraftFileItem[]

    // Upsert/Delete draft files in database
    await Promise.all(list.value.map(async (draftItem) => {
      if (draftItem.status === DraftStatus.Deleted) {
        await host.document.delete(draftItem.id)
      }
      else {
        await host.document.upsert(draftItem.id, draftItem.document!)
      }
    }))

    host.app.requestRerender()

    await hooks.callHook('studio:draft:updated')
  }

  function select(draftItem: DraftFileItem | null) {
    current.value = draftItem
  }

  async function selectById(id: string) {
    const existingItem = list.value.find(item => item.id === id)
    if (existingItem) {
      select(existingItem)
      return
    }

    const dbItem = await host.document.get(id)
    if (!dbItem) {
      throw new Error(`Cannot select item: no corresponding database entry found for id ${id}`)
    }

    const draftItem = await create(dbItem, DraftStatus.Opened)
    select(draftItem)
  }

  return {
    get,
    create,
    update,
    remove,
    revert,
    revertAll,
    list,
    load,
    current,
    select,
    selectById,
  }
})
