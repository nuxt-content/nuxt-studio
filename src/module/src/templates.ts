import type { Storage } from 'unstorage'
import { mediaItemFieldsFromKey } from './runtime/utils/media'

export async function getAssetsDefaultStorageDevTemplate() {
  return [
    'import { createStorage } from \'unstorage\'',
    'import httpDriver from \'unstorage/drivers/http\'',
    '',
    `export const publicAssetsStorage = createStorage({ driver: httpDriver({ base: '/__nuxt_studio/dev/public' }) })`,
    'export const externalAssetsStorage = null',
  ].join('\n')
}

export async function getAssetsDefaultStorageTemplate(assetsStorage: Storage) {
  const keys = await assetsStorage.getKeys()

  return [
    'import { createStorage } from \'unstorage\'',
    'const storage = createStorage({})',
    '',
    ...keys.map((key) => {
      const value = mediaItemFieldsFromKey(key)
      return `storage.setItem('${value.id}', ${JSON.stringify(value)})`
    }),
    '',
    'export const publicAssetsStorage = storage',
    'export const externalAssetsStorage = null',
  ].join('\n')
}

export async function getAssetsExternalStorageTemplate() {
  return [
    'import { createStorage } from \'unstorage\'',
    'import httpDriver from \'unstorage/drivers/http\'',
    '',
    'export const externalAssetsStorage = createStorage({',
    '  driver: httpDriver({',
    '    base: \'/__nuxt_studio/medias\'',
    '  })',
    '})',
    'export const publicAssetsStorage = null',
  ].join('\n')
}
