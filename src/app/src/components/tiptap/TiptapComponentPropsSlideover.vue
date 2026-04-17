<script setup lang="ts">
import { computed } from 'vue'
import type { DialogContentProps } from 'reka-ui'
import { useSidebar } from '../../composables/useSidebar'

defineProps<{
  /** Shown in the slideover header when set (Nuxt UI `title` prop). */
  title?: string
}>()

const { sidebarStyle } = useSidebar()

const open = defineModel<boolean>('open', { default: false })

/** DialogContent accepts inline `style` at runtime; reka-ui types omit it. */
const slideoverContent = computed(() => ({ style: sidebarStyle.value }) as DialogContentProps)
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="title"
    side="left"
    :modal="false"
    :content="slideoverContent"
    :ui="{
      content: 'p-0 max-w-none',
      body: 'flex flex-col min-h-0 flex-1 overflow-hidden p-0 sm:p-0',
    }"
  >
    <slot />

    <template #body>
      <slot name="body" />
    </template>

    <template
      v-if="$slots.footer"
      #footer
    >
      <slot name="footer" />
    </template>
  </USlideover>
</template>
