<script setup lang="ts">
import type { DraftStatus } from '../../../utils/draft'
import { COLOR_STATUS_MAP } from '../../../utils/draft'
import type { PropType } from 'vue'

defineProps({
  status: {
    type: String as PropType<DraftStatus>,
    required: true,
  },
})
</script>

<template>
  <UBadge :color="COLOR_STATUS_MAP[status]">
    {{ status }}
  </UBadge>
</template>
