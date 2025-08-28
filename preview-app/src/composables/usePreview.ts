import { createStorage } from 'unstorage'
import indexedDbDriver from 'unstorage/drivers/indexedb'
import { getCollectionInfo, generateRecordDeletion } from '../utils/collections'
import { upsertItemInDatabase } from '../utils/database'
import { useHost } from './useHost'
import { useGit } from './useGit'
import { useDraftFiles } from './useDraftFiles'
import { useDbFiles } from './useDbFiles'

const storage = createStorage({
  driver: indexedDbDriver({
    storeName: 'nuxt-content-preview',
  }),
})

export function usePreview() {
  const host = useHost()
  const git = useGit({
    owner: 'owner',
    repo: 'repo',
    branch: 'main',
    token: '',
    authorName: 'Name',
    authorEmail: 'email@example.com',
  })

  const draftFiles = useDraftFiles(host, git, storage)
  const dbFiles = useDbFiles(host)

  host.onMounted(async () => {
    await draftFiles.load()
    await Promise.all(draftFiles.list.value.map(async (draft) => {
      if (draft.status === 'deleted') {
        const { collection } = getCollectionInfo(draft.id, host.content.collections)
        await host.databaseAdapter(collection.name).exec(generateRecordDeletion(collection, draft.id))
      }
      else {
        await upsertItemInDatabase(host, draft.id, draft.document!)
      }
    }))
    host.nuxtApp.hooks.callHookParallel('app:data:refresh')
  })

  host.onBeforeUnload((event: BeforeUnloadEvent) => {
    // Ignore on development to prevent annoying dialogs
    if (import.meta.dev) return
    if (!draftFiles.list.value.length) return

    // Recommended
    event.preventDefault()
    event = event || window.event

    // For IE and Firefox prior to version 4
    if (event) {
      event.returnValue = 'Sure?'
    }

    // For Safari
    return 'Sure?'
  })

  return {
    host,
    git,
    draftFiles,
    dbFiles,
    // draftMedia: {
    //   get -> DraftMediaItem
    //   upsert
    //   remove
    //   revert
    //   move
    //   list -> DraftMediaItem[]
    //   revertAll
    // }
    // media: {
    //   list -> MediaItem[]
    // }
    // config {
    //   get -> ConfigItem
    //   update
    //   revert
    // }
  }
}
