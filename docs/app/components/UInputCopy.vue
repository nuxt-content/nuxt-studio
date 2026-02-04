<script setup lang="ts">
const { value, size = 'lg' } = defineProps<{
  value: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>()

const copied = ref(false)

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div class="relative">
    <UInput
      :model-value="value"
      :size="size"
      readonly
      :ui="{ trailing: 'pe-1.5', root: 'w-[320px]' }"
    >
      <template #trailing>
        <UIcon
          :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          class="size-4 me-1"
          :class="copied ? 'text-success' : 'text-muted'"
          aria-hidden="true"
        />
      </template>
    </UInput>
    <button
      type="button"
      class="absolute inset-0 size-full bg-transparent border-0 focus-visible:ring-2 focus-visible:ring-primary rounded-md"
      :class="[copied ? 'cursor-default' : 'cursor-copy']"
      :aria-label="copied ? 'Copied to clipboard' : 'Copy to clipboard'"
      @click="copy(value)"
    />
  </div>
</template>
