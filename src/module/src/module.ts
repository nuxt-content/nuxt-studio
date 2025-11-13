import { defineNuxtModule, createResolver, addPlugin, extendViteConfig, useLogger, addServerHandler, addTemplate, addVitePlugin } from '@nuxt/kit'
import { createHash } from 'node:crypto'
import { defu } from 'defu'
import { resolve, basename } from 'node:path'
import { promises as fsp } from 'node:fs'
import { globby } from 'globby'
import fsDriver from 'unstorage/drivers/fs'
import { createStorage } from 'unstorage'
import type { Plugin } from 'vite'
import { getAssetsStorageDevTemplate, getAssetsStorageTemplate } from './templates'
import { version } from '../../../package.json'
import { setupDevMode } from './dev'

interface ModuleOptions {
  /**
   * The route to access the studio login page.
   * @default '/_studio'
   */
  route?: string

  /**
   * The authentication settings for studio.
   */
  auth?: {
    /**
     * The GitHub OAuth credentials.
     */
    github?: {
      /**
       * The GitHub OAuth client ID.
       * @default process.env.STUDIO_GITHUB_CLIENT_ID
       */
      clientId?: string
      /**
       * The GitHub OAuth client secret.
       * @default process.env.STUDIO_GITHUB_CLIENT_SECRET
       */
      clientSecret?: string
    }
  }
  /**
   * The git repository information to connect to.
   */
  repository?: {
    /**
     * The provider to use for the git repository.
     * @default 'github'
     */
    provider?: 'github'
    /**
     * The owner of the git repository.
     */
    owner: string
    /**
     * The repository name.
     */
    repo: string
    /**
     * The branch to use for the git repository.
     * @default 'main'
     */
    branch?: string
    /**
     * The root directory to use for the git repository.
     * @default ''
     */
    rootDir?: string
    /**
     * Whether the repository is private or public.
     * If set to false, the 'public_repo' scope will be used instead of the 'repo' scope.
     * @default true
     */
    private?: boolean
  }
  /**
   * Enable Nuxt Studio to edit content and media files on your filesystem.
   */
  dev: boolean
  /**
   * Enable Nuxt Studio to edit content and media files on your filesystem.
   *
   * @deprecated Use the 'dev' option instead.
   */
  development?: {
    sync?: boolean
  }
  /**
   * i18n settings for the Studio.
   */
  i18n?: {
    /**
     * The default locale to use.
     * @default 'en'
     */
    defaultLocale?: string
    /**
     * Directly override or add translations.
     * @default {}
     */
    translations?: Record<string, unknown>
  }
}

