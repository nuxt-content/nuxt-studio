<template>
  <div class="flex">
    <UDashboardSidebar
      id="default"
      :ui="{ footer: 'lg:border-t lg:border-default', body: '!p-0' }"
    >
      <UNavigationMenu
        orientation="vertical"
        :items="changedFileLinks"
        :ui="{ list: 'px-3 py-3' }"
      />
    </UDashboardSidebar>

    <div class="relative flex-1">
      <ContentDiffView
        v-if="selectedDraft"
        :key="selectedDraft.path"
        :original="selectedDraft.original"
        :modified="selectedDraft.markdown"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import ContentDiffView from './ContentDiffView.vue'
import type { ReviewFile } from '../types'

const props = defineProps({
  selectedFile: {
    type: Object,
    default: null,
  },
  changedFiles: {
    type: Array as PropType<Array<ReviewFile>>,
    required: true,
  },
  dbFiles: {
    type: Array, // as PropType<File[]>,
    required: true,
  },
})

const emit = defineEmits(['edit', 'revert'])

//   const { project } = useProjects()
//   const { selectFile } = useProjectChanges(project.value)
//   const { selectFile: selectProjectFile } = useProjectFiles(project.value)

//   onMounted(() => selectFile(props.changedFiles[0] as TreeFile & TreeMedia & ConfigFile))

//   watch(() => props.changedFiles, () => {
//     if (props.changedFiles?.length) {
//       selectFile(props.changedFiles[0])
//     }
//     else {
//       // reset selected file
//       selectProjectFile(null)
//       navigateTo({ name: 'team-project-content' })
//     }
//   })

const selectedDraft = ref<ReviewFile | null>(null)

function selectDraft(draft: ReviewFile) {
  selectedDraft.value = draft
}

const changedFileLinks = computed(() => {
  return props.changedFiles.map(file => ({
    id: file.path,
    label: file.path,
    icon: 'i-lucide-file-text',
    class: file.deleted ? 'text-red-500' : (file.gitFile ? 'text-orange-500' : 'text-green-500'),
    // active: draft.id === props.selectedFile?.path,
    // status: 'draft.status',
    // type: 'file',// (draft as TreeFile | TreeMedia).type || 'config',
    onSelect: () => selectDraft(file),
  } as NavigationMenuItem))
})
</script>
