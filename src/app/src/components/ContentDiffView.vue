<template>
  <div
    ref="target"
    class="w-full h-full"
    :class="isDiff ? '-mx-4' : 'py-4'"
  />

  <UButtonGroup
    v-if="isDiff && !isMobile"
    class="absolute bottom-4 left-16"
  >
    <UButton
      :class="studioDiffMode === 'split' ? '!bg-gray-200 dark:!bg-gray-950' : 'dark:hover:!bg-gray-900'"
      color="neutral"
      icon="i-ph-text-columns"
      aria-label="Split"
      @click="studioDiffMode = 'split'"
    />
    <UButton
      :class="studioDiffMode === 'unified' ? '!bg-gray-200 dark:!bg-gray-950' : 'dark:hover:!bg-gray-900'"
      color="neutral"
      icon="i-ph-text-align-justify"
      aria-label="Unified"
      @click="studioDiffMode = 'unified'"
    />
  </UButtonGroup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMonacoDiff } from '../composables/useMonacoDiff'
import { useMonacoMinimal } from '../composables/useMonacoMinimal'

const props = defineProps({
  original: {
    type: String,
    required: true,
  },
  modified: {
    type: String,
    required: true,
  },
})

// const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = ref(false)// breakpoints.smaller('md')

const target = ref()

const isDiff = computed(() => props.original !== props.modified)
const studioDiffMode = ref('split')

const language = computed(() => {
  return 'mdc'
})

if (isDiff.value) {
  const { setOptions } = useMonacoDiff(target, {
    original: props.original,
    modified: props.modified,
    language: language.value,
    renderSideBySide: isMobile.value ? false : studioDiffMode.value === 'split',
  })

  watch([isMobile, studioDiffMode], () => {
    setOptions({ renderSideBySide: isMobile.value ? false : studioDiffMode.value === 'split' })
  })
}
else {
  useMonacoMinimal(target, {
    code: props.modified,
    language: language.value,
    readOnly: true,
  })
}
</script>
