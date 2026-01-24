<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const props = defineProps<{
  show: boolean
  rect: DOMRect | null
}>()

const emit = defineEmits<{
  accept: []
  decline: []
}>()

const style = computed<CSSProperties>(() => {
  if (!props.rect) {
    return {}
  }

  // Position at bottom center of selection
  const centerX = props.rect.left + props.rect.width / 2
  const bottomY = props.rect.top + props.rect.height

  return {
    top: `${bottomY + 10}px`,
    left: `${centerX}px`,
    transform: 'translateX(-50%)',
  }
})
</script>

<template>
  <div
    v-if="show"
    :style="style"
    class="fixed z-1000 flex items-center gap-0.5 rounded-md border border-muted bg-white p-0.5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
  >
    <UButton
      color="neutral"
      variant="ghost"
      label="Decline"
      size="xs"
      icon="i-lucide-x"
      @click="emit('decline')"
    />
    <UButton
      color="neutral"
      variant="solid"
      label="Accept"
      size="xs"
      icon="i-lucide-check"
      @click="emit('accept')"
    />
  </div>
</template>
