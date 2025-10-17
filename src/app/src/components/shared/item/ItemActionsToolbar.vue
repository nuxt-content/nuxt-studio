<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { computeItemActions, oneStepActions } from '../../../utils/context'
import { useStudio } from '../../../composables/useStudio'
import type { StudioAction, StudioItemActionId as StudioItemActionIdType } from '../../../types'
import { MEDIA_EXTENSIONS } from '../../../utils/file'
import { StudioItemActionId } from '../../../types'

const { context } = useStudio()
const fileInputRef = ref<HTMLInputElement>()
const toolbarRef = ref<HTMLElement>()
const pendingActionId = ref<StudioItemActionIdType | null>(null)

const item = computed(() => context.activeTree.value.currentItem.value)
const actions = computed(() => {
  const hasPendingAction = pendingActionId.value !== null

  return computeItemActions(context.itemActions.value, item.value).map((action) => {
    const isOneStepAction = oneStepActions.includes(action.id)
    const isPending = pendingActionId.value === action.id
    const isDeleteAction = action.id === StudioItemActionId.DeleteItem

    return {
      ...action,
      color: isPending ? (isDeleteAction ? 'error' : 'secondary') : 'neutral',
      variant: isPending ? 'soft' : 'ghost',
      icon: isPending ? (isDeleteAction ? 'i-ph-x' : 'i-ph-check') : action.icon,
      tooltip: isPending ? `Click again to ${action.id.split('-')[0].toLowerCase()}` : action.tooltip,
      disabled: hasPendingAction && !isPending,
      isPending,
      isOneStepAction,
    }
  })
})

const handleFileSelection = (event: Event) => {
  const target = event.target as HTMLInputElement

  if (target.files && target.files.length > 0) {
    context.itemActionHandler[StudioItemActionId.UploadMedia]({
      parentFsPath: item.value.fsPath,
      files: Array.from(target.files),
    })
    target.value = ''
  }
}

const actionHandler = (action: StudioAction<StudioItemActionId> & { isPending?: boolean, isOneStepAction?: boolean }, event: Event) => {
  // Stop propagation to prevent click outside handler from triggering
  event.stopPropagation()

  if (action.id === StudioItemActionId.UploadMedia) {
    fileInputRef.value?.click()
    return
  }

  const targetItem = item.value

  // For two-steps actions, execute without confirmation
  if (!action.isOneStepAction) {
    if (action.id === StudioItemActionId.RenameItem) {
      // Navigate to parent since rename form is displayed in the parent tree
      context.activeTree.value.selectParentById(targetItem.id)
    }

    action.handler!(targetItem)
    return
  }

  // Second click on pending action - execute it
  if (action.isPending) {
    action.handler!(targetItem)
    pendingActionId.value = null
  }
  // Click on different action while one is pending - cancel pending state
  else if (pendingActionId.value !== null) {
    pendingActionId.value = null
  }
  // First click - enter confirmation state
  else {
    pendingActionId.value = action.id
  }
}

const handleClickOutside = () => {
  if (pendingActionId.value !== null) {
    pendingActionId.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    ref="toolbarRef"
    class="flex items-center -mr-1"
  >
    <UTooltip
      v-for="action in actions"
      :key="action.id"
      :text="action.tooltip"
    >
      <UButton
        :key="action.id"
        :icon="action.icon"
        :disabled="action.disabled"
        size="sm"
        :color="action.color"
        :variant="action.variant"
        @click="actionHandler(action, $event)"
      />
    </UTooltip>

    <input
      ref="fileInputRef"
      type="file"
      multiple
      :accept="MEDIA_EXTENSIONS.map(ext => `.${ext}`).join(', ')"
      class="hidden"
      @change="handleFileSelection"
    >
  </div>
</template>
