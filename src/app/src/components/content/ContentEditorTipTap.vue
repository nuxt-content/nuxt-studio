<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui/runtime/components/DropdownMenu.vue.d.ts'
import type { EditorSuggestionMenuItem } from '@nuxt/ui/runtime/components/EditorSuggestionMenu.vue.d.ts'
import { Emoji, gitHubEmojis } from '@tiptap/extension-emoji'
import type { PropType } from 'vue'
import type { Editor, JSONContent } from '@tiptap/vue-3'
import type { MDCRoot, Toc } from '@nuxtjs/mdc'
import { generateToc } from '@nuxtjs/mdc/dist/runtime/parser/toc'
import type { DraftItem, DatabasePageItem, AIGenerateOptions } from '../../types'
import type { MarkdownRoot } from '@nuxt/content'
import type { EditorCustomHandlers } from '@nuxt/ui'
import type { EditorEmojiMenuItem } from '@nuxt/ui/runtime/components/EditorEmojiMenu.vue.d.ts'
import { ref, watch, computed } from 'vue'
import { titleCase } from 'scule'
import { useI18n } from 'vue-i18n'
import { useStudio } from '../../composables/useStudio'
import { useStudioState } from '../../composables/useStudioState'
import { mdcToTiptap } from '../../utils/tiptap/mdcToTiptap'
import { tiptapToMDC } from '../../utils/tiptap/tiptapToMdc'
import { getStandardToolbarItems, getStandardSuggestionItems, standardNuxtUIComponents, computeStandardDragActions, removeLastEmptyParagraph, getAITransformItems } from '../../utils/tiptap/editor'
import { Element } from '../../utils/tiptap/extensions/element'
import { Image } from '../../utils/tiptap/extensions/image'
import { ImagePicker } from '../../utils/tiptap/extensions/image-picker'
import { VideoPicker } from '../../utils/tiptap/extensions/video-picker'
import { Video } from '../../utils/tiptap/extensions/video'
import { Slot } from '../../utils/tiptap/extensions/slot'
import { Frontmatter } from '../../utils/tiptap/extensions/frontmatter'
import { CodeBlock } from '../../utils/tiptap/extensions/code-block'
import { InlineElement } from '../../utils/tiptap/extensions/inline-element'
import { SpanStyle } from '../../utils/tiptap/extensions/span-style'
import { compressTree } from '@nuxt/content/runtime'
import TiptapSpanStylePopover from '../tiptap/TiptapSpanStylePopover.vue'
import ContentEditorAIValidation from './ContentEditorAIValidation.vue'
import { Binding } from '../../utils/tiptap/extensions/binding'
import { AICompletion } from '../../utils/tiptap/extensions/ai-completion'
import { AITransform } from '../../utils/tiptap/extensions/ai-transform'
import { CustomPlaceholder } from '../../utils/tiptap/extensions/custom-placeholder'
import { useAI } from '../../composables/useAI'

const props = defineProps({
  draftItem: {
    type: Object as PropType<DraftItem>,
    required: true,
  },
})

const document = defineModel<DatabasePageItem>()

const { host } = useStudio()
const { preferences } = useStudioState()
const { t } = useI18n()
const ai = useAI()

const tiptapJSON = ref<JSONContent>()

const showAIButtons = ref(false)
const aiButtonsRect = ref<DOMRect | null>(null)
const aiButtonsCallbacks = ref<{
  onAccept: () => void
  onDecline: () => void
} | null>(null)

const removeReservedKeys = host.document.utils.removeReservedKeys

// Debug
const debug = computed(() => preferences.value.debug)
const currentTiptap = ref<JSONContent>()
const currentMDC = ref<{ body: MDCRoot, data: Record<string, unknown> }>()
const currentContent = ref<string>()

