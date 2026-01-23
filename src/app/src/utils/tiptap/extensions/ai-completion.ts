import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface CompletionOptions {
  onRequest?: (prompt: string) => Promise<string>
}

export interface CompletionStorage {
  suggestion: string
  position: number | null
  isLoading: boolean
  visible: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    completion: {
      /**
       * Trigger AI completion manually
       */
      triggerCompletion: () => ReturnType
      /**
       * Accept the current completion
       */
      acceptCompletion: () => ReturnType
      /**
       * Dismiss the current completion
       */
      dismissCompletion: () => ReturnType
    }
  }
}

export const AICompletion = Extension.create<CompletionOptions, CompletionStorage>({
  name: 'aiCompletion',

  addOptions() {
    return {
      onRequest: undefined,
    }
  },

  addStorage() {
    return {
      suggestion: '',
      position: null,
      isLoading: false,
      visible: false,
    }
  },

  addCommands() {
    return {
      triggerCompletion:
        () =>
          ({ editor, state }) => {
            const { to } = state.selection
            const text = state.doc.textBetween(0, to, '\n')

            if (!this.options.onRequest || this.storage.isLoading) {
              return false
            }

            this.storage.isLoading = true
            this.storage.position = to

            this.options
              .onRequest(text)
              .then((suggestion) => {
                this.storage.suggestion = suggestion
                this.storage.isLoading = false
                this.storage.visible = true
                editor.view.dispatch(editor.state.tr)
              })
              .catch(() => {
                this.storage.isLoading = false
                this.storage.suggestion = ''
                this.storage.position = null
                this.storage.visible = false
              })

            return true
          },
      acceptCompletion:
        () =>
          ({ editor, state }) => {
            if (!this.storage.suggestion || this.storage.position === null) {
              return false
            }

            const tr = state.tr.insertText(this.storage.suggestion, this.storage.position)
            editor.view.dispatch(tr)

            this.storage.suggestion = ''
            this.storage.position = null
            this.storage.visible = false

            return true
          },
      dismissCompletion:
        () =>
          ({ editor }) => {
            if (!this.storage.suggestion) {
              return false
            }

            this.storage.suggestion = ''
            this.storage.position = null
            this.storage.visible = false
            editor.view.dispatch(editor.state.tr)

            return true
          },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Tab': () => {
        if (this.storage.suggestion) {
          return this.editor.commands.acceptCompletion()
        }
        return false
      },
      'Escape': () => {
        if (this.storage.suggestion) {
          return this.editor.commands.dismissCompletion()
        }
        return false
      },
      'Mod-j': () => {
        return this.editor.commands.triggerCompletion()
      },
    }
  },

  addProseMirrorPlugins() {
    const storage = this.storage

    return [
      new Plugin({
        key: new PluginKey('aiCompletion'),
        props: {
          decorations(state) {
            if (!storage.visible || !storage.suggestion || storage.position === null) {
              return DecorationSet.empty
            }

            const widget = Decoration.widget(storage.position, () => {
              const span = document.createElement('span')
              span.className = 'completion-suggestion'
              span.textContent = storage.suggestion
              span.style.cssText = 'color: var(--ui-text-muted); opacity: 0.6; pointer-events: none;'
              return span
            }, { side: 1 })

            return DecorationSet.create(state.doc, [widget])
          },
        },
      }),
    ]
  },
})
