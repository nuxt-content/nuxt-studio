<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import type { Editor } from '@tiptap/vue-3'

const props = defineProps<{
  editor: Editor
  autoOpen?: boolean
}>()

const open = ref(false)
const url = ref('')

const active = computed(() => props.editor.isActive('link'))
const disabled = computed(() => {
  if (!props.editor.isEditable) return true
  const { selection } = props.editor.state
  return selection.empty && !props.editor.isActive('link')
})

let currentEditor: Editor
let updateUrlCallback: (() => void)

watch(() => props.editor, (editor) => {
  if (!editor) return

  if (currentEditor && updateUrlCallback) {
    currentEditor.off('selectionUpdate', updateUrlCallback)
  }

  const updateUrl = () => {
    const { href } = editor.getAttributes('link')
    url.value = href || ''
  }

  updateUrl()
  editor.on('selectionUpdate', updateUrl)

  currentEditor = editor
  updateUrlCallback = updateUrl
}, { immediate: true })

onBeforeUnmount(() => {
  if (currentEditor && updateUrlCallback) {
    currentEditor.off('selectionUpdate', updateUrlCallback)
  }
})

watch(active, (isActive) => {
  if (isActive && props.autoOpen) {
    open.value = true
  }
})

function setLink() {
  if (!url.value) return

  const { selection } = props.editor.state
  const isEmpty = selection.empty

  let chain = props.editor.chain().focus()
  chain = chain.extendMarkRange('link').setLink({ href: url.value })

  if (isEmpty) {
    chain = chain.insertContent({ type: 'text', text: url.value })
  }

  chain.run()
  open.value = false
}

function removeLink() {
  props.editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .unsetLink()
    .setMeta('preventAutolink', true)
    .run()

  url.value = ''
  open.value = false
}

function openLink() {
  if (!url.value) return
  window.open(url.value, '_blank', 'noopener,noreferrer')
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    setLink()
  }
}
</script>

<template>
  <UPopover
    v-model:open="open"
    :portal="false"
    :ui="{ content: 'p-0.5' }"
  >
    <UButton
      icon="i-lucide-link"
      color="neutral"
      active-color="primary"
      variant="ghost"
      active-variant="soft"
      size="sm"
      :active="active"
      :disabled="disabled"
      :class="[open && 'bg-elevated']"
    />

    <template #content>
      <UInput
        v-model="url"
        autofocus
        name="url"
        type="url"
        variant="none"
        :placeholder="$t('studio.tiptap.link.pasteLinkPlaceholder')"
        @keydown="handleKeyDown"
      >
        <div class="flex items-center mr-0.5">
          <UButton
            icon="i-lucide-corner-down-left"
            variant="ghost"
            size="xs"
            :disabled="!url && !active"
            :title="$t('studio.tiptap.link.applyLink')"
            @click="setLink"
          />

          <USeparator
            orientation="vertical"
            class="h-6 mx-1"
          />

          <UButton
            icon="i-lucide-external-link"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="!url && !active"
            :title="$t('studio.tiptap.link.openInNewWindow')"
            @click="openLink"
          />

          <UButton
            icon="i-lucide-trash"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="!url && !active"
            :title="$t('studio.tiptap.link.removeLink')"
            @click="removeLink"
          />
        </div>
      </UInput>
    </template>
  </UPopover>
</template>