const logger = useLogger('nuxt-studio')
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-studio',
    configKey: 'studio',
    version,
    docs: 'https://content.nuxt.com/studio',
  },
  defaults: {
    dev: true,
    route: '/_studio',
    repository: {
      provider: 'github',
      owner: '',
      repo: '',
      branch: 'main',
      rootDir: '',
      private: true,
    },
    auth: {
      github: {
        clientId: process.env.STUDIO_GITHUB_CLIENT_ID,
        clientSecret: process.env.STUDIO_GITHUB_CLIENT_SECRET,
      },
    },
    i18n: {
      defaultLocale: 'en',
      translations: {},
    },
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const runtime = (...args: string[]) => resolver.resolve('./runtime', ...args)

    const defaultLocalesPath = resolver.resolve('../../app/src/locales')
    const defaultLocaleFiles = await globby(`${defaultLocalesPath}/*.json`)
    const defaultMessages: Record<string, unknown> = {}
    for (const file of defaultLocaleFiles) {
      const lang = basename(file, '.json')
      defaultMessages[lang] = JSON.parse(await fsp.readFile(file, 'utf-8'))
    }

    const userLocalesPath = resolve(nuxt.options.srcDir, 'locales/studio')
    const userLocaleFiles = await globby(`${userLocalesPath}/*.json`)
    const userMessages: Record<string, unknown> = {}
    for (const file of userLocaleFiles) {
      const lang = basename(file, '.json')
      userMessages[lang] = JSON.parse(await fsp.readFile(file, 'utf-8'))
    }

    const optionsMessages = options.i18n?.translations || {}
    // @ts-expect-error - nuxt.options.appConfig.studio is not fully typed
    const appConfigMessages = nuxt.options.appConfig.studio?.i18n?.translations || {}

    const finalMessages = defu(
      optionsMessages, // 1. Highest priority (nuxt.config options)
      appConfigMessages, // 2. Priority (app.config)
      userMessages, // 3. Priority (locales/studio folder)
      defaultMessages, // 4. Default translations (module)
    )

    // --- VITE PLUGIN ---
    const virtualModuleName = 'virtual:studio-i18n-messages'
    const resolvedVirtualModuleId = '\0' + virtualModuleName

    addVitePlugin({
      name: 'nuxt-studio-i18n-virtual-module',
      resolveId(id) {
        if (id === virtualModuleName) {
          return resolvedVirtualModuleId
        }
      },
      load(id) {
        if (id === resolvedVirtualModuleId) {
          return `export default ${JSON.stringify(finalMessages)}`
        }
      },
    } as Plugin)

    addTemplate({
      filename: 'studio-i18n-plugin.client.mjs',
      getContents: () => {
        const defaultLocale = options.i18n?.defaultLocale || 'en'

        return `
        import messages from 'virtual:studio-i18n-messages'

        export default defineNuxtPlugin(() => {
          // @ts-ignore
          window.__NUXT_STUDIO_I18N_MESSAGES__ = messages
          // @ts-ignore
          window.__NUXT_STUDIO_DEFAULT_LOCALE__ = '${defaultLocale}'
        })
      `
      },
    })

    addPlugin(resolve(nuxt.options.buildDir, 'studio-i18n-plugin.client.mjs'))

    if (nuxt.options.dev === false || options.development?.sync === false) {
      options.dev = false
    }

    if (!nuxt.options.dev && !nuxt.options._prepare) {
      if (!options.auth?.github?.clientId && !options.auth?.github?.clientSecret) {
        logger.warn([
          'Nuxt Content Studio relies on GitHub OAuth to authenticate users.',
          'Please set the `STUDIO_GITHUB_CLIENT_ID` and `STUDIO_GITHUB_CLIENT_SECRET` environment variables.',
        ].join(' '))
      }
    }

    // Enable checkoutOutdatedBuildInterval to detect new deployments
    nuxt.options.experimental = nuxt.options.experimental || {}
    nuxt.options.experimental.checkOutdatedBuildInterval = 1000 * 30

    nuxt.options.runtimeConfig.public.studio = {
      route: options.route!,
      dev: Boolean(options.dev),
      development: {
        server: process.env.STUDIO_DEV_SERVER,
      },
      // @ts-expect-error Autogenerated type does not match with options
      repository: options.repository,
    }

    nuxt.options.runtimeConfig.studio = {
      auth: {
        sessionSecret: createHash('md5').update([
          options.auth?.github?.clientId,
          options.auth?.github?.clientSecret,
        ].join('')).digest('hex'),
        // @ts-expect-error todo fix github type issue
        github: options.auth?.github,
      },
      // @ts-expect-error Autogenerated type does not match with options
      repository: options.repository,
    }

    nuxt.options.vite = defu(nuxt.options.vite, {
      vue: {
        template: {
          compilerOptions: {
            isCustomElement: (tag: string) => tag === 'nuxt-studio',
          },
        },
      },
    })

    extendViteConfig((config) => {
      config.define ||= {}
      config.define['import.meta.preview'] = true

      config.optimizeDeps ||= {}
      config.optimizeDeps.include = [
        ...(config.optimizeDeps.include || []),
        'debug',
        'extend',
      ]
    })

    addPlugin(process.env.STUDIO_DEV_SERVER
      ? runtime('./plugins/studio.client.dev')
      : runtime('./plugins/studio.client'))

    const assetsStorage = createStorage({
      driver: fsDriver({
        base: resolve(nuxt.options.rootDir, 'public'),
      }),
    })

    addTemplate({
      filename: 'studio-public-assets.mjs',
      getContents: () => options.dev
        ? getAssetsStorageDevTemplate(assetsStorage, nuxt)
        : getAssetsStorageTemplate(assetsStorage, nuxt),
    })

    if (options.dev) {
      setupDevMode(nuxt, runtime, assetsStorage)
    }

    /* Server routes */
    addServerHandler({
      route: '/__nuxt_studio/auth/github',
      handler: runtime('./server/routes/auth/github.get'),
    })

    addServerHandler({
      route: '/__nuxt_studio/auth/session',
      handler: runtime('./server/routes/auth/session.get'),
    })

    addServerHandler({
      method: 'delete',
      route: '/__nuxt_studio/auth/session',
      handler: runtime('./server/routes/auth/session.delete'),
    })

    addServerHandler({
      route: options.route as string,
      handler: runtime('./server/routes/admin'),
    })

    addServerHandler({
      route: '/__nuxt_studio/meta',
      handler: runtime('./server/routes/meta'),
    })

    addServerHandler({
      route: '/sw.js',
      handler: runtime('./server/routes/sw'),
    })

    // addServerHandler({
    //   route: '/__nuxt_studio/auth/google',
    //   handler: runtime('./server/routes/auth/google.get'),
    // })
  },
})
