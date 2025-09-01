import { defineNuxtModule, createResolver, addPlugin, extendViteConfig, installModule, extendPages, addServerHandler } from '@nuxt/kit'

import { defu } from 'defu'

export default defineNuxtModule({
  meta: {
    name: 'nuxt-studio',
    configKey: 'studio',
  },
  async setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const runtime = (...args: string[]) => resolver.resolve('./runtime', ...args)

    if (process.env.STUDIO_DEV_SERVER) {
      nuxt.options.runtimeConfig.public.studioDevServer = process.env.STUDIO_DEV_SERVER
      addPlugin(runtime('./plugins/studio.client.dev'))
    }
    else {
      addPlugin(runtime('./plugins/studio.client'))
    }

    nuxt.options.vite = defu(nuxt.options.vite, {
      vue: {
        template: {
          compilerOptions: {
            isCustomElement: (tag: string) => {
              return tag === 'nuxt-studio'
            },
          },
        },
      },
    })
    extendViteConfig((config) => {
      config.optimizeDeps ||= {}
      config.optimizeDeps.include = [
        ...(config.optimizeDeps.include || []),
        'debug',
        'extend',
      ]
    })

    await installModule('nuxt-auth-utils')
    addServerHandler({
      route: '/_admin/auth/github',
      handler: runtime('./server/routes/auth/github.get.ts'),
    })
    addServerHandler({
      route: '/_admin/auth/google',
      handler: runtime('./server/routes/auth/google.get.ts'),
    })
    extendPages((pages) => {
      pages.push({
        path: '/_admin',
        file: runtime('./pages/admin.vue'),
      })
    })
  },
})
