<script setup lang="ts">
import { type TreeItem, StudioFeature, StudioItemActionId } from '../../../types'
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

const showCreationForm = computed(() => props.showForm && context.actionInProgress.value?.id !== StudioItemActionId.RenameItem)

const visibleTree = computed(() => props.tree.filter(item => !item.hide))

const cardComponent = computed(() => {
  if (props.feature === StudioFeature.Media) {
    return MediaCard
  }

  return ContentCard
})

const isItemBeingRenamed = (item: TreeItem) => {
  if (context.actionInProgress.value?.id !== StudioItemActionId.RenameItem) return false

  return context.actionInProgress.value?.item?.fsPath === item.fsPath
}

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
      <li v-if="showCreationForm">
        <component
          :is="formComponent"
          :parent-item="context.activeTree.value.currentItem.value"
          :action-id="context.actionInProgress.value!.id as never"
        />
      </li>
      <li
        v-for="(item, index) in visibleTree"
        :key="`${item.fsPath}-${index}`"
      >
        <component
          :is="cardComponent"
          :item="item"
          :show-rename-form="isItemBeingRenamed(item)"
          @click="context.activeTree.value.select(item)"
        />
      </li>
    </ul>
  </div>
</template>
