<script setup lang="ts">
import type { DraftItem, MediaItem } from '../../types'
import type { PropType } from 'vue'

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
      <MediaEditor
        :media-item="draftItem.modified || draftItem.original!"
        :status="draftItem.status"
      />
    </template>
  </ItemCardReview>
</template>
