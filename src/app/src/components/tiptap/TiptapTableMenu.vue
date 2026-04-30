<script setup lang="ts">
import { BubbleMenu } from '@tiptap/vue-3/menus'
import type { Editor } from '@tiptap/vue-3'

const props = defineProps<{
  editor: Editor
}>()

function shouldShow() {
  return props.editor.isActive('table')
}

const addRowBefore = () => props.editor.chain().focus().addRowBefore().run()
const addRowAfter = () => props.editor.chain().focus().addRowAfter().run()
const addColumnBefore = () => props.editor.chain().focus().addColumnBefore().run()
const addColumnAfter = () => props.editor.chain().focus().addColumnAfter().run()
const toggleHeaderRow = () => props.editor.chain().focus().toggleHeaderRow().run()
const deleteRow = () => props.editor.chain().focus().deleteRow().run()
const deleteColumn = () => props.editor.chain().focus().deleteColumn().run()
const deleteTable = () => props.editor.chain().focus().deleteTable().run()
</script>

<template>
  <BubbleMenu
    plugin-key="tiptap-table-menu"
    :editor="editor"
    :should-show="shouldShow"
    :options="{ placement: 'top' }"
  >
    <div class="flex items-center gap-0.5 p-0.5 rounded bg-default border border-default shadow-md">
      <UButton
        icon="i-lucide-arrow-up-from-line"
        color="neutral"
        variant="ghost"
        size="xs"
        :title="$t('studio.tiptap.table.addRowAbove')"
        @click="addRowBefore"
      />
      <UButton
        icon="i-lucide-arrow-down-from-line"
        color="neutral"
        variant="ghost"
        size="xs"
        :title="$t('studio.tiptap.table.addRowBelow')"
        @click="addRowAfter"
      />
      <USeparator
        orientation="vertical"
        class="h-5 mx-0.5"
      />
      <UButton
        icon="i-lucide-arrow-left-from-line"
        color="neutral"
        variant="ghost"
        size="xs"
        :title="$t('studio.tiptap.table.addColumnLeft')"
        @click="addColumnBefore"
      />
      <UButton
        icon="i-lucide-arrow-right-from-line"
        color="neutral"
        variant="ghost"
        size="xs"
        :title="$t('studio.tiptap.table.addColumnRight')"
        @click="addColumnAfter"
      />
      <USeparator
        orientation="vertical"
        class="h-5 mx-0.5"
      />
      <UButton
        icon="i-lucide-table-properties"
        color="neutral"
        variant="ghost"
        size="xs"
        :title="$t('studio.tiptap.table.toggleHeader')"
        @click="toggleHeaderRow"
      />
      <USeparator
        orientation="vertical"
        class="h-5 mx-0.5"
      />
      <UButton
        icon="i-lucide-rows-2"
        color="neutral"
        variant="ghost"
        size="xs"
        :title="$t('studio.tiptap.table.deleteRow')"
        @click="deleteRow"
      />
      <UButton
        icon="i-lucide-columns-2"
        color="neutral"
        variant="ghost"
        size="xs"
        :title="$t('studio.tiptap.table.deleteColumn')"
        @click="deleteColumn"
      />
      <USeparator
        orientation="vertical"
        class="h-5 mx-0.5"
      />
      <UButton
        icon="i-lucide-trash"
        color="error"
        variant="ghost"
        size="xs"
        :title="$t('studio.tiptap.table.deleteTable')"
        @click="deleteTable"
      />
    </div>
  </BubbleMenu>
</template>
