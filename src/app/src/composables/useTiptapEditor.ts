import type { Editor, JSONContent } from '@tiptap/vue-3'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { titleCase } from 'scule'
import type { EditorCustomHandlers } from '@nuxt/ui'
import type { EditorSuggestionMenuItem } from '@nuxt/ui/runtime/components/EditorSuggestionMenu.vue.d.ts'
import type { EditorEmojiMenuItem } from '@nuxt/ui/runtime/components/EditorEmojiMenu.vue.d.ts'
import type { DropdownMenuItem } from '@nuxt/ui/runtime/components/DropdownMenu.vue.d.ts'
import { gitHubEmojis } from '@tiptap/extension-emoji'
import {
  getStandardToolbarItems,
  getStandardSuggestionItems,
  standardNuxtUIComponents,
  computeStandardDragActions,
} from '../utils/tiptap/editor'

/**
 * Composable for managing TipTap editor UI and configuration
 */
export function useTiptapEditor() {
  const { t } = useI18n()
  const host = window.useStudioHost()

  // Selected node for drag handle
  const selectedNode = ref<JSONContent | null>(null)

  /**
   * Component items for suggestions menu
   */
  const componentItems = computed(() => {
    return host.meta.getComponents().map(component => ({
      kind: component.name,
      type: undefined as never,
      label: titleCase(component.name),
      icon: standardNuxtUIComponents[component.name]?.icon || 'i-lucide-box',
    }))
  })

  /**
   * Custom handlers for editor commands
   */
  const customHandlers = computed(() => ({
    image: {
      canExecute: (editor: Editor) => editor.can().insertContent({ type: 'image-picker' }),
      execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'image-picker' }),
      isActive: (editor: Editor) => editor.isActive('image-picker'),
      isDisabled: undefined,
    },
    video: {
      canExecute: (editor: Editor) => editor.can().insertContent({ type: 'video-picker' }),
      execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'video-picker' }),
      isActive: (editor: Editor) => editor.isActive('video-picker'),
      isDisabled: undefined,
    },
    ...Object.fromEntries(
      componentItems.value.map(item => [
        item.kind,
        {
          canExecute: (editor: Editor) => editor.can().setElement(item.kind, 'default'),
          execute: (editor: Editor) => editor.chain().focus().setElement(item.kind, 'default'),
          isActive: (editor: Editor) => editor.isActive(item.kind),
          isDisabled: undefined,
        },
      ]),
    ),
  }) satisfies EditorCustomHandlers)

  /**
   * Suggestion menu items
   */
  const suggestionItems = computed(() => [
    ...getStandardSuggestionItems(t),
    [
      {
        type: 'label',
        label: t('studio.tiptap.editor.components'),
      },
      ...componentItems.value,
    ],
  ] satisfies EditorSuggestionMenuItem[][])

  /**
   * Toolbar items for bubble menu
   */
  const toolbarItems = computed(() => getStandardToolbarItems(t))

  /**
   * Emoji items for emoji picker
   */
  const emojiItems: EditorEmojiMenuItem[] = gitHubEmojis.filter(
    emoji => !emoji.name.startsWith('regional_indicator_'),
  )

  /**
   * Drag handle menu items
   */
  function dragHandleItems(editor: Editor): DropdownMenuItem[][] {
    if (!selectedNode.value) {
      return []
    }

    return computeStandardDragActions(editor, selectedNode.value, t)
  }

  /**
   * Set selected node (for drag handle)
   */
  function setSelectedNode(node: JSONContent | null) {
    selectedNode.value = node
  }

  return {
    // State
    selectedNode,

    // Computed
    componentItems,
    customHandlers,
    suggestionItems,
    toolbarItems,
    emojiItems,

    // Functions
    dragHandleItems,
    setSelectedNode,
  }
}
