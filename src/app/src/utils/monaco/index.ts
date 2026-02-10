import { createSingletonPromise } from '@vueuse/core'
import { consola } from 'consola'
import themeLight from './theme-light'
import themeDark from './theme-dark'

export { setupSuggestion } from './mdc-compilation'
export type { editor as Editor } from 'modern-monaco/editor-core'
export type Monaco = Awaited<ReturnType<typeof import('modern-monaco')['init']>>

const logger = consola.withTag('Nuxt Studio')

const localeImports: Record<string, () => Promise<unknown>> = {
  // @ts-expect-error -- CDN import
  'zh-tw': () => import('https://esm.sh/monaco-editor/esm/nls.messages.zh-tw.js'),
  // @ts-expect-error -- CDN import
  'zh-cn': () => import('https://esm.sh/monaco-editor/esm/nls.messages.zh-cn.js'),
  // @ts-expect-error -- CDN import
  'ja': () => import('https://esm.sh/monaco-editor/esm/nls.messages.ja.js'),
  // @ts-expect-error -- CDN import
  'ko': () => import('https://esm.sh/monaco-editor/esm/nls.messages.ko.js'),
  // @ts-expect-error -- CDN import
  'de': () => import('https://esm.sh/monaco-editor/esm/nls.messages.de.js'),
  // @ts-expect-error -- CDN import
  'fr': () => import('https://esm.sh/monaco-editor/esm/nls.messages.fr.js'),
  // @ts-expect-error -- CDN import
  'es': () => import('https://esm.sh/monaco-editor/esm/nls.messages.es.js'),
  // @ts-expect-error -- CDN import
  'ru': () => import('https://esm.sh/monaco-editor/esm/nls.messages.ru.js'),
  // @ts-expect-error -- CDN import
  'it': () => import('https://esm.sh/monaco-editor/esm/nls.messages.it.js'),
}

export const setupMonaco = createSingletonPromise(async () => {
  const validNlsLanguages = Object.keys(localeImports)

  const host = window.useStudioHost()
  const locale: string = host.meta.defaultLocale || 'en'

  let finalLocale: string
  if (locale === 'en') {
    finalLocale = 'en'
  }
  else if (validNlsLanguages.includes(locale)) {
    finalLocale = locale
  }
  else {
    logger.warn(`[Monaco] could not load locale '${locale}'. Valid locales: ${validNlsLanguages.join(', ')}`)
    finalLocale = 'en'
  }

  try {
    // Dynamically load the locale based on finalLocale variable
    if (finalLocale !== 'en' && localeImports[finalLocale]) {
      await localeImports[finalLocale]()
    }
  }
  catch (e) {
    logger.error(`[Monaco] error while loading locale: ${finalLocale}`, e)
  }

  // @ts-expect-error -- use dynamic import to reduce bundle size
  const init = await import('https://esm.sh/modern-monaco').then(m => m.init)
  // @ts-expect-error -- use dynamic import to reduce bundle size
  const cssBundle = await import('https://esm.sh/modern-monaco/editor-core').then(m => m.cssBundle)

  if (!window.document.getElementById('monaco-editor-core-css')) {
    const styleEl = window.document.createElement('style')
    styleEl.id = 'monaco-editor-core-css'
    styleEl.media = 'screen'
    styleEl.textContent = [
      '/* Only include font-face rules in head tag to load fonts and avoid conflicts with other styles */',
      cssBundle.match(/@font-face\{[^}]+\}/)?.[0] || '',
    ].join('\n')
    window.document.head.appendChild(styleEl)
  }

  const monaco: Monaco = await init()
  monaco.editor.defineTheme('vitesse-light', themeLight)
  monaco.editor.defineTheme('vitesse-dark', themeDark)

  return {
    monaco,
    editor: monaco.editor,
    createEditor: ((domElement, options, override) => {
      // Inject the CSS bundle into the DOM
      const styleEl = window.document.createElement('style')
      styleEl.id = 'monaco-editor-core-css'
      styleEl.media = 'screen'
      styleEl.textContent = cssBundle
      domElement.parentNode!.appendChild(styleEl)

      document.createElement('style')

      return monaco.editor.create(domElement, options, override)
    }) as Monaco['editor']['create'],
    createDiffEditor: ((domElement, options, override) => {
      // Inject the CSS bundle into the DOM
      const styleEl = window.document.createElement('style')
      styleEl.id = 'monaco-editor-core-css'
      styleEl.media = 'screen'
      styleEl.textContent = cssBundle
      domElement.parentNode!.appendChild(styleEl)

      return monaco.editor.createDiffEditor(domElement, options, override)
    }) as Monaco['editor']['createDiffEditor'],
  }
})

export function setupTheme(monaco: Monaco) {
  monaco.editor.defineTheme('studio-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0f172a', // slate-900
    },
  })

  monaco.editor.defineTheme('studio-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
    },
  })

  monaco.editor.defineTheme('tiptap-hover-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#334155', // slate-700
      'editor.lineHighlightBorder': '#475569', // slate-600
      'editor.lineHighlightBackground': '#334155', // slate-700
    },
  })

  monaco.editor.defineTheme('tiptap-hover-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#e2e8f0', // slate-200
      'editor.lineHighlightBorder': '#cbd5e1', // slate-300
      'editor.lineHighlightBackground': '#e2e8f0', // slate-200
    },
  })
}
