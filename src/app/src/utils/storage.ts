import { createStorage } from 'unstorage'
import indexedDbDriver from 'unstorage/drivers/indexedb'
import nullDriver from 'unstorage/drivers/null'
import type { DraftItem } from '../types/draft'
import type { DatabaseItem, MediaItem } from '../types'

export const nullStorageDriver = nullDriver()

export const indexedDbStorageDriver = (name: string) => indexedDbDriver({
  dbName: `studio-${name}`,
  storeName: 'drafts',
})

export const documentStorage = createStorage <DraftItem<DatabaseItem>>({ driver: indexedDbStorageDriver('document') })

export const mediaStorage = createStorage<DraftItem<MediaItem>>({ driver: indexedDbStorageDriver('media') })
