import { addServerHandler, addTemplate } from '@nuxt/kit'
import { resolve } from 'node:path'
import fsDriver from 'unstorage/drivers/fs'
import { createStorage } from 'unstorage'
import type { Storage } from 'unstorage'
import type { Nuxt } from '@nuxt/schema'
import type { ModuleOptions } from './module'
import { getAssetsDefaultStorageDevTemplate, getAssetsDefaultStorageTemplate, getAssetsExternalStorageTemplate } from './templates'

const ASSETS_TEMPLATE = 'studio-assets.mjs'
export async function setExternalMediaStorage(nuxt: Nuxt, runtime: (...args: string[]) => string): Promise<void> {
  addTemplate({
    filename: ASSETS_TEMPLATE,
    getContents: () => getAssetsExternalStorageTemplate(),
  })

  addServerHandler({
    route: '/__nuxt_studio/medias/**',
    handler: runtime('./server/routes/medias/[...path]'),
  })
}

export function setDefaultMediaStorage(nuxt: Nuxt, options: ModuleOptions): Storage {
  const publicAssetsStorage = createStorage({
    driver: fsDriver({
      base: resolve(nuxt.options.rootDir, 'public'),
    }),
  })

  addTemplate({
    filename: ASSETS_TEMPLATE,
    getContents: () => options.dev
      ? getAssetsDefaultStorageDevTemplate()
      : getAssetsDefaultStorageTemplate(publicAssetsStorage),
  })

  return publicAssetsStorage
}
