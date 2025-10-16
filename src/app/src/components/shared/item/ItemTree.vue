<script setup lang="ts">
import { type TreeItem, StudioFeature } from '../../../types'
import type { PropType } from 'vue'
import { useStudio } from '../../../composables/useStudio'
import { computed } from 'vue'
import MediaCard from '../../media/MediaCard.vue'
import ContentCard from '../../content/ContentCard.vue'
import MediaCardForm from '../../media/MediaCardForm.vue'
import ContentCardForm from '../../content/ContentCardForm.vue'

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
  feature: {
    type: String as PropType<StudioFeature>,
    required: true,
  },
})

const filteredTree = computed(() => {
  if (!context.actionInProgress.value?.item) return props.tree

  return props.tree.filter(item => item.id !== context.actionInProgress.value!.item?.id)
})

const cardComponent = computed(() => {
  if (props.feature === StudioFeature.Media) {
    return MediaCard
  }

  return ContentCard
})

const formComponent = computed(() => {
  if (props.feature === StudioFeature.Media) {
    return MediaCardForm
  }

  return ContentCardForm
})
</script>

<template>
  <div class="flex flex-col @container">
    <ul class="flex flex-col gap-2">
      <li v-if="showForm">
        <component
          :is="formComponent"
          :parent-item="context.activeTree.value.currentItem.value"
          :action-id="context.actionInProgress.value!.id as never"
          :renamed-item="context.actionInProgress.value!.item"
        />
      </li>
      <li
        v-for="(item, index) in filteredTree"
        :key="`${item.id}-${index}`"
      >
        <component
          :is="cardComponent"
          :item="item"
          @click="context.activeTree.value.select(item)"
        />
      </li>
    </ul>
  </div>
</template>
