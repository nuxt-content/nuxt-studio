import { createSingletonPromise } from '@vueuse/core'
import type { editor as Editor } from 'monaco-editor'
import { language as mdcLanguage } from '@nuxtlabs/monarch-mdc'

// export { setupSuggestion } from './mdc-completion'

export const setupMonaco = createSingletonPromise(async () => {
  const monaco = await import('monaco-editor')
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
    noUnusedLocals: false,
    noUnusedParameters: false,
    allowUnreachableCode: true,
    allowUnusedLabels: true,
    strict: true,
  })

  await Promise.all([
    // load workers
    (async () => {
      const [
        { default: EditorWorker },
        { default: JsonWorker },
        { default: CssWorker },
        { default: HtmlWorker },
        { default: TsWorker },
      ] = await Promise.all([
        import('monaco-editor/esm/vs/editor/editor.worker?worker'),
        import('monaco-editor/esm/vs/language/json/json.worker?worker'),
        import('monaco-editor/esm/vs/language/css/css.worker?worker'),
        import('monaco-editor/esm/vs/language/html/html.worker?worker'),
        import('monaco-editor/esm/vs/language/typescript/ts.worker?worker'),
      ])

      window.MonacoEnvironment = {
        getWorker(_: unknown, label: string) {
          if (label === 'json') return new JsonWorker()
          if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker()
          if (label === 'html' || label === 'handlebars' || label === 'razor' || label === 'vue3') return new HtmlWorker()
          if (label === 'typescript' || label === 'javascript') return new TsWorker()
          return new EditorWorker()
        },
      }

      monaco.languages.register({ id: 'mdc', aliases: ['mdc', 'md', 'markdown'] })
      // Register a tokens provider for the language
      monaco.languages.setMonarchTokensProvider('mdc', mdcLanguage)
      monaco.languages.setLanguageConfiguration('mdc', {
        comments: {
          blockComment: ['<!--', '-->'],
        },
      })
    })(),
  ])

  return monaco
})

export function setupTheme(monaco: typeof import('monaco-editor')) {
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

export const baseEditorOptions: Editor.IEditorOptions & { theme: { light: string, dark: string } } = {
  folding: false,
  glyphMargin: false,
  lineNumbersMinChars: 3,
  overviewRulerLanes: 0,
  automaticLayout: true,
  theme: { light: 'studio-light', dark: 'studio-dark' },
  minimap: {
    enabled: false,
  },
  padding: {
    top: 16,
  },
}
