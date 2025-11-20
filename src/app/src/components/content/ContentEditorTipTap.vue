<script setup lang="ts">
// import { upperFirst } from 'scule'
// import type { EditorToolbarItem } from '@nuxt/ui/runtime/components/EditorToolbar.vue.d.ts'
// import type { EditorSuggestionMenuItem } from '@nuxt/ui/runtime/components/EditorSuggestionMenu.vue.d.ts'
// import type { DropdownMenuItem } from '@nuxt/ui/runtime/components/DropdownMenu.vue.d.ts'
// import { mapEditorItems } from '@nuxt/ui/utils/editor'
// import { Emoji, gitHubEmojis } from '@tiptap/extension-emoji'
// import { ImageUpload } from '../../utils/editor/image-upload'
import { ref, watch, computed } from 'vue'
// import type { Editor } from '@tiptap/core'
import type { PropType } from 'vue'
import type { MDCRoot } from '@nuxtjs/mdc'
import type { MarkdownRoot } from '@nuxt/content'
import type { JSONContent } from '@tiptap/vue-3'
import { useStudio } from '../../composables/useStudio'
import { useStudioState } from '../../composables/useStudioState'
import { mdcToTiptap } from '../../utils/tiptap/mdcToTiptap'
import { tiptapToMDC } from '../../utils/tiptap/tiptapToMdc'
import type { DraftItem, DatabasePageItem } from '../../types'
import { omit } from '../../utils/object'

const props = defineProps({
  draftItem: {
    type: Object as PropType<DraftItem>,
    required: true,
  },
})

const document = defineModel<DatabasePageItem>()

// const content = ref<string>('')
const tiptapJSON = ref<JSONContent>()

// Debug
const initialMDC = ref<{ body: MDCRoot, data: Record<string, unknown> }>()
const initialContent = ref<string>()
const initialTiptap = ref<JSONContent>()
const currentTiptap = ref<JSONContent>()
const currentMDC = ref<{ body: MDCRoot, data: Record<string, unknown> }>()
const currentContent = ref<string>()

const { host } = useStudio()
const { preferences } = useStudioState()

const reservedKeys = ['id', 'fsPath', 'stem', 'extension', '__hash__', 'path', 'body', 'meta', 'rawbody']
const debug = computed(() => preferences.value.debug)

// Trigger on document changes
watch(() => document.value?.id + '-' + props.draftItem.version, async () => {
  if (document.value) {
    setEditorJSON(document.value)
  }
}, { immediate: true })

async function setEditorJSON(document: DatabasePageItem) {
  const generateContentFromDocument = host.document.generate.contentFromDocument
  const generatedContent = await generateContentFromDocument(document) || ''

  tiptapJSON.value = mdcToTiptap(document.body as unknown as MDCRoot, '')

  // Debug: Capture initial state
  if (debug.value && !initialMDC.value) {
    initialMDC.value = {
      body: document.body as unknown as MDCRoot,
      data: omit(document, reservedKeys) as Record<string, unknown>,
    }
    initialContent.value = generatedContent
    initialTiptap.value = JSON.parse(JSON.stringify(tiptapJSON.value))
  }

  // TODO: conflicts detection
  // isAutomaticFormattingDetected.value = false
  // if (props.draftItem.original && props.draftItem.remoteFile?.content) {
  //   const localOriginal = await generateContentFromDocument(props.draftItem.original as DatabaseItem) as string
  //   const remoteOriginal = props.draftItem.remoteFile.encoding === 'base64' ? fromBase64ToUTF8(props.draftItem.remoteFile.content!) : props.draftItem.remoteFile.content!

  //   isAutomaticFormattingDetected.value = !areContentEqual(localOriginal, remoteOriginal)
  //   if (isAutomaticFormattingDetected.value) {
  //     originalContent.value = remoteOriginal
  //     formattedContent.value = localOriginal
  //   }
  // }
}

// TipTap to Markdown
watch(tiptapJSON, async (json) => {
  const mdc = await tiptapToMDC(json!)

  const updatedDocument: DatabasePageItem = {
    ...document.value!,
    ...mdc.data,
    body: mdc.body as unknown as MarkdownRoot,
  }

  document.value = updatedDocument

  if (debug.value) {
    currentTiptap.value = JSON.parse(JSON.stringify(tiptapJSON.value))
    currentMDC.value = mdc
    currentContent.value = await host.document.generate.contentFromDocument(updatedDocument) as string
  }

  // const generatedContent = await host.document.generate.contentFromDocument(updatedDocument
})

