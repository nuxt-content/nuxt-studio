<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue'
import type { DatabasePageItem, DraftFileItem } from '../../../../types'
import type { PropType } from 'vue'
import { parseMarkdown, stringifyMarkdown } from '@nuxtjs/mdc/runtime'
import { decompressTree, compressTree } from '@nuxt/content/runtime'
import type { MDCRoot } from '@nuxtjs/mdc'
import type { MarkdownRoot } from '@nuxt/content'
import { removeReservedKeysFromDocument } from '../../../../utils/content'
import { setupMonaco, type Editor } from '../../../../utils/monaco'

const props = defineProps({
  draftItem: {
    type: Object as PropType<DraftFileItem>,
    required: true,
  },
})

const document = defineModel<DatabasePageItem>()

const editor = shallowRef<Editor.IStandaloneCodeEditor | null>(null)
const editorRef = ref()
const content = ref<string>('')
const currentDocumentId = ref<string | null>(null)

// Trigger on action events
watch(() => props.draftItem.status, () => {
  if (editor.value) {
    setContent(props.draftItem.document as DatabasePageItem)
  }
})

// Trigger on document changes
watch(() => document.value?.id, async () => {
  if (document.value?.body) {
    setContent(document.value)
  }
}, { immediate: true })

onMounted(async () => {
  const monaco = await setupMonaco()

  // create a Monaco editor instance
  editor.value = monaco.createEditor(editorRef.value)
  editor.value.onDidChangeModelContent(() => {
    // Do not trigger model updates if the document id has changed
    if (currentDocumentId.value !== document.value?.id) {
      return
    }

    const newContent = editor.value!.getModel()!.getValue() || ''
    if (content.value === newContent) {
      return
    }

    content.value = newContent

    parseMarkdown(content.value).then((tree) => {
      document.value = {
        ...document.value,
        body: tree.body.type === 'root' ? compressTree(tree.body) : tree.body as never as MarkdownRoot,
        ...tree.data,
      } as DatabasePageItem
    })
  })

  // create and attach a model to the editor
  editor.value.setModel(monaco.editor.createModel(content.value, 'mdc'))
})

function setContent(document: DatabasePageItem) {
  const tree = document.body.type === 'minimark' ? decompressTree(document.body) : (document.body as unknown as MDCRoot)
  const data = removeReservedKeysFromDocument(document)
  stringifyMarkdown(tree, data).then((md) => {
    content.value = md || ''

    if (editor.value) {
      editor.value.getModel()?.setValue(md || '')
    }

    currentDocumentId.value = document.id
  })
}
</script>

<template>
  <div
    ref="editorRef"
    class="h-full -m-4"
  />
</template>
