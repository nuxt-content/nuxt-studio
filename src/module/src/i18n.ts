import { addPlugin, addTemplate, createResolver } from '@nuxt/kit'
import { resolve, basename, join } from 'node:path'
import { promises as fsp } from 'node:fs'
import { defu } from 'defu'
import type { Nuxt } from '@nuxt/schema'

const resolver = createResolver(import.meta.url)

interface I18nOptions {
  defaultLocale?: string
  translations?: Record<string, unknown>
}

async function loadLocaleFiles(localesPath: string): Promise<Record<string, unknown>> {
  const messages: Record<string, unknown> = {}

  try {
    const files = await fsp.readdir(localesPath)
    const jsonFiles = files.filter(file => file.endsWith('.json'))

    for (const file of jsonFiles) {
      const lang = basename(file, '.json')
      const filePath = join(localesPath, file)
      const content = await fsp.readFile(filePath, 'utf-8')
      messages[lang] = JSON.parse(content)
    }
  }
  catch {
    // Directory doesn't exist or can't be read
  }

  return messages
}

export async function setupI18n(
  nuxt: Nuxt,
  options: I18nOptions,
) {
  // Load default locale files from the module
  const defaultLocalesPath = resolver.resolve('./locales')
  const defaultMessages = await loadLocaleFiles(defaultLocalesPath)

  // Load user locale files from project
  const userLocalesPath = resolve(nuxt.options.srcDir, 'locales/studio')
  const userMessages = await loadLocaleFiles(userLocalesPath)

  const optionsMessages = options.translations || {}
  // @ts-expect-error - nuxt.options.appConfig.studio is not fully typed
  const appConfigMessages = nuxt.options.appConfig.studio?.i18n?.translations || {}

  const defaultLocale = options.defaultLocale || 'en'
  const finalMessages = defu(
    optionsMessages, // 1. Highest priority (nuxt.config options)
    appConfigMessages, // 2. Priority (app.config)
    userMessages, // 3. Priority (locales/studio user folder)
    defaultMessages, // 4. Default translations (module)
  )

  addTemplate({
    filename: 'studio-i18n-plugin.client.mjs',
    getContents: () => {
      return `
        export default defineNuxtPlugin(() => {
          window.__NUXT_STUDIO_I18N_MESSAGES__ = ${JSON.stringify(finalMessages)}
          window.__NUXT_STUDIO_DEFAULT_LOCALE__ = '${defaultLocale}'
        })
      `
    },
  })

  addPlugin(resolve(nuxt.options.buildDir, 'studio-i18n-plugin.client.mjs'))
}
