import type { Editor } from '@tiptap/vue-3'
import type { Ref } from 'vue'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { consola } from 'consola'
import type { AIGenerateOptions, AITransformCallbacks, DatabasePageItem } from '../types'
import { AI_LIMITS } from '../types/ai'
import { AICompletion } from '../utils/tiptap/extensions/ai-completion'
import { AITransform } from '../utils/tiptap/extensions/ai-transform'
import { getAITransformItems } from '../utils/tiptap/editor'
import { useStudio } from './useStudio'
import { useStudioState } from './useStudioState'
import { useAI } from './useAI'

/**
 * Composable for managing AI features in TipTap editor
 */
export function useTiptapEditorAI(document: Ref<DatabasePageItem | undefined>) {
  const { t } = useI18n()
  const ai = useAI()
  const { preferences } = useStudioState()
  const { host } = useStudio()

  const MAX_AI_SELECTION_LENGTH = AI_LIMITS.MAX_SELECTION_LENGTH

  // State
  const isAIValidationVisible = ref(false)
  const isAILanguageInputVisible = ref(false)
  const aiValidationDomRect = ref<DOMRect | null>(null)
  const aiLanguageInputDomRect = ref<DOMRect | null>(null)
  const aiButtonsCallbacks = ref<AITransformCallbacks | null>(null)

  /**
   * Check if current document is from .studio collection (AI context files)
   */
  const isAIContextFile = computed(() => {
    return document.value?.fsPath?.startsWith(ai.contextFolder)
  })

  /**
   * Configure AI extensions for TipTap editor
   */
  const aiExtensions = computed(() => {
    if (!ai.enabled) {
      return []
    }

    return [
      AICompletion.configure({
        enabled: () => preferences.value.enableAICompletion && !isAIContextFile.value,
        onRequest: async (previousContext: string, nextContext: string, hintOptions) => {
          try {
            if (!document.value?.fsPath) {
              return ''
            }

            const collection = host.collection.getByFsPath(document.value.fsPath)

            return await ai.continue({
              previousContext,
              nextContext,
              fsPath: document.value.fsPath,
              collectionName: collection?.name,
              hintOptions,
            })
          }
          catch (error) {
            consola.error('[AI Completion] Error:', error)
            return '' // Return empty string to gracefully handle error
          }
        },
      }),
      AITransform.configure({
        onShowButtons: (data) => {
          isAIValidationVisible.value = true
          aiValidationDomRect.value = data.rect
          aiButtonsCallbacks.value = {
            onAccept: data.onAccept,
            onDecline: data.onDecline,
          }
        },
        onHideButtons: () => {
          isAIValidationVisible.value = false
          aiValidationDomRect.value = null
          aiButtonsCallbacks.value = null
        },
      }),
    ]
  })

  /**
   * Check if selection is too large for AI processing
   */
  function isAISelectionTooLarge(editor: Editor): boolean {
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, '\n')
    return selectedText.length > MAX_AI_SELECTION_LENGTH
  }

  /**
   * Get AI transform menu items for bubble toolbar
   */
  function getAITransformMenuItems(editor: Editor) {
    if (!ai.enabled) {
      return []
    }

    const transformItems = getAITransformItems(t)
    return [
      transformItems.map(item => ({
        label: item.label,
        icon: item.icon,
        onSelect: () => {
          if (item.mode === 'translate') {
            showAILanguageInput(editor)
          }
          else {
            handleAITransform(editor, item.mode)
          }
        },
      })),
    ]
  }

  /**
   * Trims selection to exclude structural elements (lists, code blocks, MDC components).
   * Keeps inline formatting (bold, italic, links) but stops at structural boundaries.
   */
  function trimSelectionToTextOnly(editor: Editor) {
    const { from, to } = editor.state.selection

    return { from, to }
    // const { doc } = editor.state

    // let trimmedTo = to
    // let currentPos = from

    // // Structural elements to exclude (lists, code blocks, MDC components, etc.)
    // const structuralNodeTypes = [
    //   'bulletList',
    //   'orderedList',
    //   'listItem',
    //   'codeBlock',
    //   'element', // MDC components
    //   'slot', // MDC component slots
    //   'blockquote',
    //   'heading',
    // ]

    // // Traverse through the selection
    // doc.nodesBetween(from, to, (node, pos) => {
    //   // If we haven't reached the position yet, skip
    //   if (pos < currentPos) return true

    //   // Check if this node is a structural element we want to exclude
    //   const isStructural = structuralNodeTypes.includes(node.type.name)

    //   if (isStructural && pos > from) {
    //     // Found a structural element, trim selection to before it
    //     trimmedTo = pos
    //     return false // Stop traversal
    //   }

    //   currentPos = pos + node.nodeSize
    //   return true
    // })

    // return { from, to: trimmedTo }
  }

  /**
   * Show language input modal for translation
   */
  function showAILanguageInput(editor: Editor) {
    const { from, to } = editor.state.selection
    const startCoords = editor.view.coordsAtPos(from)
    const endCoords = editor.view.coordsAtPos(to)

    const left = Math.min(startCoords.left, endCoords.left)
    const right = Math.max(startCoords.right, endCoords.right)
    const top = Math.min(startCoords.top, endCoords.top)
    const bottom = Math.max(startCoords.bottom, endCoords.bottom)

    aiLanguageInputDomRect.value = new DOMRect(left, top, right - left, bottom - top)
    isAILanguageInputVisible.value = true
  }

  /**
   * Handle AI transformation (fix, improve, simplify, translate)
   */
  async function handleAITransform(editor: Editor, mode: 'fix' | 'improve' | 'simplify' | 'translate', language?: string) {
    const { empty } = editor.state.selection

    if (empty) return

    // Trim selection to exclude structural elements
    const { from, to } = trimSelectionToTextOnly(editor)

    // If selection became empty after trimming, do nothing
    if (from >= to) return

    // Update selection to trimmed range
    editor.chain().setTextSelection({ from, to }).run()

    // Get selected text
    const selectedText = editor.state.doc.textBetween(from, to, '\n')
    const selectionLength = selectedText.length

    // Validate selection size before processing
    if (selectionLength > MAX_AI_SELECTION_LENGTH) {
      return
    }

    editor.commands.blur()

    // Start transformation with AI call
    editor.commands.transformSelection(mode, async () => {
      // Map the mode to the appropriate AI function
      let result: string

      // Get the collection name for the current file
      const collection = document.value?.fsPath
        ? host.collection.getByFsPath(document.value.fsPath)
        : null

      const generateOptions: AIGenerateOptions = {
        prompt: selectedText,
        selectionLength: selectionLength,
        fsPath: document.value?.fsPath,
        collectionName: collection?.name,
      }

      switch (mode) {
        case 'fix':
          result = await ai.generate({ ...generateOptions, mode: 'fix' })
          break
        case 'improve':
          result = await ai.generate({ ...generateOptions, mode: 'improve' })
          break
        case 'simplify':
          result = await ai.generate({ ...generateOptions, mode: 'simplify' })
          break
        case 'translate':
          result = await ai.generate({ ...generateOptions, mode: 'translate', language: language || 'English' })
          break
        default:
          result = selectedText
      }

      return result
    })
  }

  /**
   * Accept AI suggestion
   */
  function handleAIAccept() {
    if (aiButtonsCallbacks.value) {
      aiButtonsCallbacks.value.onAccept()
    }
  }

  /**
   * Decline AI suggestion
   */
  function handleAIDecline() {
    if (aiButtonsCallbacks.value) {
      aiButtonsCallbacks.value.onDecline()
    }
  }

  /**
   * Handle language submission for translation
   */
  function handleLanguageSubmit(language: string, editor: Editor) {
    handleAITransform(editor, 'translate', language)
    isAILanguageInputVisible.value = false
    aiLanguageInputDomRect.value = null
  }

  /**
   * Cancel language selection
   */
  function handleLanguageCancel() {
    isAILanguageInputVisible.value = false
    aiLanguageInputDomRect.value = null
  }

  return {
    // Constants
    MAX_AI_SELECTION_LENGTH,

    // State
    isAIValidationVisible,
    isAILanguageInputVisible,
    aiValidationDomRect,
    aiLanguageInputDomRect,
    aiButtonsCallbacks,

    // Computed
    aiExtensions,
    isAIContextFile,

    // Functions
    isAISelectionTooLarge,
    getAITransformMenuItems,
    trimSelectionToTextOnly,
    showAILanguageInput,
    handleAITransform,
    handleAIAccept,
    handleAIDecline,
    handleLanguageSubmit,
    handleLanguageCancel,
  }
}
