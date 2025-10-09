<script setup lang="ts">
import type { TreeItem } from '../../../types'
import type { PropType } from 'vue'
import { useStudio } from '../../../composables/useStudio'
import { computed } from 'vue'

const { context } = useStudio()

const props = defineProps({
  tree: {
    type: Array as PropType<TreeItem[]>,
    default: () => [],
  },
  showForm: {
    type: Boolean,
    default: false,
  },
})

const filteredTree = computed(() => {
  if (!context.actionInProgress.value?.item) return props.tree

  return props.tree.filter(item => item.id !== context.actionInProgress.value!.item?.id)
})
</script>

<template>
  <div class="flex flex-col @container">
    <ul class="flex flex-col gap-2">
      <li v-if="showForm">
        <ItemCardFileForm
          :parent-item="context.activeTree.value.currentItem.value"
          :action-id="context.actionInProgress.value!.id as never"
          :renamed-item="context.actionInProgress.value!.item"
        />
      </li>
      <li
        v-for="(item, index) in filteredTree"
        :key="`${item.id}-${index}`"
      >
        <ItemCardFile
          :item="item"
          @click="context.activeTree.value.select(item)"
        />
      </li>
    </ul>
  </div>
</template>