// Trigger on document changes
watch(() => `${document.value?.id}-${props.draftItem.version}-${props.draftItem.status}`, async () => {
  const frontmatterJson = removeReservedKeys(document.value!)
  const newTiptapJSON = mdcToTiptap(document.value?.body as unknown as MDCRoot, frontmatterJson)

  if (!tiptapJSON.value || JSON.stringify(newTiptapJSON) !== JSON.stringify(removeLastEmptyParagraph(tiptapJSON.value))) {
    tiptapJSON.value = newTiptapJSON

    if (debug.value && !currentMDC.value) {
      const generateContentFromDocument = host.document.generate.contentFromDocument
      const generatedContent = await generateContentFromDocument(document.value!) || ''
      currentMDC.value = {
        body: document.value!.body as unknown as MDCRoot,
        data: frontmatterJson,
      }
      currentContent.value = generatedContent
      currentTiptap.value = JSON.parse(JSON.stringify(tiptapJSON.value))
    }
  }
}, { immediate: true })

// TipTap to Markdown
watch(tiptapJSON, async (json) => {
  const cleanedTiptap = removeLastEmptyParagraph(json!)

  const { body, data } = await tiptapToMDC(cleanedTiptap, {
    highlightTheme: host.meta.getHighlightTheme(),
  })

  const compressedBody: MarkdownRoot = compressTree(body)
  const toc: Toc = generateToc(body, { searchDepth: 2, depth: 2 } as Toc)

  const updatedDocument: DatabasePageItem = {
    ...document.value!,
    ...data,
    body: {
      ...compressedBody,
      toc,
    } as MarkdownRoot,
  }

  document.value = updatedDocument

  // Debug: Capture current state
  if (debug.value) {
    currentTiptap.value = cleanedTiptap
    currentMDC.value = {
      body,
      data: removeReservedKeys(updatedDocument),
    }
    currentContent.value = await host.document.generate.contentFromDocument(updatedDocument) as string
  }
})

const componentItems = computed(() => {
  return host.meta.getComponents().map(component => ({
    kind: component.name,
    type: undefined as never,
    label: titleCase(component.name),
    icon: standardNuxtUIComponents[component.name]?.icon || 'i-lucide-box',
  }))
})

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

const selectedNode = ref<JSONContent | null>(null)
const dragHandleItems = (editor: Editor): DropdownMenuItem[][] => {
  if (!selectedNode.value) {
    return []
  }

  return computeStandardDragActions(editor, selectedNode.value, t)
}

const toolbarItems = computed(() => getStandardToolbarItems(t))

const emojiItems: EditorEmojiMenuItem[] = gitHubEmojis.filter(
  emoji => !emoji.name.startsWith('regional_indicator_'),
)

const aiExtensions = computed(() => {
  if (!ai.enabled) {
    return []
  }

  // Check if current document is from .studio collection (AI context files)
  const isAIContextFile = computed(() => {
    return document.value?.fsPath?.startsWith(ai.contextFolder)
  })

  return [
    AICompletion.configure({
      enabled: () => preferences.value.enableAICompletion && !isAIContextFile.value,
      onRequest: async (prompt: string, hintOptions) => {
        if (!document.value?.fsPath) {
          return ''
        }

        const collection = host.collection.getByFsPath(document.value!.fsPath!)

        return await ai.continue(prompt, document.value?.fsPath, collection?.name, hintOptions)
      },
    }),
    AITransform.configure({
      onShowButtons: (data) => {
        showAIButtons.value = true
        aiButtonsRect.value = data.rect
        aiButtonsCallbacks.value = {
          onAccept: data.onAccept,
          onDecline: data.onDecline,
        }
      },
      onHideButtons: () => {
        showAIButtons.value = false
        aiButtonsRect.value = null
        aiButtonsCallbacks.value = null
      },
    }),
  ]
})

const MAX_AI_SELECTION_LENGTH = 500

function isAISelectionTooLarge(editor: Editor): boolean {
  const { from, to } = editor.state.selection
  const selectedText = editor.state.doc.textBetween(from, to, '\n')
  return selectedText.length > MAX_AI_SELECTION_LENGTH
}

