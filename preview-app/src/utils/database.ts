import type { useHost } from '../composables/useHost'
import type { DatabaseItem } from '../types'
import { createCollectionDocument, generateRecordUpdate, getCollectionInfo } from './collections'

export async function applyDraftToDatabase(host: ReturnType<typeof useHost>, id: string, content: DatabaseItem) {
  id = id.replace(/:/g, '/')
  const { collection } = getCollectionInfo(id, host.content.collections)
  const doc = createCollectionDocument(collection, id, content)

  await generateRecordUpdate(collection, id, doc)
    .filter(Boolean)
    .reduce(async (acc, query) => await acc.then(async () => {
      await host.databaseAdapter(collection.name).exec(query)
    }), Promise.resolve())
}
