import type { Storage } from 'unstorage'
import { joinURL } from 'ufo'
import type { DraftItem, StudioHost, GitFile, DatabaseItem, MediaItem, BaseItem } from '../types'
import { ContentFileExtension } from '../types'
import { DraftStatus } from '../types/draft'
import { checkConflict, findDescendantsFromFsPath } from '../utils/draft'
import type { useGitProvider } from './useGitProvider'
import { useHooks } from './useHooks'
import { ref } from 'vue'
import { useStudioState } from './useStudioState'

export function useDraftBase<T extends DatabaseItem | MediaItem>(
  type: 'media' | 'document',
  host: StudioHost,
  gitProvider: ReturnType<typeof useGitProvider>,
  storage: Storage<DraftItem<T>>,
) {
  const isLoading = ref(false)
  const list = ref<DraftItem<DatabaseItem | MediaItem>[]>([])
  const current = ref<DraftItem<DatabaseItem | MediaItem> | null>(null)

  const remotePathPrefix = type === 'media' ? 'public' : 'content'
  const hostDb = type === 'media' ? host.media : host.document.db
  const areDocumentsEqual = host.document.utils.areEqual
  const aiContextFolder = host.meta.ai?.context?.contentFolder
  const aiEnabled = host.meta.ai?.enabled

  const hooks = useHooks()
  const { devMode } = useStudioState()

  const isExternalMedia = type === 'media' && !!host.meta.media?.external

  const hookName = (fsPath: string): 'studio:draft:document:updated' | 'studio:draft:ai:updated' | 'studio:draft:media:updated' => {
    const name = `studio:draft:${type}:updated`
    if (aiEnabled && fsPath.startsWith(`${aiContextFolder}/`)) {
      return 'studio:draft:ai:updated'
    }

    return name as 'studio:draft:document:updated' | 'studio:draft:ai:updated' | 'studio:draft:media:updated'
  }

  async function get(fsPath: string): Promise<DraftItem<T> | undefined> {
    return list.value.find(item => item.fsPath === fsPath) as DraftItem<T>
  }

  async function create(fsPath: string, item: T, original?: T, { rerender = true }: { rerender?: boolean } = {}): Promise<DraftItem<T>> {
    const existingItem = list.value?.find(draft => draft.fsPath === fsPath)
    if (existingItem) {
      throw new Error(`Draft file already exists for document at ${fsPath}`)
    }

    const remoteFile = await gitProvider.api.fetchFile(joinURL(remotePathPrefix, fsPath), { cached: true }) as GitFile

    const draftItem: DraftItem<T> = {
      fsPath,
      remoteFile,
      baseRemote: remoteFile?.content
        ? { content: remoteFile.content, sha: remoteFile.sha ?? '', encoding: remoteFile.encoding as 'utf-8' | 'base64' | undefined }
        : undefined,
      status: await getStatus(item, original!),
      modified: item,
    }

    if (original) {
      draftItem.original = original
    }

    const conflict = await checkConflict(host, draftItem)
    if (conflict) {
      draftItem.conflict = conflict
    }

    await storage.setItem(fsPath, draftItem)

    list.value.push(draftItem)

    // Skip tree rebuild for pristine drafts - they don't change anything visually
    if (rerender && draftItem.status !== DraftStatus.Pristine) {
      await hooks.callHook(hookName(fsPath), { caller: 'useDraftBase.create' })
    }

    return draftItem
  }

  async function remove(fsPaths: string[], { rerender = true }: { rerender?: boolean } = {}) {
    for (const fsPath of fsPaths) {
      const existingDraftItem = list.value.find(item => item.fsPath === fsPath) as DraftItem<T> | undefined
      const originalDbItem = await hostDb.get(fsPath) as T

      await storage.removeItem(fsPath)
      await hostDb.delete(fsPath)

      if (!devMode.value && !isExternalMedia) {
        let deleteDraftItem: DraftItem<T> | null = null
        if (existingDraftItem) {
          if (existingDraftItem.status === DraftStatus.Deleted) return

          if (existingDraftItem.status === DraftStatus.Created) {
            list.value = list.value.filter(item => item.fsPath !== fsPath)
          }
          else {
            // TODO: check if remote file has been updated
            const remoteFile = await gitProvider.api.fetchFile(joinURL('content', fsPath), { cached: true }) as GitFile

            deleteDraftItem = {
              fsPath: existingDraftItem.fsPath,
              status: DraftStatus.Deleted,
              original: existingDraftItem.original,
              remoteFile,
            }

            list.value = list.value.map(item => item.fsPath === fsPath ? deleteDraftItem! : item) as DraftItem<T>[]
          }
        }
        else {
        // TODO: check if gh file has been updated
          const remoteFile = await gitProvider.api.fetchFile(joinURL('content', fsPath), { cached: true }) as GitFile

          deleteDraftItem = {
            fsPath,
            status: DraftStatus.Deleted,
            original: originalDbItem,
            remoteFile,
          }

          list.value.push(deleteDraftItem)
        }

        if (deleteDraftItem) {
          await storage.setItem(fsPath, deleteDraftItem)
        }
      }

      if (rerender) {
        await hooks.callHook(hookName(fsPath), { caller: 'useDraftBase.remove' })
      }
    }
  }

  async function revert(fsPath: string, { rerender = true }: { rerender?: boolean } = {}) {
    const draftItems = findDescendantsFromFsPath(list.value, fsPath)

    for (const draftItem of draftItems) {
      const existingItem = list.value.find(item => item.fsPath === draftItem.fsPath) as DraftItem<T>
      if (!existingItem) {
        return
      }

      if (existingItem.status === DraftStatus.Created) {
        await hostDb.delete(draftItem.fsPath)
        await storage.removeItem(draftItem.fsPath)
        list.value = list.value.filter(item => item.fsPath !== draftItem.fsPath)

        // Renamed draft
        if (existingItem.original) {
          await revert(existingItem.original.fsPath!, { rerender: false })
        }
      }
      else {
        // @ts-expect-error upsert type is wrong, second param should be DatabaseItem | MediaItem
        await hostDb.upsert(draftItem.fsPath, existingItem.original)
        existingItem.modified = existingItem.original
        existingItem.formattingApplied = false
        existingItem.status = await getStatus(existingItem.modified as DatabaseItem, existingItem.original as DatabaseItem)
        await storage.setItem(draftItem.fsPath, existingItem)
      }
    }

    if (rerender) {
      await hooks.callHook(hookName(fsPath), { caller: 'useDraftBase.revert' })
    }
  }

  async function revertAll() {
    const itemsToRevert = [...list.value]

    for (const draftItem of itemsToRevert) {
      await revert(draftItem.fsPath, { rerender: false })
    }

    await hooks.callHook(`studio:draft:${type}:updated`, { caller: 'useDraftBase.revertAll' })

    if (aiEnabled) {
      const iaFsPath = itemsToRevert.find(item => item.fsPath.startsWith(`${aiContextFolder}/`))?.fsPath
      if (iaFsPath) {
        await hooks.callHook('studio:draft:ai:updated', { caller: 'useDraftBase.revertAll' })
      }
    }
  }

  /**
   * Re-fetches the remote file for each non-Pristine draft (bypassing the local
   * in-memory cache) and runs conflict detection against the current remote HEAD.
   * If any conflict is found the affected draft's `conflict` field is set in
   * memory and persisted to IndexedDB so the conflict editor can render it.
   *
   * Returns true when at least one conflict was detected (publish should abort).
   * Returns false when all drafts are safe to commit.
   *
   * Call this BEFORE `commitFiles` so concurrent remote edits are surfaced instead
   * of silently overwritten.
   */
  async function checkAndRefreshConflicts(): Promise<boolean> {
    let hasConflict = false

    const nonPristineDrafts = list.value.filter(d => d.status !== DraftStatus.Pristine)

    for (const draftItem of nonPristineDrafts) {
      // Re-fetch the remote bypassing the in-memory cache
      const freshRemote = await gitProvider.api.fetchFile(
        joinURL(remotePathPrefix, draftItem.fsPath),
        { cached: false },
      )

      // A-vs-A: spread keeps draftItem.baseRemote (state A at draft creation) unchanged;
      // only remoteFile is replaced with the fresh fetch (state A now). checkConflict
      // then compares baseSha vs currentSha — pure SHA gate, no comark parsing.
      const checkItem = { ...draftItem, remoteFile: freshRemote ?? undefined }
      const conflict = await checkConflict(host, checkItem)

      if (conflict) {
        // Update the draft in place: fresh remote baseline + detected conflict
        draftItem.remoteFile = freshRemote ?? draftItem.remoteFile
        draftItem.conflict = conflict
        await storage.setItem(draftItem.fsPath, draftItem as DraftItem<T>)
        hasConflict = true
      }
    }

    return hasConflict
  }

  /**
   * Transition all non-Pristine drafts to "published" state after a successful
   * Git commit. The draft becomes a self-healing overlay that keeps the committed
   * content visible during the deploy lag (i.e. while the SQLite dump is stale).
   *
   * - Updated / Created → status becomes Pristine; `original` is set to `modified`
   *   (committed tree is the new baseline); `remoteFile` is updated to reflect the
   *   committed content; `conflict` and `formattingApplied` are cleared;
   *   `published` is set to true. The DB already holds `modified` from the editing
   *   session so no upsert is required here.
   * - Deleted → `published` is set to true and the draft is persisted as-is (the
   *   DB delete was already applied; the draft keeps overlaying the deletion until
   *   the deploy drops the file).
   * - Pristine → unchanged (nothing was committed).
   * - No-op in dev mode (drafts are always Pristine there).
   */
  async function markPublished() {
    if (devMode.value) return

    const generateContentFromDocument = type === 'document'
      ? host.document.generate.contentFromDocument
      : null

    const itemsToPublish = [...list.value]

    for (const draftItem of itemsToPublish) {
      if (draftItem.status === DraftStatus.Pristine) continue

      if (draftItem.status === DraftStatus.Deleted) {
        draftItem.published = true
        await storage.setItem(draftItem.fsPath, draftItem as DraftItem<T>)
        continue
      }

      // Updated / Created: advance the baseline to what was committed
      const committedContent = generateContentFromDocument
        ? await generateContentFromDocument(draftItem.modified as DatabaseItem) as string
        : null

      draftItem.original = draftItem.modified
      draftItem.remoteFile = committedContent !== null
        ? {
            name: draftItem.fsPath.split('/').pop() || draftItem.fsPath,
            path: draftItem.fsPath,
            sha: '',
            size: committedContent.length,
            url: '',
            content: committedContent,
            encoding: 'utf-8' as const,
            provider: draftItem.remoteFile?.provider || 'github' as const,
          }
        : draftItem.remoteFile
      delete draftItem.conflict
      draftItem.formattingApplied = false
      draftItem.published = true
      draftItem.status = DraftStatus.Pristine

      await storage.setItem(draftItem.fsPath, draftItem as DraftItem<T>)
    }

    // No hook — published items are invisible to the review/draft-count views
  }

  async function unselect() {
    current.value = null
  }

  async function selectByFsPath(fsPath: string) {
    isLoading.value = true

    try {
      const existingItem = list.value?.find(item => item.fsPath === fsPath) as DraftItem<T>
      if (existingItem) {
        current.value = existingItem
        return
      }

      const dbItem = await hostDb.get(fsPath) as T
      if (!dbItem) {
        throw new Error(`Cannot select item: no corresponding database entry found for fsPath ${fsPath}`)
      }

      const draftItem = await create(fsPath, dbItem, dbItem)

      current.value = draftItem
    }
    finally {
      isLoading.value = false
    }
  }

  async function load() {
    const generateContentFromDocument = type === 'document'
      ? host.document.generate.contentFromDocument
      : null

    const storedList = await storage.getKeys().then(async (keys) => {
      return Promise.all(keys.map(async (key) => {
        const item = await storage.getItem(key) as DraftItem

        // Self-heal for published drafts: purge once the deployed dump has caught up.
        if (item.published) {
          if (item.status === DraftStatus.Deleted) {
            // Caught up when the file is no longer in the DB (deployment dropped it).
            const dbItem = await hostDb.get(item.fsPath)
            if (!dbItem) {
              await storage.removeItem(key)
              return null
            }
          }
          else if (item.status === DraftStatus.Pristine) {
            // Caught up when the DB content matches the committed content stored in remoteFile.
            const dbItem = await hostDb.get(item.fsPath)
            if (dbItem && item.remoteFile?.content) {
              const isMatchingContent = host.document.utils.isMatchingContent
              const committedContent = item.remoteFile.content
              const isCaughtUp = await isMatchingContent(committedContent, dbItem as DatabaseItem)
              if (isCaughtUp) {
                await storage.removeItem(key)
                return null
              }
            }
            else if (!dbItem) {
              // DB item gone entirely — the deploy likely removed it; treat as caught up.
              await storage.removeItem(key)
              return null
            }
            // Deploy not yet complete: keep the overlay alive (fall through to upsert below).
            // Re-compute content from remoteFile so the editor shows the committed version
            // even after a full-page reload (the DB was reset by revert before the reload).
            if (generateContentFromDocument && item.modified) {
              // The modified is already the committed content; keep it as-is.
            }
          }
          return item
        }

        if (item.status === DraftStatus.Pristine) {
          await storage.removeItem(key)
          return null
        }
        return item
      }))
    })

    list.value = storedList.filter(Boolean) as DraftItem<DatabaseItem>[]

    // Upsert/Delete draft files in database
    await Promise.all(list.value.map(async (draftItem) => {
      if (draftItem.status === DraftStatus.Deleted) {
        await hostDb.delete(draftItem.fsPath)
      }
      else {
        // @ts-expect-error upsert type is wrong, second param should be DatabaseItem | MediaItem
        await hostDb.upsert(draftItem.fsPath, draftItem.modified)
      }
    }))

    await hooks.callHook(`studio:draft:${type}:updated`, { caller: 'useDraftBase.load' })

    if (type === 'document' && aiEnabled) {
      await hooks.callHook('studio:draft:ai:updated', { caller: 'useDraftBase.load' })
    }
  }

  async function getStatus(modified: BaseItem, original: BaseItem, opts?: { formattingApplied?: boolean }): Promise<DraftStatus> {
    if (devMode.value) {
      return DraftStatus.Pristine
    }

    if (!modified && !original) {
      throw new Error('Unconsistent state: both modified and original are undefined')
    }

    if (!modified) {
      return DraftStatus.Deleted
    }

    if (!original || original.id !== modified.id) {
      return DraftStatus.Created
    }

    // User explicitly accepted comark's formatting via the banner
    if (opts?.formattingApplied) {
      return DraftStatus.Updated
    }

    if (original.extension === ContentFileExtension.Markdown) {
      if (!await areDocumentsEqual(original as DatabaseItem, modified as DatabaseItem)) {
        return DraftStatus.Updated
      }
    }
    else if (typeof original === 'object' && typeof modified === 'object') {
      if (!await areDocumentsEqual(original as DatabaseItem, modified as DatabaseItem)) {
        return DraftStatus.Updated
      }
    }
    else {
      if (JSON.stringify(original) !== JSON.stringify(modified)) {
        return DraftStatus.Updated
      }
    }

    return DraftStatus.Pristine
  }

  return {
    isLoading,
    list,
    current,
    get,
    create,
    remove,
    revert,
    revertAll,
    checkAndRefreshConflicts,
    markPublished,
    selectByFsPath,
    unselect,
    load,
    checkConflict,
    getStatus,
  }
}
