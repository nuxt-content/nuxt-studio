import type { useHost } from '../composables/useHost'
import type { DatabaseItem } from '../types'
import type { CollectionInfo } from '@nuxt/content'
import { createCollectionDocument, generateRecordUpsert, generateRecordDeletion, getCollectionInfo } from './collections'

export async function upsertItemInDatabase(host: ReturnType<typeof useHost>, id: string, item: DatabaseItem, collection?: CollectionInfo) {
  id = id.replace(/:/g, '/')

  if (!collection) {
    collection = getCollectionInfo(id, host.content.collections).collection
  }

  const doc = createCollectionDocument(collection, id, item)

  await generateRecordUpsert(collection, id, doc)
    .filter(Boolean)
    .reduce(async (acc, query) => await acc.then(async () => {
      await host.databaseAdapter(collection.name).exec(query)
    }), Promise.resolve())
}

export async function deleteItemInDatabase(host: ReturnType<typeof useHost>, id: string, collection?: CollectionInfo) {
  id = id.replace(/:/g, '/')

  if (!collection) {
    collection = getCollectionInfo(id, host.content.collections).collection
  }

  await host.databaseAdapter(collection.name).exec(generateRecordDeletion(collection, id))
}
