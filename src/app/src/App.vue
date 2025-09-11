<script setup lang="ts">
// watch is handled in useStudio composable
// import PreviewEditor from './components/PreviewEditor.vue'
// import ContentsListModal from './components/ContentsListModal.vue'
import { useStudio } from './composables/useStudio'
import PanelContent from './components/panel/content/PanelContent.vue'
import PanelMedia from './components/panel/PanelMedia.vue'
import PanelConfig from './components/panel/PanelConfig.vue'
import { useSidebar } from './composables/useSidebar'
import { watch } from 'vue'
// import CommitPreviewModal from './components/CommitPreviewModal.vue'

const { sidebarWidth } = useSidebar()
const { ui, host, isReady } = useStudio()

watch(sidebarWidth, () => {
  if (ui.isPanelOpen.value) {
    host.ui.updateStyles()
  }
})
// const activeDocuments = ref<{ id: string, label: string, value: string }[]>([])

// const selectedContentId = ref<string | null>(null)
// const selectedContent = ref<any | null>(null)

// const contentItems = computed(() => {
//   const items = []
//   if (activeDocuments.value.length > 0) {
//     items.unshift(
//       activeDocuments.value,
//     )
//   }

//   if (draft.list.value.length > 0) {
//     items.push([
//       {
//         label: `Drafts (${draft.list.value.length})`,
//         children: draft.list.value.map((draft) => {
//           return {
//             label: draft.id,
//             value: draft.id,
//             onSelect: () => {
//               onContentSelect(draft.id)
//             },
//           }
//         }),
//       },
//     ])
//   }

//   items.push([{
//     id: 'show-all-contents',
//     label: 'Show all contents',
//     value: 'show-all-contents',
//     onSelect: () => {
//       studio.ui.contentsListVisibility = true
//     },
//   }])

//   return items
// })

// async function onContentSelect(id: string) {
//   selectedContentId.value = id
//   selectedContent.value = await host.document.get(id)
// }

// function onEditorUpdate(content: any) {
//   draft.upsert(selectedContentId.value!, content)
// }
// function onRevert() {
//   draft.revert(selectedContentId.value!)
// }

// function detectActiveDocuments() {
//   activeDocuments.value = host.document.detectActives().map((content) => {
//     return {
//       id: content.id,
//       label: content.title,
//       value: content.id,
//       onSelect: () => {
//         onContentSelect(content.id)
//       },
//     }
//   })
// }

// host.on.mounted(() => {
//   detectActiveDocuments()
//   host.on.routeChange(() => {
//     setTimeout(() => {
//       detectActiveDocuments()
//     }, 100)
//   })
// })
</script>

<template>
  <Suspense>
    <UApp
      v-if="isReady"
      :toaster="{ portal: false }"
    >
      <PanelBase v-model="ui.isPanelOpen.value">
        <PanelContent v-if="ui.panels.content" />
        <PanelMedia v-else-if="ui.panels.media" />
        <PanelConfig v-else-if="ui.panels.config" />
      </PanelBase>

      <!-- Floating Files Panel Toggle -->
      <UButton
        v-if="!ui.isPanelOpen.value"
        icon="i-lucide-panel-left-open"
        size="lg"
        color="primary"
        class="fixed bottom-4 left-4 z-50 shadow-lg"
        @click="ui.panels.content = true"
      />

      <!-- <PreviewEditor
        v-model="studio.ui.displayEditor"
      /> -->
      <!-- <CommitPreviewModal
        v-model="studio.ui.commitPreviewVisibility"
      />
      <ContentsListModal
        v-model="studio.ui.contentsListVisibility"
        @update:content="onEditorUpdate"
        @select="onContentSelect"
      /> -->
    </UApp>
  </Suspense>
  <!-- </div> -->
</template>
