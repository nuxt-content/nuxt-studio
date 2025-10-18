<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { useStudio } from '../../composables/useStudio'

const router = useRouter()
const route = useRoute()
const { context } = useStudio()

const items = [
  {
    label: 'Content',
    value: 'content',
    to: '/content',
  },
  {
    label: 'Media',
    value: 'media',
    to: '/media',
  },
]

const current = computed({
  get: () => route.name as string,
  set: (name: string) => router.push({ name }),
})
</script>

<template>
  <div class="w-full flex items-center justify-between gap-2">
    <UTabs
      v-model="current"
      :content="false"
      :items="items"
      variant="link"
      size="md"
      color="neutral"
      :ui="{ trigger: 'py-1 px-2', list: 'py-2 px-0' }"
    />

    <UButton
      label="Review"
      color="neutral"
      variant="solid"
      :disabled="context.draftCount.value === 0"
      to="/review"
      class="w-20"
    >
      <div class="flex items-center gap-2">
        <span class="w-10">
          Review
        </span>
        <UBadge
          v-if="context.draftCount.value > 0"
          :label="context.draftCount.value.toString()"
          class="bg-[var(--ui-color-neutral-400)]"
          size="xs"
          variant="soft"
        />
        <UIcon
          v-else
          name="i-lucide-eye"
          class="w-3 h-3"
        />
      </div>
    </UButton>
  </div>
</template>
