<script setup lang="ts">
import { computeActionItems } from '../../../utils/context'

defineProps({
  item: {
    type: Object as PropType<TreeItem>,
    required: true,
  },
})
</script>

<template>
  <UDropdownMenu
    :items="computeActionItems(item)"
    :content="{ side: 'bottom' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-ph-dots-three-vertical"
      aria-label="Open actions"
      square
      size="sm"
      class="cursor-pointer"
      @click="$event.stopPropagation()"
    />
  </UDropdownMenu>
</template>
