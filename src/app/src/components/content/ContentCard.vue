<script setup lang="ts">
import type { TreeItem } from '../../types'
import type { PropType } from 'vue'
import { computed } from 'vue'
import { getFileIcon } from '../../utils/file'

const props = defineProps({
  item: {
    type: Object as PropType<TreeItem>,
    required: true,
  },
})

const itemExtensionIcon = computed(() => getFileIcon(props.item.fsPath))
</script>

<template>
  <ItemCard :item="item">
    <template #thumbnail>
      <div class="w-full h-full flex items-center justify-center">
        <UIcon
          :name="itemExtensionIcon"
          class="w-6 h-6 text-muted"
        />
      </div>
    </template>
  </ItemCard>
</template>
