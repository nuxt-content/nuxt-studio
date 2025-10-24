<script setup lang="ts">
import type { DraftItem, MediaItem } from '../../types'
import type { PropType } from 'vue'
import { DraftStatus } from '../../types'

defineProps({
  draftItem: {
    type: Object as PropType<DraftItem<MediaItem>>,
    required: true,
  },
})
</script>

<template>
  <ItemCardReview :draft-item="draftItem">
    <template #open>
      <img
        :src="draftItem.modified?.routePath as string"
        :class="{ 'opacity-50': draftItem.status === DraftStatus.Deleted }"
      >
    </template>
  </ItemCardReview>
</template>
