<script setup lang="ts">
import { COLOR_UI_STATUS_MAP } from '../../../utils/draft'
import type { DraftStatus } from '../../../types/draft'
import type { PropType } from 'vue'

defineProps({
  status: {
    type: String as PropType<DraftStatus>,
    required: true,
  },
})
</script>

<template>
  <UBadge
    :color="COLOR_UI_STATUS_MAP[status]"
    :label="status"
    variant="soft"
  />
</template>
