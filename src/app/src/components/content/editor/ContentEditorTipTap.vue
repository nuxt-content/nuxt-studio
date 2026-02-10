<script setup lang="ts">
import { Emoji } from '@tiptap/extension-emoji'
import type { PropType } from 'vue'
import type { JSONContent } from '@tiptap/vue-3'
import type { MDCRoot, Toc } from '@nuxtjs/mdc'
import { generateToc } from '@nuxtjs/mdc/dist/runtime/parser/toc'
import type { DraftItem, DatabasePageItem } from '../../../types'
import type { MarkdownRoot } from '@nuxt/content'
import { ref, watch, computed } from 'vue'
import { useStudio } from '../../../composables/useStudio'
import { useStudioState } from '../../../composables/useStudioState'
import { mdcToTiptap } from '../../../utils/tiptap/mdcToTiptap'
import { tiptapToMDC } from '../../../utils/tiptap/tiptapToMdc'
import { removeLastEmptyParagraph } from '../../../utils/tiptap/editor'
import { Element } from '../../../utils/tiptap/extensions/element'
import { Image } from '../../../utils/tiptap/extensions/image'
import { ImagePicker } from '../../../utils/tiptap/extensions/image-picker'
import { VideoPicker } from '../../../utils/tiptap/extensions/video-picker'
import { Video } from '../../../utils/tiptap/extensions/video'
import { Slot } from '../../../utils/tiptap/extensions/slot'
import { Frontmatter } from '../../../utils/tiptap/extensions/frontmatter'
import { CodeBlock } from '../../../utils/tiptap/extensions/code-block'
import { InlineElement } from '../../../utils/tiptap/extensions/inline-element'
import { SpanStyle } from '../../../utils/tiptap/extensions/span-style'
import { compressTree } from '@nuxt/content/runtime'
import TiptapSpanStylePopover from '../../tiptap/TiptapSpanStylePopover.vue'
import { Binding } from '../../../utils/tiptap/extensions/binding'
import { CustomPlaceholder } from '../../../utils/tiptap/extensions/custom-placeholder'
import { useTiptapEditor } from '../../../composables/useTiptapEditor'
import { useTiptapEditorAI } from '../../../composables/useTiptapEditorAI'

const props = defineProps({
  draftItem: {
    type: Object as PropType<DraftItem>,
    required: true,
  },
})

const document = defineModel<DatabasePageItem>()

const { host } = useStudio()
const { preferences } = useStudioState()

const {
  customHandlers,
  suggestionItems,
  toolbarItems,
  emojiItems,
  dragHandleItems,
  setSelectedNode,
} = useTiptapEditor()

const {
  MAX_AI_SELECTION_LENGTH,
  isAIValidationVisible,
  isAILanguageInputVisible,
  aiValidationDomRect,
  aiLanguageInputDomRect,
  aiExtensions,
  isAISelectionTooLarge,
  getAITransformMenuItems,
  handleAIAccept,
  handleAIDecline,
  handleLanguageSubmit,
  handleLanguageCancel,
} = useTiptapEditorAI(document)

const tiptapJSON = ref<JSONContent>()

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
</script>

<template>
  <div class="h-full flex flex-col">
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
        @node-change="setSelectedNode"
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

      <ContentEditorAIValidation
        :show="isAIValidationVisible"
        :rect="aiValidationDomRect"
        @accept="handleAIAccept"
        @decline="handleAIDecline"
      />

      <ContentEditorAILanguageSelection
        :rect="aiLanguageInputDomRect"
        :show="isAILanguageInputVisible"
        @submit="(language) => handleLanguageSubmit(language, editor)"
        @cancel="handleLanguageCancel"
      />
    </UEditor>
  </div>
</template>
