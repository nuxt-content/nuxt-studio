<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useStudio } from '../composables/useStudio'
import { useAI } from '../composables/useAI'
import type { CollectionInfo } from '@nuxt/content'
import type { DatabaseItem, DraftItem } from '../types'
import { DraftStatus } from '../types'

const { host } = useStudio()
const ai = useAI()
const collections = ref<CollectionInfo[]>([])
const contextFiles = ref<Map<string, DatabaseItem>>(new Map())
const loading = ref(true)
const selectedCollection = ref<CollectionInfo | null>(null)
const selectedDraft = ref<DraftItem | null>(null)
const isAnalyzing = ref(false)

const contextFile = computed(() => {
  if (!selectedCollection.value) return null
  return contextFiles.value.get(selectedCollection.value.name)
})

// Load all collections and their context files
onMounted(async () => {
  try {
    // Get all collections except the studio collection itself
    const allCollections = host.collection.list()
    const studioCollectionName = host.meta.ai.context.collectionName

    collections.value = allCollections.filter(c => c.name !== studioCollectionName)

    for (const collection of collections.value) {
      const contextFsPath = `${host.meta.ai.context.contentFolder}/${collection.name}.md`
      const contextFile = await host.document.db.get(contextFsPath)

      if (contextFile) {
        contextFiles.value.set(collection.name, contextFile)
      }
    }
  }
  catch { /* Collections will remain empty */ }
  finally {
    loading.value = false
  }
})

async function openContextFile(collection: CollectionInfo) {
  selectedCollection.value = collection
  const contextFile = contextFiles.value.get(collection.name)

  if (contextFile) {
    // Load the draft for editing
    const contextPath = `${host.meta.ai.context.contentFolder}/${collection.name}.md`
    const draft: DraftItem = {
      fsPath: contextPath,
      status: DraftStatus.Pristine,
      original: contextFile,
      modified: contextFile,
    }
    selectedDraft.value = draft
  }
  else {
    selectedDraft.value = null
  }
}

function closeEditor() {
  selectedCollection.value = null
  selectedDraft.value = null
}

async function analyzeCollection() {
  if (!selectedCollection.value) return

  isAnalyzing.value = true
  try {
    const result = await ai.analyze(selectedCollection.value)

    // Create the context file with analyzed content
    const contextPath = `${host.meta.ai.context.contentFolder}/${selectedCollection.value.name}.md`
    await host.document.db.create(contextPath, result)

    // Refresh and load the new file
    const documents = await host.document.db.list()
    const newFile = documents.find(doc =>
      doc._path === contextPath.replace(/\.md$/, '')
      || doc.id === contextPath,
    )

    if (newFile) {
      contextFiles.value.set(selectedCollection.value.name, newFile)
      // Load it into the editor
      const draft: DraftItem = {
        fsPath: contextPath,
        status: DraftStatus.Created,
        modified: newFile,
      }
      selectedDraft.value = draft
    }
  }
  catch { /* TODO: handle error */ }
  finally {
    isAnalyzing.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between gap-2 px-4 py-1 border-b-[0.5px] border-default bg-muted/70">
      <div class="flex items-center gap-2">
        <UButton
          v-if="selectedCollection"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="closeEditor"
        />
        <UIcon
          name="i-lucide-sparkles"
          class="size-4 text-primary"
        />
        <h2 class="text-sm font-medium">
          {{ selectedCollection ? selectedCollection.name : 'AI Context' }}
        </h2>
      </div>
    </div>

    <!-- Show ContentEditor when a file is selected -->
    <ContentEditor
      v-if="selectedDraft"
      :draft-item="selectedDraft"
    />

    <!-- Show analyze button when collection is selected but no file exists -->
    <div
      v-else-if="selectedCollection && !contextFile"
      class="flex-1 flex items-center justify-center p-4"
    >
      <div class="max-w-md text-center space-y-4">
        <UIcon
          name="i-lucide-sparkles"
          class="size-12 mx-auto text-primary opacity-50"
        />
        <div>
          <h3 class="text-lg font-medium mb-2">
            No style guide
          </h3>
          <p class="text-sm text-muted mb-4">
            Generate a comprehensive AI writing guide by analyzing the content in the <strong>{{ selectedCollection.name }}</strong> collection.
          </p>
        </div>
        <UButton
          icon="i-lucide-sparkles"
          :loading="isAnalyzing"
          @click="analyzeCollection"
        >
          {{ isAnalyzing ? 'Analyzing...' : 'Analyze Collection' }}
        </UButton>
      </div>
    </div>

    <!-- Show collections list when nothing is selected -->
    <div
      v-else
      class="flex-1 overflow-y-auto p-4"
    >
      <div class="max-w-2xl mx-auto space-y-4">
        <div class="space-y-2">
          <h3 class="text-sm font-medium">
            Collection Context Files
          </h3>
          <p class="text-sm text-muted">
            Manage AI writing style guides for each collection. Each collection can have its own context file to help the AI provide better completions, formatting, and improvements to your content.
          </p>
        </div>

        <div
          v-if="loading"
          class="flex items-center justify-center py-8"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="size-5 animate-spin text-muted"
          />
        </div>

        <div
          v-else-if="collections.length === 0"
          class="p-8 text-center text-muted"
        >
          <UIcon
            name="i-lucide-folder-open"
            class="size-12 mx-auto mb-2 opacity-50"
          />
          <p>No collections found</p>
        </div>

        <div
          v-else
          class="space-y-2"
        >
          <div
            v-for="collection in collections"
            :key="collection.name"
            class="flex items-center justify-between p-4 rounded-lg border border-default hover:bg-muted/50 cursor-pointer transition-colors"
            @click="openContextFile(collection)"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="contextFiles.has(collection.name) ? 'i-lucide-file-text' : 'i-lucide-file-plus'"
                  class="size-4"
                  :class="contextFiles.has(collection.name) ? 'text-primary' : 'text-muted'"
                />
                <h4 class="text-sm font-medium">
                  {{ collection.name }}
                </h4>
                <UBadge
                  v-if="collection.type"
                  size="xs"
                  variant="subtle"
                >
                  {{ collection.type }}
                </UBadge>
              </div>
              <p class="text-xs text-muted mt-1">
                {{ contextFiles.has(collection.name) ? collection.name + '.md' : 'Missing style guide' }}
              </p>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-4 text-muted"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
