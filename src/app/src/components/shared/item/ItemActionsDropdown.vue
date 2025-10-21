<script setup lang="ts">
import { computeItemActions, oneStepActions } from '../../../utils/context'
import { computed, ref, watch, type PropType } from 'vue'
import { StudioItemActionId } from '../../../types'
import type { StudioItemActionId as StudioItemActionIdType, TreeItem } from '../../../types'
import { useStudio } from '../../../composables/useStudio'
import type { DropdownMenuItem } from '@nuxt/ui/runtime/components/DropdownMenu.vue.js'

const { context } = useStudio()

const props = defineProps({
  item: {
    type: Object as PropType<TreeItem>,
    required: true,
  },
})

const isOpen = ref(false)
const pendingActionId = ref<StudioItemActionIdType | null>(null)

// Reset pending action when menu closes
watch(isOpen, (newValue) => {
  if (!newValue) {
    setTimeout(() => {
      pendingActionId.value = null
    }, 300)
  }
})

const actions = computed<DropdownMenuItem[]>(() => {
  const hasPendingAction = pendingActionId.value !== null

  return computeItemActions(context.itemActions.value, props.item).map((action) => {
    const isOneStepAction = oneStepActions.includes(action.id)
    const isPending = pendingActionId.value === action.id
    const isDeleteAction = action.id === StudioItemActionId.DeleteItem

    return {
      ...action,
      icon: isPending ? (isDeleteAction ? 'i-ph-x' : 'i-ph-check') : action.icon,
      color: isPending ? (isDeleteAction ? 'error' : 'secondary') : 'neutral',
      slot: isPending ? 'pending-action' : undefined,
      disabled: hasPendingAction && !isPending,
      onSelect: (e: Event) => {
        // For two-step actions, execute it without confirmation
        if (!isOneStepAction) {
          if (props.item.type === 'directory' && [StudioItemActionId.CreateDocument, StudioItemActionId.CreateDocumentFolder, StudioItemActionId.CreateMediaFolder].includes(action.id)) {
            // Navigate into folder before adding form creation
            context.activeTree.value.selectItemById(props.item.id)
          }

          action.handler!(props.item)
          return
        }

        // Second click on pending action - execute it
        if (isPending) {
          action.handler!(props.item)
          pendingActionId.value = null
        }
        // Click on different action while one is pending - cancel pending state
        else if (pendingActionId.value !== null) {
          e.preventDefault()
          pendingActionId.value = null
        }
        // First click - enter confirmation state
        else {
          e.preventDefault()
          pendingActionId.value = action.id
        }
      },
    }
  })
})

const pendingActionLabel = computed(() => {
  return `Click again to ${pendingActionId.value?.split('-')[0]}`
})
</script>

<template>
  <UDropdownMenu
    v-model:open="isOpen"
    :items="actions"
    :content="{ side: 'bottom' }"
    :ui="{ content: 'w-42' }"
    size="xs"
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

    <template #pending-action-label>
      <UTooltip :text="pendingActionLabel">
        <span class="truncate">{{ pendingActionLabel }}</span>
      </UTooltip>
    </template>
  </UDropdownMenu>
</template>
