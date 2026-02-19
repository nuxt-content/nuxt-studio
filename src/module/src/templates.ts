import type { Storage } from 'unstorage'
import { withLeadingSlash } from 'ufo'
import { VirtualMediaCollectionName } from 'nuxt-studio/app/utils'

export async function getAssetsStorageDevTemplate() {
  return [
    'import { createStorage } from \'unstorage\'',
    'import httpDriver from \'unstorage/drivers/http\'',
    '',
    `export const publicAssetsStorage = createStorage({ driver: httpDriver({ base: '/__nuxt_studio/dev/public' }) })`,
    'export const externalAssetsStorage = null',
  ].join('\n')
}

export async function getAssetsStorageTemplate(assetsStorage: Storage) {
  const keys = await assetsStorage.getKeys()

  return [
    'import { createStorage } from \'unstorage\'',
    'const storage = createStorage({})',
    '',
    ...keys.map((key) => {
      const path = withLeadingSlash(key.replace(/:/g, '/'))
      const value = {
        id: `${VirtualMediaCollectionName}/${key.replace(/:/g, '/')}`,
        extension: key.split('.').pop(),
        stem: key.split('.').join('.'),
        path,
        fsPath: path,
      }
      return `storage.setItem('${value.id}', ${JSON.stringify(value)})`
    }),
    '',
    'export const publicAssetsStorage = storage',
    'export const externalAssetsStorage = null',
  ].join('\n')
}

export async function getExternalAssetsStorageTemplate() {
  return [
    'import { createStorage } from \'unstorage\'',
    'import httpDriver from \'unstorage/drivers/http\'',
    '',
    'export const externalAssetsStorage = createStorage({',
    '  driver: httpDriver({',
    '    base: \'/api/studio/medias\'',
    '  })',
    '})',
    'export const publicAssetsStorage = null',
  ].join('\n')
}