// const customHandlers: EditorHandlers = {
//   image: {
//     canExecute: (editor: Editor) => (editor.can() as any).insertContent({ type: 'imageUpload' }),
//     execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'imageUpload' }),
//     isActive: (editor: Editor) => editor.isActive('imageUpload'),
//     isDisabled: undefined,
//   },
// }

// const toolbarItems = [[{
//   kind: 'undo',
//   icon: 'i-lucide-undo',
// }, {
//   kind: 'redo',
//   icon: 'i-lucide-redo',
// }], [{
//   kind: 'dropdown',
//   icon: 'i-lucide-heading',
//   ui: {
//     label: 'text-xs',
//   },
//   items: [{
//     type: 'label',
//     label: 'Headings',
//   }, {
//     kind: 'heading',
//     level: 1,
//     icon: 'i-lucide-heading',
//     label: 'Heading 1',
//   }, {
//     kind: 'heading',
//     level: 2,
//     icon: 'i-lucide-heading-2',
//     label: 'Heading 2',
//   }, {
//     kind: 'heading',
//     level: 3,
//     icon: 'i-lucide-heading-3',
//     label: 'Heading 3',
//   }, {
//     kind: 'heading',
//     level: 4,
//     icon: 'i-lucide-heading-4',
//     label: 'Heading 4',
//   }],
// }, {
//   kind: 'dropdown',
//   icon: 'i-lucide-list',
//   items: [{
//     kind: 'bulletList',
//     icon: 'i-lucide-list',
//     label: 'Bullet List',
//   }, {
//     kind: 'orderedList',
//     icon: 'i-lucide-list-ordered',
//     label: 'Ordered List',
//   }],
// }, {
//   kind: 'blockquote',
//   icon: 'i-lucide-text-quote',
// }, {
//   kind: 'codeBlock',
//   icon: 'i-lucide-square-code',
// }, {
//   kind: 'horizontalRule',
//   icon: 'i-lucide-separator-horizontal',
// }, {
//   kind: 'paragraph',
//   icon: 'i-lucide-type',
// }], [{
//   kind: 'mark',
//   mark: 'bold',
//   icon: 'i-lucide-bold',
// }, {
//   kind: 'mark',
//   mark: 'italic',
//   icon: 'i-lucide-italic',
// }, {
//   kind: 'mark',
//   mark: 'underline',
//   icon: 'i-lucide-underline',
// }, {
//   kind: 'mark',
//   mark: 'strike',
//   icon: 'i-lucide-strikethrough',
// }, {
//   kind: 'mark',
//   mark: 'code',
//   icon: 'i-lucide-code',
// }, {
//   kind: 'slot',
//   slot: 'link' as const,
// }, {
//   kind: 'image',
//   icon: 'i-lucide-image',
// }]] satisfies EditorToolbarItem[][]

// const suggestionItems: EditorSuggestionMenuItem[][] = [[{
//   type: 'label',
//   label: 'Style',
// }, {
//   kind: 'paragraph',
//   label: 'Paragraph',
//   icon: 'i-lucide-type',
// }, {
//   kind: 'heading',
//   level: 1,
//   label: 'Heading 1',
//   icon: 'i-lucide-heading-1',
// }, {
//   kind: 'heading',
//   level: 2,
//   label: 'Heading 2',
//   icon: 'i-lucide-heading-2',
// }, {
//   kind: 'heading',
//   level: 3,
//   label: 'Heading 3',
//   icon: 'i-lucide-heading-3',
// }, {
//   kind: 'bulletList',
//   label: 'Bullet List',
//   icon: 'i-lucide-list',
// }, {
//   kind: 'orderedList',
//   label: 'Numbered List',
//   icon: 'i-lucide-list-ordered',
// }, {
//   kind: 'blockquote',
//   label: 'Blockquote',
//   icon: 'i-lucide-text-quote',
// }, {
//   kind: 'codeBlock',
//   label: 'Code Block',
//   icon: 'i-lucide-square-code',
// }], [{
//   type: 'label',
//   label: 'Insert',
// }, {
// //   kind: 'emoji',
// //   label: 'Emoji',
// //   icon: 'i-lucide-smile-plus',
// // }, {
// //   kind: 'image',
// //   label: 'Image',
// //   icon: 'i-lucide-image',
// // }, {
//   kind: 'horizontalRule',
//   label: 'Horizontal Rule',
//   icon: 'i-lucide-separator-horizontal',
// }]]

// const emojiItems: EditorEmojiMenuItem[] = gitHubEmojis.filter(emoji => !emoji.name.startsWith('regional_indicator_'))

// const selectedNode = ref<any>(null)

