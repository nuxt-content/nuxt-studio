import { addServerHandler, addTemplate, useLogger } from '@nuxt/kit'
import { resolve } from 'node:path'
import fsDriver from 'unstorage/drivers/fs'
import { createStorage } from 'unstorage'
import type { Storage } from 'unstorage'
import type { Nuxt } from '@nuxt/schema'
import type { ModuleOptions } from './module'
import { getAssetsDefaultStorageDevTemplate, getAssetsDefaultStorageTemplate, getAssetsExternalStorageTemplate } from './templates'

const ASSETS_TEMPLATE = 'studio-assets.mjs'
const logger = useLogger('nuxt-studio')

export function setExternalMediaStorage(nuxt: Nuxt, runtime: (...args: string[]) => string): void {
  nuxt.options.nitro.storage = {
    ...nuxt.options.nitro.storage,
    s3: {
      driver: 's3',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      endpoint: process.env.S3_ENDPOINT,
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION || 'auto',
    },
  }

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
  if (options.media?.external) {
    logger.warn('External media storage is enabled but required S3 environment variables (S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT, S3_BUCKET, S3_PUBLIC_URL) are not set. Falling back to default assets storage.')
  }

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
