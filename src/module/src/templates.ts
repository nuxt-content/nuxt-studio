import type { Storage } from 'unstorage'

export async function getAssetsDefaultStorageDevTemplate() {
  return [
    'import { createStorage } from \'unstorage\'',
    'import httpDriver from \'unstorage/drivers/http\'',
    '',
    `export const publicAssetsStorage = createStorage({ driver: httpDriver({ base: '/__nuxt_studio/dev/public' }) })`,
    'export const externalAssetsStorage = null',
  ].join('\n')
}

export async function getAssetsDefaultStorageTemplate(assetsStorage: Storage, mediaUtilsPath: string) {
  const keys = await assetsStorage.getKeys()

  return [
    'import { createStorage } from \'unstorage\'',
    `import { mediaItemFieldsFromKey } from ${JSON.stringify(mediaUtilsPath)}`,
    'const storage = createStorage({})',
    '',
    `for (const key of ${JSON.stringify(keys)}) {`,
    '  const value = mediaItemFieldsFromKey(key)',
    '  storage.setItem(value.id, value)',
    '}',
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
