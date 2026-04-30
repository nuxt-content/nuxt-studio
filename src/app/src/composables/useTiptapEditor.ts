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
import { imageHandler, videoHandler, calloutHandler, componentHandler, tableHandler, CALLOUT_TYPES } from '../utils/tiptap/handlers'
import { useStudio } from './useStudio'

/**
 * Composable for managing TipTap editor UI and configuration
 */
export function useTiptapEditor() {
  const { t } = useI18n()
  const { host } = useStudio()

  // Selected node for drag handle
  const selectedNode = ref<JSONContent | null>(null)

  // The native TipTap Table extension owns the 'table' kind. Skip any project-defined
  // <UTable> / <Table> component so the slash menu doesn't show two "Table" entries that
  // route to different behaviors (collapsed Vue component block vs. editable cells).
  const NATIVE_OVERRIDE_COMPONENTS = new Set(['table'])

  /**
   * Component items for suggestions menu
   */
  const componentItems = computed(() => {
    return host.meta.editor.components.get()
      .filter(component => !NATIVE_OVERRIDE_COMPONENTS.has(component.name))
      .map(component => ({
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
    ...Object.fromEntries(
      componentItems.value.map(item => [
        item.kind,
        CALLOUT_TYPES.has(item.kind) ? calloutHandler(item.kind) : componentHandler(item.kind),
      ]),
    ),
    image: imageHandler(),
    video: videoHandler(),
    table: tableHandler(),
  }) satisfies EditorCustomHandlers)

  /**
   * Suggestion menu items
   */
  const suggestionItems = computed(() => {
    const exclude = host.meta.editor.commands.exclude
    const componentGroups = host.meta.editor.components.getGroups(t('studio.tiptap.editor.components'))

    if (componentGroups.length === 0) {
      return [
        ...getStandardSuggestionItems(t, exclude),
        [
          {
            type: 'label',
            label: t('studio.tiptap.editor.components'),
          },
          ...componentItems.value,
        ],
      ] satisfies EditorSuggestionMenuItem[][]
    }

    const componentGroupItems = componentGroups.map(group => [
      {
        type: 'label' as const,
        label: group.label,
      },
      ...group.components
        .filter(component => !NATIVE_OVERRIDE_COMPONENTS.has(component.name))
        .map(component => ({
          kind: component.name,
          type: undefined as never,
          label: titleCase(component.name),
          icon: standardNuxtUIComponents[component.name]?.icon || 'i-lucide-box',
        })),
    ])

    return [
      ...getStandardSuggestionItems(t, exclude),
      ...componentGroupItems,
    ] satisfies EditorSuggestionMenuItem[][]
  })

  const toolbarItems = computed(() => getStandardToolbarItems(t, host.meta.ai.enabled))

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
