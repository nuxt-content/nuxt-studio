<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
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
const targetLanguage = ref('')

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

// Reset language when shown
watch(() => props.show, (newShow) => {
  if (newShow) {
    targetLanguage.value = ''
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
    <div class="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg p-4 space-y-3 min-w-80">
      <div class="space-y-1">
        <h3 class="text-sm font-semibold">
          {{ $t('studio.tiptap.ai.translateTo') }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ $t('studio.tiptap.ai.targetLanguageDescription') }}
        </p>
      </div>

      <UInput
        v-model="targetLanguage"
        :placeholder="$t('studio.tiptap.ai.targetLanguagePlaceholder')"
        autofocus
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
