import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { consola } from 'consola'

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
    diff: Array<{ type: 'added' | 'removed' | 'unchanged', text: string }>
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

// Improved word-based diff using longest common subsequence
function computeWordDiff(original: string, updated: string) {
  // Split into words, preserving whitespace as separate tokens
  const originalTokens = original.split(/(\s+)/).filter(t => t.length > 0)
  const updatedTokens = updated.split(/(\s+)/).filter(t => t.length > 0)

  // For large selections, skip diff highlighting to avoid UI blocking
  // LCS is O(n*m) which can be expensive for large texts
  const MAX_TOKENS = 500
  if (originalTokens.length > MAX_TOKENS || updatedTokens.length > MAX_TOKENS) {
    // Simple fallback: no highlighting for large texts
    return []
  }

  // Find LCS (Longest Common Subsequence) to identify matching words
  const lcsIndices = findLCS(originalTokens, updatedTokens)

  // Build diff based on LCS
  const parts: Array<{ type: 'added' | 'removed' | 'unchanged', text: string, inNew: boolean }> = []
  let origIdx = 0
  let updatedIdx = 0
  let lcsIdx = 0

  while (origIdx < originalTokens.length || updatedIdx < updatedTokens.length) {
    const nextLCS = lcsIndices[lcsIdx]

    // Process removed tokens (in original but not in updated)
    while (nextLCS && origIdx < nextLCS.origIdx) {
      parts.push({ type: 'removed', text: originalTokens[origIdx], inNew: false })
      origIdx++
    }

    // Process added tokens (in updated but not in original)
    while (nextLCS && updatedIdx < nextLCS.updatedIdx) {
      parts.push({ type: 'added', text: updatedTokens[updatedIdx], inNew: true })
      updatedIdx++
    }

    // Process unchanged token
    if (nextLCS) {
      parts.push({ type: 'unchanged', text: updatedTokens[updatedIdx], inNew: true })
      origIdx++
      updatedIdx++
      lcsIdx++
    }
    else {
      // No more LCS matches, everything remaining is added or removed
      if (origIdx < originalTokens.length) {
        parts.push({ type: 'removed', text: originalTokens[origIdx], inNew: false })
        origIdx++
      }
      if (updatedIdx < updatedTokens.length) {
        parts.push({ type: 'added', text: updatedTokens[updatedIdx], inNew: true })
        updatedIdx++
      }
    }
  }

  // Group consecutive parts with same type that are in the new text
  const grouped: Array<{ type: 'added' | 'removed' | 'unchanged', text: string }> = []

  for (const part of parts) {
    if (!part.inNew) continue // Skip removed tokens as they're not in the new document

    const lastGroup = grouped[grouped.length - 1]

    if (lastGroup && lastGroup.type === part.type) {
      lastGroup.text += part.text
    }
    else {
      grouped.push({ type: part.type, text: part.text })
    }
  }

  return grouped
}

// Find Longest Common Subsequence indices
function findLCS(arr1: string[], arr2: string[]): Array<{ origIdx: number, updatedIdx: number }> {
  const m = arr1.length
  const n = arr2.length

  // Build LCS length matrix
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      }
      else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find LCS indices
  const lcs: Array<{ origIdx: number, updatedIdx: number }> = []
  let i = m
  let j = n

  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift({ origIdx: i - 1, updatedIdx: j - 1 })
      i--
      j--
    }
    else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    }
    else {
      j--
    }
  }

  return lcs
}

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
                  ? [{ type: 'added' as const, text: result }]
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
                style: 'background: rgba(209, 213, 219, 0.5); color: rgba(107, 114, 128, 0.8); border-radius: 0.25rem; padding: 0.125rem 0.25rem;',
                class: 'ai-transform-loading',
              })
              return DecorationSet.create(state.doc, [decoration])
            }

            // Diff state
            if (pluginState?.showingDiff && pluginState.diffData) {
              const { from, diff } = pluginState.diffData

              const decorations: Decoration[] = []
              let currentPos = from

              diff.forEach((part: { type: 'added' | 'removed' | 'unchanged', text: string }) => {
                const partLength = part.text.length

                if (part.type === 'unchanged') {
                  // No decoration for unchanged text
                  currentPos += partLength
                }
                else if (part.type === 'added') {
                  decorations.push(
                    Decoration.inline(currentPos, currentPos + partLength, {
                      style: 'background: #bbf7d0; color: #166534; border-radius: 0.25rem; padding: 0.125rem 0.25rem; font-weight: 500;',
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
