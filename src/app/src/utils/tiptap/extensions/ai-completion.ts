import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { AIHintOptions } from '../../../types/ai'
import { generateHintOptions, tiptapSliceToMarkdown } from '../completion'

export interface CompletionOptions {
  onRequest?: (prompt: string, hintOptions?: AIHintOptions) => Promise<string>
  enabled?: () => boolean
}

export interface CompletionStorage {
  suggestion: string
  position: number | null
  isLoading: boolean
  visible: boolean
  debounceTimer: number | null
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

  interface Storage {
    aiCompletion: CompletionStorage
  }
}

export const AICompletion = Extension.create<CompletionOptions, CompletionStorage>({
  name: 'aiCompletion',

  addOptions() {
    return {
      onRequest: undefined,
      enabled: () => true,
    }
  },

  addStorage() {
    return {
      suggestion: '',
      position: null,
      isLoading: false,
      visible: false,
      debounceTimer: null,
    }
  },

  addCommands() {
    return {
      triggerCompletion:
        () =>
          ({ editor, state }) => {
            const { to } = state.selection

            if (!this.options.enabled?.() || !this.options.onRequest || this.storage.isLoading) {
              return false
            }

            this.storage.isLoading = true
            this.storage.position = to

            const maxChars = 500
            const contextStart = Math.max(0, to - maxChars * 2)

            // Generate hint options based on cursor position
            const hintOptions = generateHintOptions(state, to)

            tiptapSliceToMarkdown(state, contextStart, to, maxChars)
              .then((markdown) => {
                if (!markdown) {
                  this.storage.isLoading = false
                  return
                }

                return this.options.onRequest!(markdown, hintOptions)
              })
              .then((suggestion) => {
                // Only show if suggestion is not empty and position hasn't changed
                if (suggestion && suggestion.trim().length > 0 && this.storage.position === to) {
                  this.storage.suggestion = suggestion
                  this.storage.isLoading = false
                  this.storage.visible = true
                  editor.view.dispatch(editor.state.tr)
                }
                else {
                  this.storage.isLoading = false
                  this.storage.suggestion = ''
                  this.storage.position = null
                  this.storage.visible = false
                }
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
            if (!this.storage.suggestion && !this.storage.debounceTimer) {
              return false
            }

            // Clear debounce timer if exists
            if (this.storage.debounceTimer) {
              clearTimeout(this.storage.debounceTimer)
              this.storage.debounceTimer = null
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
      // Dismiss suggestion when typing
      'Space': () => {
        if (this.storage.visible) {
          this.editor.commands.dismissCompletion()
        }
        return false // Let the space be inserted normally
      },
      'Enter': () => {
        if (this.storage.visible) {
          this.editor.commands.dismissCompletion()
        }
        return false // Let enter work normally
      },
      // Dismiss on arrow keys
      'ArrowLeft': () => {
        if (this.storage.visible) {
          this.editor.commands.dismissCompletion()
        }
        return false
      },
      'ArrowRight': () => {
        if (this.storage.visible) {
          this.editor.commands.dismissCompletion()
        }
        return false
      },
      'ArrowUp': () => {
        if (this.storage.visible) {
          this.editor.commands.dismissCompletion()
        }
        return false
      },
      'ArrowDown': () => {
        if (this.storage.visible) {
          this.editor.commands.dismissCompletion()
        }
        return false
      },
    }
  },

  addProseMirrorPlugins() {
    const storage = this.storage
    const editor = this.editor

    return [
      // Auto-trigger plugin
      new Plugin({
        key: new PluginKey('aiCompletionAutoTrigger'),
        appendTransaction: (_transactions, _oldState, newState) => {
          // Don't auto-trigger if disabled
          const enabled = this.options.enabled?.()

          if (!enabled) {
            return null
          }

          // Clear any existing timer
          if (storage.debounceTimer) {
            clearTimeout(storage.debounceTimer)
            storage.debounceTimer = null
          }

          const { from, to } = newState.selection

          // If suggestion is visible and cursor moved away from the suggestion position, dismiss it
          if (storage.visible && storage.position !== null && to !== storage.position) {
            storage.suggestion = ''
            storage.position = null
            storage.visible = false
            return newState.tr
          }

          // Don't auto-trigger if:
          // - Already loading
          // - A suggestion is already visible
          // - Selection is not at the end (user is editing in the middle)
          if (storage.isLoading || storage.visible || from !== to) {
            return null
          }

          // Get text before cursor
          const textBeforeCursor = newState.doc.textBetween(Math.max(0, to - 100), to, '\n')

          // Only trigger if the user typed actual content (not just spaces/newlines)
          // and the text ends with a word character or punctuation
          if (textBeforeCursor.trim().length === 0) {
            return null
          }

          // Debounce: wait 500ms after user stops typing
          storage.debounceTimer = window.setTimeout(() => {
            if (!storage.isLoading && !storage.visible) {
              editor.commands.triggerCompletion()
            }
          }, 500)

          return null
        },
      }),
      // Decoration plugin
      new Plugin({
        key: new PluginKey('aiCompletion'),
        props: {
          decorations(state) {
            if (!storage.visible || !storage.suggestion || storage.position === null) {
              return DecorationSet.empty
            }

            const decoration = Decoration.widget(storage.position, () => {
              const span = document.createElement('span')
              span.className = 'completion-suggestion'
              span.textContent = storage.suggestion
              span.style.cssText = 'color: rgb(156, 163, 175); opacity: 0.7; pointer-events: none; font-style: italic; display: inline;'
              return span
            }, {
              side: 0, // Place at exact position, not before or after
              key: 'ai-completion',
            })

            return DecorationSet.create(state.doc, [decoration])
          },
        },
      }),
    ]
  },
})
