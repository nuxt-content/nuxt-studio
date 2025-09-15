<script setup lang="ts">
import type { TreeItem } from '../../../types'
import type { PropType } from 'vue'
import { computed } from 'vue'
import { Image } from '@unpic/vue'
import { titleCase } from 'scule'
import { COLOR_STATUS_MAP } from '../../../utils/draft'

const props = defineProps({
  file: {
    type: Object as PropType<TreeItem>,
    required: true,
  },
  // ongoingFileAction: {
  //   type: Object as PropType<FileAction>,
  //   default: null,
  // },
})

const isFolder = computed(() => props.file.type === 'directory')
const name = computed(() => titleCase(props.file.name))

const fileExtensionIcon = computed(() => {
  const ext = props.file.id.split('.').pop()?.toLowerCase() || ''
  return {
    md: 'i-ph-markdown-logo',
    yaml: 'i-fluent-document-yml-20-regular',
    yml: 'i-fluent-document-yml-20-regular',
    json: 'i-lucide-file-json',
  }[ext] || 'i-mdi-file'
})

const statusRingColor = computed(() => props.file.status ? `ring-${COLOR_STATUS_MAP[props.file.status]}-200 hover:ring-${COLOR_STATUS_MAP[props.file.status]}-300 hover:dark:ring-${COLOR_STATUS_MAP[props.file.status]}-700` : 'ring-gray-200 hover:ring-gray-300 hover:dark:ring-gray-700')
</script>

<template>
  <UPageCard
    reverse
    class="cursor-pointer hover:bg-white relative w-full min-w-0"
    :class="statusRingColor"
  >
    <div
      v-if="file.type === 'file'"
      class="relative"
    >
      <Image
        src="https://placehold.co/1920x1080/f9fafc/f9fafc"
        width="426"
        height="240"
        alt="Card placeholder"
        class="z-[-1] rounded-t-lg"
      />
      <div class="absolute inset-0 flex items-center justify-center">
        <UIcon
          :name="fileExtensionIcon"
          class="w-8 h-8 text-gray-400 dark:text-gray-500"
        />
      </div>
    </div>

    <template #body>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-1 min-w-0">
          <UIcon
            v-if="isFolder"
            name="i-lucide-folder"
            class="h-4 w-4"
          />
          <UIcon
            v-else-if="name === 'home'"
            name="i-lucide-house"
            class="h-4 w-4"
          />
          <h3
            class="text-sm font-semibold truncate"
            :class="props.file.status === 'deleted' && 'line-through'"
          >
            {{ name }}
          </h3>
        </div>
        <FileBadge
          v-if="file.status"
          :status="file.status"
        />
        <!-- <UDropdown
          v-if="!readOnly && isFolder"
          class="hidden group-hover:block"
          :items="actionItems"
          :popper="{ strategy: 'absolute' }"
          @click="$event.stopPropagation()"
        >
          <UButton
            color="gray"
            variant="ghost"
            aria-label="Open items"
            icon="i-ph-dots-three-vertical"
            square
          />
        </UDropdown> -->
        <!-- <FileBadge
          v-if="file.status"
          :status="file.status"
        /> -->
      </div>

      <UTooltip :text="file.path">
        <span class="truncate leading-relaxed text-xs text-gray-400 dark:text-gray-500 block w-full">
          {{ file.pagePath || file.path }}
        </span>
      </UTooltip>
    </template>
  </UPageCard>
</template>
