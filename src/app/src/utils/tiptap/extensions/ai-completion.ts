import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { AIHintOptions } from '../../../types/ai'
import { AI_LIMITS } from '../../../types/ai'
import { applyExtraSpace, detectExtraSpace, generateHintOptions, markdownSliceToTiptap, tiptapSliceToMarkdown } from '../../ai/completion'

export interface CompletionOptions {
  onRequest?: (previousContext: string, nextContext: string, hintOptions?: AIHintOptions) => Promise<string>
  enabled?: () => boolean
}

export interface CompletionStorage {
  suggestion: string
  position: number | null
  isLoading: boolean
  visible: boolean
  debounceTimer: number | null
  extraSpace: 'before' | 'after' | null
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
      extraSpace: null,
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
            this.storage.extraSpace = detectExtraSpace(state, to)

            // Context lengths optimized for AI completion
            const maxPreviousChars = AI_LIMITS.CONTINUE_PREVIOUS_CONTEXT
            const maxNextChars = AI_LIMITS.CONTINUE_NEXT_CONTEXT

            // Extract context before cursor
            const previousStart = Math.max(0, to - maxPreviousChars * 2)

            // Extract context after cursor
            const nextEnd = Math.min(state.doc.content.size, to + maxNextChars * 2)

            // Generate hint options based on cursor position
            const hintOptions = generateHintOptions(state, to)

            // Extract both previous and next context in parallel
            Promise.all([
              tiptapSliceToMarkdown(state, previousStart, to, maxPreviousChars, 'end'), // Take last N chars before cursor
              tiptapSliceToMarkdown(state, to, nextEnd, maxNextChars, 'start'), // Take first N chars after cursor
            ])
              .then(([previousMarkdown, nextMarkdown]) => {
                return this.options.onRequest!(previousMarkdown, nextMarkdown, hintOptions)
              })
              .then((suggestion) => {
                // Only show if suggestion is not empty and position hasn't changed
                if (suggestion && suggestion.trim().length > 0 && this.storage.position === to) {
                  this.storage.suggestion = applyExtraSpace(suggestion, this.storage.extraSpace)
                  this.storage.isLoading = false
                  this.storage.visible = true
                  editor.view.dispatch(editor.state.tr)
                }
                else {
                  this.storage.isLoading = false
                  this.storage.suggestion = ''
                  this.storage.position = null
                  this.storage.visible = false
                  this.storage.extraSpace = null
                }
              })
              .catch(() => {
                this.storage.isLoading = false
                this.storage.suggestion = ''
                this.storage.position = null
                this.storage.visible = false
                this.storage.extraSpace = null
              })

            return true
          },
      acceptCompletion:
        () =>
          ({ editor, state }) => {
            if (!this.storage.suggestion || this.storage.position === null) {
              return false
            }

            const position = this.storage.position
            const suggestion = this.storage.suggestion

            // Clear storage immediately
            this.storage.suggestion = ''
            this.storage.position = null
            this.storage.visible = false
            this.storage.extraSpace = null

            // Parse and insert markdown asynchronously
            markdownSliceToTiptap(suggestion)
              .then((nodes) => {
                // Insert the parsed content with marks (bold, italic, links, etc.)
                if (nodes.length > 0) {
                  editor.commands.focus()
                  editor.commands.setTextSelection(position)
                  editor.commands.insertContent(nodes)
                }
                else {
                  // Fallback to plain text if no nodes were generated
                  const tr = state.tr.insertText(suggestion, position)
                  editor.view.dispatch(tr)
                }
              })
              .catch(() => {
                const tr = state.tr.insertText(suggestion, position)
                editor.view.dispatch(tr)
              })

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
            this.storage.extraSpace = null
            editor.view.dispatch(editor.state.tr)

            return true
          },
    }
  },

  addKeyboardShortcuts() {
    return {
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
    // Use explicit variable names to avoid minification hoisting issues
    const extensionStorage = this.storage
    const extensionEditor = this.editor

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
          if (extensionStorage.debounceTimer) {
            clearTimeout(extensionStorage.debounceTimer)
            extensionStorage.debounceTimer = null
          }

          const { from, to } = newState.selection

          // If suggestion is visible and cursor moved away from the suggestion position, dismiss it
          if (extensionStorage.visible && extensionStorage.position !== null && to !== extensionStorage.position) {
            extensionStorage.suggestion = ''
            extensionStorage.position = null
            extensionStorage.visible = false
            extensionStorage.extraSpace = null
            return newState.tr
          }

          // Don't auto-trigger if:
          // - Already loading
          // - A suggestion is already visible
          // - Selection is not at the end (user is editing in the middle)
          if (extensionStorage.isLoading || extensionStorage.visible || from !== to) {
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
          extensionStorage.debounceTimer = setTimeout(() => {
            if (!extensionStorage.isLoading && !extensionStorage.visible) {
              extensionEditor.commands.triggerCompletion()
            }
          }, 500) as unknown as number

          return null
        },
      }),
      // Decoration plugin
      new Plugin({
        key: new PluginKey('aiCompletion'),
        props: {
          decorations(state) {
            if (!extensionStorage.visible || !extensionStorage.suggestion || extensionStorage.position === null) {
              return DecorationSet.empty
            }

            const decoration = Decoration.widget(extensionStorage.position, () => {
              const span = document.createElement('span')
              span.className = 'completion-suggestion'
              span.textContent = extensionStorage.suggestion
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
      // Handle Tab key at DOM level to prevent focus navigation
      new Plugin({
        key: new PluginKey('aiCompletionTab'),
        props: {
          handleKeyDown: (_view, event) => {
            // Only handle Tab key when suggestion is visible
            if (event.key === 'Tab' && extensionStorage.visible && extensionStorage.suggestion) {
              event.preventDefault()
              event.stopPropagation()
              extensionEditor.commands.acceptCompletion()
              return true
            }
            return false
          },
        },
      }),
    ]
  },
})
