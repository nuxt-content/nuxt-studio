import { joinURL, withLeadingSlash } from 'ufo'
import type { DraftItem, StudioHost, MediaItem, RawFile } from '../types'
import { VIRTUAL_MEDIA_COLLECTION_NAME, generateStemFromFsPath } from '../utils/media'
import { DraftStatus } from '../types/draft'
import type { useGitProvider } from './useGitProvider'
import { createSharedComposable } from './createSharedComposable'
import { useDraftBase } from './useDraftBase'
import { mediaStorage as storage } from '../utils/storage'
import { getFileExtension, slugifyFileName } from '../utils/file'
import { useHooks } from './useHooks'
import { useError } from './useError'
import { consola } from 'consola'
import { ref } from 'vue'

const logger = consola.withTag('Nuxt Studio')
const hooks = useHooks()
const { showError } = useError()

export const useDraftMedias = createSharedComposable((host: StudioHost, gitProvider: ReturnType<typeof useGitProvider>) => {
  const {
    isLoading,
    list,
    current,
    get,
    create,
    remove,
    revert,
    revertAll,
    selectByFsPath,
    unselect,
    load,
    getStatus,
  } = useDraftBase('media', host, gitProvider, storage)

  const isExternalMedia = host.meta.media?.external

  // Shared uploading indicator so both drag & drop and the toolbar upload
  // trigger the same overlay.
  const isUploading = ref(false)
  async function createFolder(parentFsPath: string): Promise<string | undefined> {
    try {
      const gitkeepFsPath = joinURL(parentFsPath, '.gitkeep')
      const gitKeepMedia: MediaItem = {
        id: joinURL(VIRTUAL_MEDIA_COLLECTION_NAME, gitkeepFsPath),
        fsPath: gitkeepFsPath,
        stem: generateStemFromFsPath(gitkeepFsPath),
        extension: '',
      }

      await host.media.upsert(gitkeepFsPath, gitKeepMedia)

      if (!isExternalMedia) {
        await create(gitkeepFsPath, gitKeepMedia)
      }

      await hooks.callHook('studio:draft:media:updated', { caller: 'useDraftMedias.createFolder' })

      return gitkeepFsPath
    }
    catch (error) {
      showError('Error creating folder', (error as Error).message)
    }
  }

  async function upload(parentFsPath: string, file: File) {
    isUploading.value = true
    try {
      const draftItem = await fileToDraftItem(parentFsPath, file)

      if (isExternalMedia) {
        await host.media.upsert(draftItem.fsPath, draftItem.modified!)

        // Fetch the provider metadata back so the draft immediately shows the
        // remote URL (instead of the temporary local data URL) and is selectable
        // without a page reload.
        const uploadedMedia = await host.media.get(draftItem.fsPath)
        const remoteDraftItem: DraftItem<MediaItem> = {
          ...draftItem,
          remoteFile: undefined,
          status: DraftStatus.Created,
          modified: {
            ...draftItem.modified,
            ...(uploadedMedia || {}),
            raw: undefined,
          },
        }

        await storage.setItem(draftItem.fsPath, remoteDraftItem)
        list.value.push(remoteDraftItem)
      }
      else {
        await host.media.upsert(draftItem.fsPath, draftItem.modified!)
        await create(draftItem.fsPath, draftItem.modified!)
      }

      await hooks.callHook('studio:draft:media:updated', { caller: 'useDraftMedias.upload' })

      if (isExternalMedia) {
        host.app.requestRerender()
      }
    }
    catch (error) {
      logger.error('Error uploading media:', error)
      showError('Error uploading media', (error as Error).message)
    }
    finally {
      isUploading.value = false
    }
  }

  async function fileToDraftItem(parentFsPath: string, file: File): Promise<DraftItem<MediaItem>> {
    const rawData = await fileToDataUrl(file)
    const slugifiedFileName = slugifyFileName(file.name)
    const fsPath = parentFsPath !== '/' ? joinURL(parentFsPath, slugifiedFileName) : slugifiedFileName

    return {
      fsPath,
      remoteFile: undefined,
      status: DraftStatus.Created,
      modified: {
        id: joinURL(VIRTUAL_MEDIA_COLLECTION_NAME, fsPath),
        fsPath,
        extension: getFileExtension(fsPath),
        stem: generateStemFromFsPath(fsPath),
        path: withLeadingSlash(fsPath),
        raw: rawData,
      },
    }
  }

  async function rename(items: { fsPath: string, newFsPath: string }[]) {
    // TODO: Implement rename with external storage
    if (isExternalMedia) {
      showError('Error renaming media', 'External storage renaming must be implemented')
      return
    }

    for (const item of items) {
      const { fsPath, newFsPath } = item

      const existingDraftToRename = list.value.find(draftItem => draftItem.fsPath === fsPath) as DraftItem<MediaItem>

      const currentDbItem = await host.media.get(fsPath)
      if (!currentDbItem) {
        throw new Error(`Database item not found for document fsPath: ${fsPath}`)
      }

      await remove([fsPath], { rerender: false })

      const newDbItem: MediaItem = {
        ...currentDbItem,
        fsPath: newFsPath,
        id: joinURL(VIRTUAL_MEDIA_COLLECTION_NAME, newFsPath),
        stem: generateStemFromFsPath(newFsPath),
        path: withLeadingSlash(newFsPath),
      }

      await host.media.upsert(newFsPath, newDbItem)

      let originalDbItem: MediaItem | undefined = currentDbItem
      if (existingDraftToRename) {
        originalDbItem = existingDraftToRename.original
      }

      await create(newFsPath, newDbItem, originalDbItem, { rerender: false })
    }

    await hooks.callHook('studio:draft:media:updated', { caller: 'useDraftMedias.rename' })
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  async function listAsRawFiles(): Promise<RawFile[]> {
    if (isExternalMedia) {
      return []
    }
    const files = [] as RawFile[]
    for (const draftItem of list.value) {
      if (draftItem.status === DraftStatus.Pristine) {
        continue
      }

      if (draftItem.status === DraftStatus.Deleted) {
        files.push({ path: joinURL('public', draftItem.fsPath), content: null, status: draftItem.status, encoding: 'base64' })
        continue
      }

      const raw = draftItem.modified?.raw as string | undefined
      const content = raw ? raw.replace(/^data:[^;]+;base64,/, '') : ''
      files.push({ path: joinURL('public', draftItem.fsPath), content, status: draftItem.status, encoding: 'base64' })
    }

    return files
  }

  return {
    isLoading,
    isUploading,
    list,
    current,
    get,
    create,
    update: () => {},
    duplicate: () => {},
    remove,
    revert,
    revertAll,
    createFolder,
    rename,
    load,
    selectByFsPath,
    unselect,
    upload,
    listAsRawFiles,
    getStatus,
    applyFormatting: () => {},
  }
})