// const handleItems = (editor: Editor): DropdownMenuItem[][] => {
//   if (!selectedNode.value) {
//     return []
//   }

//   return mapEditorItems(editor, [[
//     {
//       type: 'label',
//       label: upperFirst(selectedNode.value.node.type),
//     },
//     {
//       label: 'Turn into',
//       icon: 'i-lucide-repeat-2',
//       children: [
//         { kind: 'paragraph', label: 'Paragraph', icon: 'i-lucide-type' },
//         { kind: 'heading', level: 1, label: 'Heading 1', icon: 'i-lucide-heading-1' },
//         { kind: 'heading', level: 2, label: 'Heading 2', icon: 'i-lucide-heading-2' },
//         { kind: 'heading', level: 3, label: 'Heading 3', icon: 'i-lucide-heading-3' },
//         { kind: 'heading', level: 4, label: 'Heading 4', icon: 'i-lucide-heading-4' },
//         { kind: 'bulletList', label: 'Bullet List', icon: 'i-lucide-list' },
//         { kind: 'orderedList', label: 'Ordered List', icon: 'i-lucide-list-ordered' },
//         { kind: 'blockquote', label: 'Blockquote', icon: 'i-lucide-text-quote' },
//         { kind: 'codeBlock', label: 'Code Block', icon: 'i-lucide-square-code' },
//       ],
//     },
//     {
//       kind: 'clearFormatting',
//       pos: selectedNode.value?.pos,
//       label: 'Reset formatting',
//       icon: 'i-lucide-rotate-ccw',
//     },
//   ], [
//     {
//       kind: 'duplicate',
//       pos: selectedNode.value?.pos,
//       label: 'Duplicate',
//       icon: 'i-lucide-copy',
//     },
//     {
//       label: 'Copy to clipboard',
//       icon: 'i-lucide-clipboard',
//       onSelect: async () => {
//         if (!selectedNode.value) return

//         const pos = selectedNode.value.pos
//         const node = editor.state.doc.nodeAt(pos)
//         if (node) {
//           await navigator.clipboard.writeText(node.textContent)
//         }
//       },
//     },
//   ], [
//     {
//       kind: 'moveUp',
//       pos: selectedNode.value?.pos,
//       label: 'Move up',
//       icon: 'i-lucide-arrow-up',
//     },
//     {
//       kind: 'moveDown',
//       pos: selectedNode.value?.pos,
//       label: 'Move down',
//       icon: 'i-lucide-arrow-down',
//     },
//   ], [
//     {
//       kind: 'delete',
//       pos: selectedNode.value?.pos,
//       label: 'Delete',
//       icon: 'i-lucide-trash',
//     },
//   ]],
//   // , customHandlers
//   ) as DropdownMenuItem[][]
// }
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Debug Panel -->
    <ContentEditorTipTapDebug
      v-if="preferences.debug"
      :initial-mdc="initialMDC"
      :initial-content="initialContent"
      :initial-tiptap="initialTiptap"
      :current-tiptap="currentTiptap"
      :current-mdc="currentMDC"
      :current-content="currentContent"
    />

    <!-- v-slot="{ editor }" -->
    <UEditor
      v-model="tiptapJSON"
      :extensions="[
        // Emoji,
        // ImageUpload,
      ]"
      content-type="json"
      placeholder="Write, type '/' for commands..."
      class="min-h-0 flex-1"
      :ui="{ content: 'max-w-2xl mx-auto' }"
    >
      <!-- <UEditorToolbar
        :editor="editor"
        :items="toolbarItems"
        layout="bubble"
        :should-show="({ editor, state, view }) => {
          if (editor.isActive('imageUpload') || editor.isActive('image')) {
            return false
          }
          if (!view.hasFocus()) {
            return false
          }
          const { selection } = state
          const { empty } = selection
          return !empty
        }"
      >
        <template #link>
          <EditorLinkPopover :editor="editor" />
        </template>
      </UEditorToolbar> -->

      <!-- <UEditorToolbar /> for image -->

      <!-- <UEditorDragHandle
        v-slot="{ ui }"
        :editor="editor"
        @node-change="selectedNode = $event"
      >
        <UDropdownMenu
          v-slot="{ open }"
          :modal="false"
          :items="handleItems(editor)"
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
      </UEditorDragHandle> -->

      <!-- <UEditorSuggestionMenu
        :editor="editor"
        :items="suggestionItems"
      /> -->
      <!-- :items="mentionItems" -->
      <!-- <UEditorEmojiMenu
        :editor="editor"
        :items="emojiItems"
      /> -->
    </UEditor>
  </div>
</template>
