<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
})

const copied = ref(false)

async function handleCopy() {
  if (!props.content) return

  await navigator.clipboard.writeText(props.content)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <UTooltip :text="copied ? 'Copied to clipboard' : 'Copy to clipboard'">
    <UButton
      :icon="copied ? 'i-lucide-clipboard-check' : 'i-lucide-clipboard'"
      variant="ghost"
      size="xs"
      :disabled="copied"
      @click="handleCopy"
    />
  </UTooltip>
</template>
