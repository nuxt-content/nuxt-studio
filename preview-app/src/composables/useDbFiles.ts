import type { DatabaseItem } from '../types'
import type { useHost } from './useHost'

export function useDbFiles(host: ReturnType<typeof useHost>) {
  async function list() {
    const collections = Object.keys(host.content.collections).filter(c => c !== 'info')
    const contents = await Promise.all(collections.map(async (collection) => {
      const docs = await host.content.queryCollection(collection).all() as DatabaseItem[]
      return docs
    }))
    return contents.flat()
  }

  return {
    list,
  }
}
