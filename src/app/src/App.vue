<script setup lang="ts">
import { useStudio } from './composables/useStudio'
import PanelContent from './components/panel/content/PanelContent.vue'
import PanelMedia from './components/panel/PanelMedia.vue'
import PanelConfig from './components/panel/PanelConfig.vue'
import { useSidebar } from './composables/useSidebar'
import { watch, ref } from 'vue'
import { StudioFeature } from './types'

const { sidebarWidth } = useSidebar()
const { ui, host, isReady, tree } = useStudio()
watch(sidebarWidth, () => {
  if (ui.isPanelOpen.value) {
    host.ui.updateStyles()
  }
})
const activeDocuments = ref<{ id: string, title: string }[]>([])

function detectActiveDocuments() {
  activeDocuments.value = host.document.detectActives().map((content) => {
    return {
      id: content.id,
      title: content.title,
    }
  })
}

function onContentSelect(id: string) {
  tree.selectItemById(id)
  ui.openPanel(StudioFeature.Content)
}

host.on.mounted(() => {
  detectActiveDocuments()
  host.on.routeChange(() => {
    setTimeout(() => {
      detectActiveDocuments()
    }, 100)
  })
})
</script>

<template>
  <Suspense>
    <UApp
      v-if="isReady"
      :toaster="{ portal: false }"
    >
      <PanelBase v-model="ui.isPanelOpen.value">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <ItemBreadcrumb
              :current-item="tree.currentItem.value"
              :tree="tree.root.value"
            />
            <ItemActionsToolbar
              :item="tree.currentItem.value"
            />
          </div>
        </template>

        <PanelContent v-if="ui.panels.content" />
        <PanelMedia v-else-if="ui.panels.media" />
        <PanelConfig v-else-if="ui.panels.config" />
      </PanelBase>

      <!-- Floating Files Panel Toggle -->
      <div v-if="!ui.isPanelOpen.value" class="fixed bottom-4 left-4 z-50 shadow-lg flex gap-2">
        <UButton
          icon="i-lucide-panel-left-open"
          size="lg"
          color="primary"
          class="shadow-lg"
          @click="ui.panels.content = true"
        />
        <UButton
          v-if="activeDocuments.length === 1"
          icon="i-lucide-file-text"
          size="lg"
          color="secondary"
          label="Edit This Page"
          class="shadow-lg"
          @click="onContentSelect(activeDocuments[0].id)"
        />
      </div>
    </UApp>
  </Suspense>
</template>
