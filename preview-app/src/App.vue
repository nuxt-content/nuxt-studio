<script setup lang="ts">
import { ref, watch, computed, reactive } from 'vue'
import PreviewEditor from './components/PreviewEditor.vue'
import ContentsListModal from './components/ContentsListModal.vue'
import { usePreview } from './composables/usePreview'
import PreviewToolbar from './components/PreviewToolbar.vue'
// import CommitPreviewModal from './components/CommitPreviewModal.vue'

const { host, draftFiles } = usePreview()

const activeContents = ref<{ id: string, label: string, value: string }[]>([])

const selectedContentId = ref<string | null>(null)
const selectedContent = ref<any | null>(null)

const ui = reactive({
  editorVisibility: false,
  commitPreviewVisibility: false,
  contentsListVisibility: false,
})

const contentItems = computed(() => {
  const items = []
  if (activeContents.value.length > 0) {
    items.unshift(
      activeContents.value,
    )
  }

  if (draftFiles.value.length > 0) {
    items.push([
      {
        label: `Drafts (${draftFiles.value.length})`,
        children: draftFiles.value.map((draft) => {
          return {
            label: draft.id,
            value: draft.id,
            onSelect: () => {
              onContentSelect(draft.id)
            },
          }
        }),
      },
    ])
  }

  items.push([{
    id: 'show-all-contents',
    label: 'Show all contents',
    value: 'show-all-contents',
    onSelect: () => {
      ui.contentsListVisibility = true
    },
  }])

  return items
})

const isLeftSidebarOpen = computed(() => {
  return ui.editorVisibility
})

watch(isLeftSidebarOpen, (value) => {
  if (value) {
    host.ui.pushBodyToLeft()
  }
  else {
    host.ui.pullBodyToRight()
  }
})

async function onContentSelect(id: string) {
  selectedContentId.value = id
  selectedContent.value = await host.content.getDocumentById(id)
  ui.editorVisibility = true
}
function onEditorUpdate(content: any) {
  draftFiles.upsert(selectedContentId.value!, content)
}
function onRevert() {
  draftFiles.revert(selectedContentId.value!)
}

function detectRenderedContents() {
  activeContents.value = host.detectRenderedContents().map((content) => {
    return {
      id: content.id,
      label: content.title,
      value: content.id,
      onSelect: () => {
        onContentSelect(content.id)
      },
    }
  })
}

host.onMounted(() => {
  detectRenderedContents()
  const router = (host.nuxtApp as any).$router
  router?.afterEach?.(() => {
    setTimeout(() => {
      detectRenderedContents()
    }, 100)
  })
})
</script>

<template>
  <Suspense>
    <UApp :toaster="{ portal: false }">
      <div
        id="root"
        class="dark"
      >
        <div>
          <PreviewToolbar>
            <template #left>
              <UDropdownMenu
                :portal="false"
                :items="contentItems"
                placeholder="Select a content"
              >
                <UButton
                  label="Contents"
                  icon="i-ph-list"
                  color="neutral"
                  variant="ghost"
                />
              </UDropdownMenu>
            </template>
            <template #right>
              <UButton
                label="Save Changes"
                color="primary"
                variant="solid"
                :disabled="!draftFiles.list.value.length"
                @click="ui.commitPreviewVisibility = true"
              />
            </template>
          </PreviewToolbar>

          <PreviewEditor
            v-model="ui.editorVisibility"
            :content="selectedContent"
            :markdown="'selectedContent.markdown'"
            @update:content="onEditorUpdate"
            @revert="onRevert"
          />
          <CommitPreviewModal
            v-model="ui.commitPreviewVisibility"
          />
          <ContentsListModal
            v-model="ui.contentsListVisibility"
            @update:content="onEditorUpdate"
            @select="onContentSelect"
          />
        </div>
      </div>
    </UApp>
  </Suspense>
  <!-- </div> -->
</template>
