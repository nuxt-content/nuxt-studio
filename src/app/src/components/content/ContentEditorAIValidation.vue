<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { CSSProperties } from 'vue'

const props = defineProps<{
  show: boolean
  rect: DOMRect | null
}>()

const emit = defineEmits<{
  accept: []
  decline: []
}>()

const containerRef = ref<HTMLElement>()
const clickCount = ref(0)

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

// Reset click count when buttons are shown
watch(() => props.show, (newShow) => {
  if (newShow) {
    clickCount.value = 0
  }
})

// Handle clicks outside the buttons
function handleClickOutside(event: MouseEvent) {
  if (!props.show || !containerRef.value) return

  const target = event.target as Node
  if (!containerRef.value.contains(target)) {
    clickCount.value++

    // Decline on second click outside
    if (clickCount.value >= 2) {
      emit('decline')
    }
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div
    v-if="show"
    ref="containerRef"
    :style="style"
    class="fixed z-1000"
  >
    <UFieldGroup class="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm p-0.5">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-x"
        @click="emit('decline')"
      />
      <UButton
        color="primary"
        variant="solid"
        size="sm"
        icon="i-lucide-check"
        @click="emit('accept')"
      />
    </UFieldGroup>
  </div>
</template>
