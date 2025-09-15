<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui/components/Breadcrumb.vue.d.ts'
import { computed, type PropType, unref } from 'vue'
import type { TreeItem } from '../../../types'
import { useStudio } from '../../../composables/useStudio'
import { upperFirst } from 'scule'
import { findParentFromId } from '../../../utils/tree'

const { tree: treeApi, context } = useStudio()

const props = defineProps({
  currentItem: {
    type: Object as PropType<TreeItem | null>,
    default: null,
  },
  tree: {
    type: Array as PropType<TreeItem[]>,
    default: () => [],
  },
})

const items = computed<BreadcrumbItem[]>(() => {
  const rootItem = {
    label: upperFirst(context.feature.value as string),
    onClick: () => {
      treeApi.selectItem(null)
    },
  }

  if (!props.currentItem) {
    return [rootItem]
  }

  const breadcrumbItems: BreadcrumbItem[] = []

  let currentTreeItem: TreeItem | null = unref(props.currentItem)
  while (currentTreeItem) {
    const itemToSelect = currentTreeItem
    breadcrumbItems.unshift({
      label: currentTreeItem.name,
      onClick: () => {
        treeApi.selectItem(itemToSelect)
      },
    })

    currentTreeItem = findParentFromId(props.tree, currentTreeItem.id)
  }

  return [
    rootItem,
    ...breadcrumbItems,
  ]
})
</script>

<template>
  <UBreadcrumb :items="items">
    <template #dropdown="{ item }">
      <UDropdownMenu :items="item.children">
        <UButton
          :icon="item.icon"
          color="neutral"
          variant="link"
          class="p-0.5"
        />
      </UDropdownMenu>
    </template>
  </UBreadcrumb>
</template>
