<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import type { DropdownMenuItem } from '@nuxt/ui'
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  findTableInfo,
  getColumnRects,
  getRowRects,
  selectColumn,
  selectRow,
} from '../../composables/useTableGrips'
import type { Rect } from '../../composables/useTableGrips'

const props = defineProps<{
  editor: Editor
}>()

const { t } = useI18n()

const isActive = ref(false)
const columnRects = ref<Rect[]>([])
const rowRects = ref<Rect[]>([])
const activeGrip = ref<{ type: 'column' | 'row', index: number } | null>(null)
const wrapperStyle = ref<Record<string, string>>({})
const gripsRef = ref<HTMLElement | null>(null)

let rafId: number | null = null

function recomputePositions() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    rafId = null
    const info = findTableInfo(props.editor)

    if (!info) {
      isActive.value = false
      columnRects.value = []
      rowRects.value = []
      return
    }

    isActive.value = true
    columnRects.value = getColumnRects(info.tableEl)
    rowRects.value = getRowRects(info.tableEl)

    const editorEl = gripsRef.value?.parentElement
    if (!editorEl) return

    const editorRect = editorEl.getBoundingClientRect()
    const tableRect = info.tableEl.getBoundingClientRect()

    wrapperStyle.value = {
      position: 'absolute',
      top: `${tableRect.top - editorRect.top}px`,
      left: `${tableRect.left - editorRect.left}px`,
      width: `${tableRect.width}px`,
      height: `${tableRect.height}px`,
      pointerEvents: 'none',
      zIndex: '10',
    }
  })
}

function onColumnDropdownToggle(index: number, open: boolean) {
  if (open) {
    activeGrip.value = { type: 'column', index }
    const info = findTableInfo(props.editor)
    if (info) selectColumn(props.editor, info, index)
  }
  else {
    activeGrip.value = null
  }
}

function onRowDropdownToggle(index: number, open: boolean) {
  if (open) {
    activeGrip.value = { type: 'row', index }
    const info = findTableInfo(props.editor)
    if (info) selectRow(props.editor, info, index)
  }
  else {
    activeGrip.value = null
  }
}

function columnMenuItems(index: number): DropdownMenuItem[][] {
  return [
    [
      {
        label: t('studio.tiptap.table.insertLeft'),
        icon: 'i-lucide-arrow-left',
        onSelect() {
          const info = findTableInfo(props.editor)
          if (info) selectColumn(props.editor, info, index)
          nextTick(() => {
            props.editor.chain().focus().addColumnBefore().run()
          })
        },
      },
      {
        label: t('studio.tiptap.table.insertRight'),
        icon: 'i-lucide-arrow-right',
        onSelect() {
          const info = findTableInfo(props.editor)
          if (info) selectColumn(props.editor, info, index)
          nextTick(() => {
            props.editor.chain().focus().addColumnAfter().run()
          })
        },
      },
    ],
    [
      {
        label: t('studio.tiptap.table.deleteColumn'),
        icon: 'i-lucide-trash',
        color: 'error' as const,
        onSelect() {
          const info = findTableInfo(props.editor)
          if (info) selectColumn(props.editor, info, index)
          nextTick(() => {
            props.editor.chain().focus().deleteColumn().run()
          })
        },
      },
      {
        label: t('studio.tiptap.table.deleteTable'),
        icon: 'i-lucide-trash',
        color: 'error' as const,
        onSelect() {
          props.editor.chain().focus().deleteTable().run()
        },
      },
    ],
  ]
}

function rowMenuItems(index: number): DropdownMenuItem[][] {
  return [
    [
      {
        label: t('studio.tiptap.table.insertAbove'),
        icon: 'i-lucide-arrow-up',
        onSelect() {
          const info = findTableInfo(props.editor)
          if (info) selectRow(props.editor, info, index)
          nextTick(() => {
            props.editor.chain().focus().addRowBefore().run()
          })
        },
      },
      {
        label: t('studio.tiptap.table.insertBelow'),
        icon: 'i-lucide-arrow-down',
        onSelect() {
          const info = findTableInfo(props.editor)
          if (info) selectRow(props.editor, info, index)
          nextTick(() => {
            props.editor.chain().focus().addRowAfter().run()
          })
        },
      },
    ],
    [
      {
        label: t('studio.tiptap.table.deleteRow'),
        icon: 'i-lucide-trash',
        color: 'error' as const,
        onSelect() {
          const info = findTableInfo(props.editor)
          if (info) selectRow(props.editor, info, index)
          nextTick(() => {
            props.editor.chain().focus().deleteRow().run()
          })
        },
      },
      {
        label: t('studio.tiptap.table.deleteTable'),
        icon: 'i-lucide-trash',
        color: 'error' as const,
        onSelect() {
          props.editor.chain().focus().deleteTable().run()
        },
      },
    ],
  ]
}

onMounted(() => {
  props.editor.on('transaction', recomputePositions)
  recomputePositions()
})

onBeforeUnmount(() => {
  props.editor.off('transaction', recomputePositions)
  if (rafId) cancelAnimationFrame(rafId)
})

watch(() => props.editor.isActive('table'), (active) => {
  if (!active) {
    isActive.value = false
    columnRects.value = []
    rowRects.value = []
    activeGrip.value = null
  }
})
</script>

<template>
  <div
    ref="gripsRef"
    v-show="isActive && columnRects.length > 0"
    :style="wrapperStyle"
  >
    <!-- Column grips: centered on top border of each column -->
    <div
      v-for="(col, i) in columnRects"
      :key="'col-' + i"
      class="absolute flex items-center justify-center"
      style="pointer-events: auto"
      :style="{
        left: `${col.left}px`,
        width: `${col.width}px`,
        top: '-8px',
        height: '16px',
      }"
    >
      <UDropdownMenu
        :items="columnMenuItems(i)"
        :modal="false"
        :content="{ align: 'center' }"
        :ui="{ content: 'min-w-36' }"
        @update:open="onColumnDropdownToggle(i, $event)"
      >
        <button
          class="flex items-center justify-center size-4 rounded border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-sm transition-colors cursor-pointer text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)]"
          :class="activeGrip?.type === 'column' && activeGrip.index === i
            ? 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text)]'
            : ''"
        >
          <UIcon
            name="i-lucide-grip-horizontal"
            class="size-3"
          />
        </button>
      </UDropdownMenu>
    </div>

    <!-- Row grips: centered on left border of each row -->
    <div
      v-for="(row, i) in rowRects"
      :key="'row-' + i"
      class="absolute flex items-center justify-center"
      style="pointer-events: auto"
      :style="{
        top: `${row.top}px`,
        height: `${row.height}px`,
        left: '-8px',
        width: '16px',
      }"
    >
      <UDropdownMenu
        :items="rowMenuItems(i)"
        :modal="false"
        :content="{ side: 'left', align: 'center' }"
        :ui="{ content: 'min-w-36' }"
        @update:open="onRowDropdownToggle(i, $event)"
      >
        <button
          class="flex items-center justify-center size-4 rounded border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-sm transition-colors cursor-pointer text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)]"
          :class="activeGrip?.type === 'row' && activeGrip.index === i
            ? 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text)]'
            : ''"
        >
          <UIcon
            name="i-lucide-grip-vertical"
            class="size-3"
          />
        </button>
      </UDropdownMenu>
    </div>
  </div>
</template>
