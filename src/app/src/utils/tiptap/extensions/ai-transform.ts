import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { consola } from 'consola'
import type { DiffPart } from '../../../types/ai'
import { computeWordDiff, createAddedDiff, DIFF_STYLES } from '../../ai/transform'

export interface AITransformOptions {
  onShowButtons?: (data: {
    rect: DOMRect
    onAccept: () => void
    onDecline: () => void
  }) => void
  onHideButtons?: () => void
}

export interface AITransformState {
  isTransforming: boolean
  showingDiff: boolean
  selectionRange: { from: number, to: number } | null
  diffData: {
    originalText: string
    newText: string
    from: number
    to: number
    diff: DiffPart[]
  } | null
}

const logger = consola.withTag('Nuxt Studio')

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiTransform: {
      transformSelection: (mode: string, transformFn: () => Promise<string>) => ReturnType
      acceptTransform: () => ReturnType
      declineTransform: () => ReturnType
    }
  }
}

// Plugin key for accessing plugin state
const aiTransformPluginKey = new PluginKey('aiTransform')

export const AITransform = Extension.create<AITransformOptions>({
  name: 'aiTransform',

  addOptions() {
    return {
      onShowButtons: undefined,
      onHideButtons: undefined,
    }
  },

  addCommands() {
    return {
      transformSelection:
        (mode: string, transformFn: () => Promise<string>) =>
          ({ editor, state, dispatch }) => {
            const { from, to, empty } = state.selection

            // Check if already transforming
            const pluginState = aiTransformPluginKey.getState(state)
            if (empty || pluginState?.isTransforming) {
              return false
            }

            const originalText = state.doc.textBetween(from, to, '\n')

            // Start loading animation via plugin state
            if (dispatch) {
              const tr = state.tr.setMeta(aiTransformPluginKey, {
                isTransforming: true,
                showingDiff: false,
                selectionRange: { from, to },
                diffData: null,
              })
              dispatch(tr)
            }

            // Execute async transformation
            transformFn()
              .then((result) => {
                if (!result) {
                  const tr = editor.state.tr.setMeta(aiTransformPluginKey, {
                    isTransforming: false,
                    showingDiff: false,
                    selectionRange: null,
                    diffData: null,
                  })
                  editor.view.dispatch(tr)
                  return
                }

                // Get current state and verify the selection range is still valid
                const currentState = editor.state
                const pluginState = aiTransformPluginKey.getState(currentState)

                // Use the stored selection range from plugin state (unchanged during transformation)
                if (!pluginState?.selectionRange) {
                  return
                }

                const { from: storedFrom, to: storedTo } = pluginState.selectionRange

                // Replace text with new version FIRST
                let tr = currentState.tr.replaceWith(
                  storedFrom,
                  storedTo,
                  currentState.schema.text(result),
                )

                // Calculate new end position after replacement
                const newTo = storedFrom + result.length

                // For translation, mark entire text as added (no diff)
                // For other modes, compute word-by-word diff
                const diff = mode === 'translate'
                  ? createAddedDiff(result)
                  : computeWordDiff(originalText, result)

                // Then set diff state with decorations
                tr = tr.setMeta(aiTransformPluginKey, {
                  isTransforming: false,
                  showingDiff: true,
                  selectionRange: { from: storedFrom, to: newTo },
                  diffData: {
                    originalText,
                    newText: result,
                    from: storedFrom,
                    to: newTo,
                    diff,
                  },
                })
                editor.view.dispatch(tr)

                // Show floating buttons
                if (this.options.onShowButtons) {
                  const startCoords = editor.view.coordsAtPos(storedFrom)
                  const endCoords = editor.view.coordsAtPos(storedFrom + result.length)

                  // Calculate selection bounds for bottom center positioning
                  const left = Math.min(startCoords.left, endCoords.left)
                  const right = Math.max(startCoords.right, endCoords.right)
                  const top = Math.min(startCoords.top, endCoords.top)
                  const bottom = Math.max(startCoords.bottom, endCoords.bottom)

                  this.options.onShowButtons({
                    rect: new DOMRect(
                      left,
                      top,
                      right - left,
                      bottom - top,
                    ),
                    onAccept: () => editor.commands.acceptTransform(),
                    onDecline: () => editor.commands.declineTransform(),
                  })
                }
              })
              .catch((error) => {
                logger.error('AI transform error:', error)
                const tr = editor.state.tr.setMeta(aiTransformPluginKey, {
                  isTransforming: false,
                  showingDiff: false,
                  selectionRange: null,
                  diffData: null,
                })
                editor.view.dispatch(tr)
              })

            return true
          },

      acceptTransform:
        () =>
          ({ editor, state }) => {
            const pluginState = aiTransformPluginKey.getState(state)
            if (!pluginState?.diffData) {
              return false
            }

            // Text is already replaced, just clear decorations
            const tr = state.tr.setMeta(aiTransformPluginKey, {
              isTransforming: false,
              showingDiff: false,
              selectionRange: null,
              diffData: null,
            })

            editor.view.dispatch(tr)

            // Hide buttons
            if (this.options.onHideButtons) {
              this.options.onHideButtons()
            }

            return true
          },

      declineTransform:
        () =>
          ({ state, dispatch }) => {
            const pluginState = aiTransformPluginKey.getState(state)
            if (!pluginState?.diffData) {
              return false
            }

            const { from, newText, originalText } = pluginState.diffData

            if (!dispatch) {
              return true
            }

            const to = from + newText.length
            let tr = state.tr.replaceRangeWith(
              from,
              to,
              state.schema.text(originalText),
            )

            // Reset state
            tr = tr.setMeta(aiTransformPluginKey, {
              isTransforming: false,
              showingDiff: false,
              selectionRange: null,
              diffData: null,
            })

            dispatch(tr)

            // Hide buttons
            if (this.options.onHideButtons) {
              this.options.onHideButtons()
            }

            return true
          },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: aiTransformPluginKey,

        state: {
          init(): AITransformState {
            return {
              isTransforming: false,
              showingDiff: false,
              selectionRange: null,
              diffData: null,
            }
          },

          apply(tr, value): AITransformState {
            const meta = tr.getMeta(aiTransformPluginKey)

            if (meta) {
              return { ...value, ...meta }
            }

            return value
          },
        },

        props: {
          decorations(state) {
            const pluginState = aiTransformPluginKey.getState(state)

            // Loading state
            if (pluginState?.isTransforming && pluginState.selectionRange) {
              const { from, to } = pluginState.selectionRange
              const decoration = Decoration.inline(from, to, {
                style: DIFF_STYLES.loading,
                class: 'ai-transform-loading',
              })
              return DecorationSet.create(state.doc, [decoration])
            }

            // Diff state
            if (pluginState?.showingDiff && pluginState.diffData) {
              const { from, diff } = pluginState.diffData

              const decorations: Decoration[] = []
              let currentPos = from

              diff.forEach((part: DiffPart) => {
                const partLength = part.text.length

                if (part.type === 'unchanged') {
                  // No decoration for unchanged text
                  currentPos += partLength
                }
                else if (part.type === 'added') {
                  decorations.push(
                    Decoration.inline(currentPos, currentPos + partLength, {
                      style: DIFF_STYLES.added,
                      class: 'ai-diff-added',
                    }),
                  )
                  currentPos += partLength
                }
              })

              return DecorationSet.create(state.doc, decorations)
            }

            return DecorationSet.empty
          },
        },
      }),
    ]
  },
})
