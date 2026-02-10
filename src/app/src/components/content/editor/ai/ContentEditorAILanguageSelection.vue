<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { CSSProperties } from 'vue'

const props = defineProps<{
  show: boolean
  rect: DOMRect | null
}>()

const emit = defineEmits<{
  submit: [language: string]
  cancel: []
}>()

const containerRef = ref<HTMLElement>()
const inputRef = ref<{ input?: HTMLInputElement }>()
const targetLanguage = ref('')

const style = computed<CSSProperties>(() => {
  if (!props.rect) {
    return {}
  }

  // Position at bottom center of selection
  const centerX = props.rect.left + props.rect.width / 2
  const bottomY = props.rect.top + props.rect.height

  // Dialog width (min-w-80 = 320px)
  const dialogWidth = 320
  const viewportWidth = window.innerWidth
  const padding = 16 // Padding from viewport edges

  // Calculate left position to keep dialog within viewport
  let left = centerX
  let transform = 'translateX(-50%)'

  // Check if dialog would overflow on the right
  const rightEdge = centerX + dialogWidth / 2
  if (rightEdge > viewportWidth - padding) {
    // Align to right edge with padding
    left = viewportWidth - padding
    transform = 'translateX(-100%)'
  }

  // Check if dialog would overflow on the left
  const leftEdge = centerX - dialogWidth / 2
  if (leftEdge < padding) {
    // Align to left edge with padding
    left = padding
    transform = 'translateX(0)'
  }

  return {
    top: `${bottomY + 10}px`,
    left: `${left}px`,
    transform,
  }
})

// Reset language and focus input when shown
watch(() => props.show, async (newShow) => {
  if (newShow) {
    targetLanguage.value = ''
    await nextTick()
    // Focus the input element
    inputRef.value?.input?.focus()
  }
})

function handleSubmit() {
  if (targetLanguage.value.trim()) {
    emit('submit', targetLanguage.value.trim())
  }
}

function handleCancel() {
  emit('cancel')
}

// Handle clicks outside
function handleClickOutside(event: MouseEvent) {
  if (!props.show || !containerRef.value) return

  const target = event.target as Node
  if (!containerRef.value.contains(target)) {
    emit('cancel')
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
    <div
      class="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg p-4 space-y-3 min-w-80"
      @mousedown.stop
    >
      <div class="space-y-1">
        <h3 class="text-sm font-semibold">
          {{ $t('studio.tiptap.ai.translateTo') }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ $t('studio.tiptap.ai.targetLanguageDescription') }}
        </p>
      </div>

      <UInput
        ref="inputRef"
        v-model="targetLanguage"
        :placeholder="$t('studio.tiptap.ai.targetLanguagePlaceholder')"
        @keydown.enter="handleSubmit"
        @keydown.esc="handleCancel"
      />

      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          @click="handleCancel"
        >
          {{ $t('studio.tiptap.ai.cancel') }}
        </UButton>
        <UButton
          color="primary"
          size="sm"
          :disabled="!targetLanguage.trim()"
          @click="handleSubmit"
        >
          {{ $t('studio.tiptap.ai.translate') }}
        </UButton>
      </div>
    </div>
  </div>
</template>
