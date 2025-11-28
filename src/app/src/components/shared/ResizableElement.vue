<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  minHeight?: number
  maxHeight?: number
  initialHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  minHeight: 100,
  maxHeight: 600,
  initialHeight: 200,
})

const height = ref(props.initialHeight)
const isResizing = ref(false)
const resizeStartY = ref(0)
const resizeStartHeight = ref(0)

function startResize(event: MouseEvent) {
  event.preventDefault()
  isResizing.value = true
  resizeStartY.value = event.clientY
  resizeStartHeight.value = height.value
}

function handleMouseMove(event: MouseEvent) {
  if (!isResizing.value) return

  event.preventDefault()
  const deltaY = event.clientY - resizeStartY.value
  const newHeight = resizeStartHeight.value + deltaY

  height.value = Math.min(props.maxHeight, Math.max(props.minHeight, newHeight))
}

function handleMouseUp() {
  if (!isResizing.value) return
  isResizing.value = false
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div
    class="relative"
    :style="{ height: `${height}px` }"
  >
    <slot />

    <div
      class="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize bg-transparent hover:bg-accented transition-colors duration-200 group"
      :class="{ 'bg-accented': isResizing }"
      @mousedown="startResize"
    >
      <div
        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-8 bg-inverted rounded-t opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        :class="{ 'opacity-100': isResizing }"
      />
    </div>
  </div>
</template>
