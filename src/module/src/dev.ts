import { addServerHandler, addVitePlugin } from '@nuxt/kit'
import { resolve } from 'node:path'
import type { Nuxt } from '@nuxt/schema'
import type { ViteDevServer } from 'vite'
import type { Storage } from 'unstorage'

import { VIRTUAL_MEDIA_COLLECTION_NAME } from './utils/constants'

export function setupDevMode(
  nuxt: Nuxt,
  runtime: (...args: string[]) => string,
  publicAssetsStorage?: Storage,
) {
  // Setup Nitro storage for content and public assets
  nuxt.options.nitro.storage = {
    ...nuxt.options.nitro.storage,
    nuxt_studio_content: {
      driver: 'fs',
      base: resolve(nuxt.options.rootDir, 'content'),
    },
  }

  // Add dev server handlers for content
  addServerHandler({
    route: '/__nuxt_studio/dev/content/**',
    handler: runtime('./server/routes/dev/content/[...path]'),
  })

  // Setup Nitro storage and hmr for public assets in local
  if (publicAssetsStorage) {
    nuxt.options.nitro.storage.nuxt_studio_public_assets = {
      driver: 'fs',
      base: resolve(nuxt.options.rootDir, 'public'),
    }

    // Add dev server handlers for public assets
    addServerHandler({
      route: '/__nuxt_studio/dev/public/**',
      handler: runtime('./server/routes/dev/public/[...path]'),
    })

    // Handle HMR for public assets
    addVitePlugin({
      name: 'nuxt-studio',
      configureServer: (server: ViteDevServer) => {
        publicAssetsStorage.watch((type, file) => {
          server.ws.send({
            type: 'custom',
            event: 'nuxt-studio:media:update',
            data: { type, id: `${VIRTUAL_MEDIA_COLLECTION_NAME}/${file}` },
          })
        })
      },
      closeWatcher: () => {
        publicAssetsStorage.unwatch()
      },
    })
  }
}