function getAITransformMenuItems(editor: Editor) {
  if (!ai.enabled) {
    return []
  }

  const transformItems = getAITransformItems(t)
  return [
    transformItems.map(item => ({
      label: item.label,
      icon: item.icon,
      onSelect: () => handleAITransform(editor, item.mode),
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

async function handleAITransform(editor: Editor, mode: 'fix' | 'improve' | 'simplify' | 'translate') {
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

  // Start transformation with AI call
  editor.commands.transformSelection(mode, async () => {
    // Map the mode to the appropriate AI function
    let result: string

    // Get the collection name for the current file
    const collection = document.value?.fsPath
      ? host.collection.getByFsPath(document.value.fsPath)
      : null

    const options: AIGenerateOptions = {
      prompt: selectedText,
      selectionLength: selectionLength,
      fsPath: document.value?.fsPath,
      collectionName: collection?.name,
    }

    switch (mode) {
      case 'fix':
        result = await ai.generate({ ...options, mode: 'fix' })
        break
      case 'improve':
        result = await ai.generate({ ...options, mode: 'improve' })
        break
      case 'simplify':
        result = await ai.generate({ ...options, mode: 'simplify' })
        break
      case 'translate':
        result = await ai.generate({ ...options, mode: 'translate', language: 'fr' })
        break
      default:
        result = selectedText
    }

    return result
  })
}

function handleAIAccept() {
  if (aiButtonsCallbacks.value) {
    aiButtonsCallbacks.value.onAccept()
  }
}

function handleAIDecline() {
  if (aiButtonsCallbacks.value) {
    aiButtonsCallbacks.value.onDecline()
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <ContentEditorAIValidation
      :show="showAIButtons"
      :rect="aiButtonsRect"
      @accept="handleAIAccept"
      @decline="handleAIDecline"
    />

    <ContentEditorTipTapDebug
      v-if="preferences.debug"
      :current-tiptap="currentTiptap"
      :current-mdc="currentMDC"
      :current-content="currentContent"
    />

    <UEditor
      v-slot="{ editor }"
      v-model="tiptapJSON"
      class="mb-4 ml-1"
      content-type="json"
      :handlers="customHandlers"
      :starter-kit="{
        codeBlock: false,
        link: {
          HTMLAttributes: {
            target: null,
          },
        },
      }"
      :extensions="[
        CustomPlaceholder.configure({
          placeholder: $t('studio.tiptap.editor.placeholder'),
        }),
        Frontmatter,
        Image,
        ImagePicker,
        VideoPicker,
        Video,
        Element,
        InlineElement,
        SpanStyle,
        Slot,
        CodeBlock,
        Emoji,
        Binding,
        ...aiExtensions,
      ]"
    >
      <UEditorToolbar
        :editor="editor"
        :items="toolbarItems"
        layout="bubble"
      >
        <template #link>
          <TiptapLinkPopover :editor="editor" />
        </template>
        <template #span-style>
          <TiptapSpanStylePopover :editor="editor" />
        </template>
        <template #ai-transform>
          <UTooltip
            :text="isAISelectionTooLarge(editor) ? $t('studio.tiptap.ai.selectionTooLarge', { max: MAX_AI_SELECTION_LENGTH }) : undefined"
            :disabled="!isAISelectionTooLarge(editor)"
          >
            <UDropdownMenu
              v-slot="{ open }"
              :items="getAITransformMenuItems(editor)"
              :modal="false"
              :disabled="isAISelectionTooLarge(editor)"
            >
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-lucide-sparkles"
                :active="open"
                :disabled="isAISelectionTooLarge(editor)"
              />
            </UDropdownMenu>
          </UTooltip>
        </template>
      </UEditorToolbar>

      <UEditorDragHandle
        v-slot="{ ui }"
        :editor="editor"
        @node-change="selectedNode = $event"
      >
        <UDropdownMenu
          v-slot="{ open }"
          :modal="false"
          :items="dragHandleItems(editor)"
          :content="{ side: 'left' }"
          :ui="{ content: 'w-48', label: 'text-xs' }"
          @update:open="editor.chain().setMeta('lockDragHandle', $event).run()"
        >
          <UButton
            color="neutral"
            variant="ghost"
            active-variant="soft"
            size="sm"
            icon="i-lucide-grip-vertical"
            :active="open"
            :class="ui.handle()"
          />
        </UDropdownMenu>
      </UEditorDragHandle>

      <UEditorSuggestionMenu
        :editor="editor"
        :items="suggestionItems"
      />

      <UEditorEmojiMenu
        :editor="editor"
        :items="emojiItems"
      />
    </UEditor>
  </div>
</template>
