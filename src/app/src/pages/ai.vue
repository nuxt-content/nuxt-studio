<script setup lang="ts">
import { ref } from 'vue'
import { useAI } from '../composables/useAI'
import { useStudio } from '../composables/useStudio'

const { completion, analyze, enabled } = useAI()
const { host } = useStudio()
const isAnalyzing = ref(false)
const error = ref('')
const selectedCollection = ref<string | undefined>(undefined)

const collectionOptions = [
  { label: 'Documentation', value: 'docs' },
  { label: 'Blog', value: 'blog' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Other', value: 'other' },
]

async function analyzeContent() {
  if (!selectedCollection.value) {
    error.value = 'Please select a collection'
    return
  }

  isAnalyzing.value = true
  error.value = ''
  completion.value = ''

  try {
    // Get all documents to extract collection info
    const documents = await host.document.db.list()

    // Find a document from the selected collection to get CollectionInfo
    const sampleDoc = documents.find(doc => doc._collection === selectedCollection.value)

    if (!sampleDoc) {
      throw new Error(`No documents found in collection: ${selectedCollection.value}`)
    }

    // Get collection info from the host
    const collectionInfo = host.collection.getByFsPath(sampleDoc.id)

    if (!collectionInfo) {
      throw new Error(`Collection info not found for: ${selectedCollection.value}`)
    }

    await analyze(collectionInfo)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to analyze content'
    console.error('Analysis error:', err)
  }
  finally {
    isAnalyzing.value = false
  }
}

function copyToClipboard() {
  if (typeof window !== 'undefined' && window.navigator?.clipboard) {
    window.navigator.clipboard.writeText(completion.value)
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between gap-2 px-4 py-1 border-b-[0.5px] border-default bg-muted/70">
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-sparkles"
          class="size-4 text-primary"
        />
        <h2 class="text-sm font-medium">
          AI Context
        </h2>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div class="max-w-2xl mx-auto space-y-4">
        <div class="space-y-2">
          <h3 class="text-sm font-medium">
            Content Analysis
          </h3>
          <p class="text-sm text-muted">
            Generate a writing style guide by analyzing your existing content.
          </p>
        </div>

        <div class="space-y-3">
          <div class="space-y-2">
            <label class="text-sm font-medium">
              Collection
            </label>
            <USelect
              v-model="selectedCollection"
              :items="collectionOptions"
              placeholder="Select a collection"
            />
          </div>

          <UButton
            :loading="isAnalyzing"
            :disabled="isAnalyzing || !enabled"
            icon="i-lucide-sparkles"
            @click="analyzeContent"
          >
            {{ isAnalyzing ? 'Analyzing...' : 'Analyze Content' }}
          </UButton>
        </div>

        <div
          v-if="error"
          class="p-4 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <p class="text-sm text-red-500">
            {{ error }}
          </p>
        </div>

        <div
          v-if="completion"
          class="space-y-2"
        >
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium">
              Generated Context
            </h4>
            <UButton
              size="xs"
              variant="soft"
              icon="i-lucide-copy"
              @click="copyToClipboard"
            >
              Copy
            </UButton>
          </div>
          <div class="p-4 rounded-lg bg-muted border border-default overflow-auto max-h-96">
            <pre class="text-xs whitespace-pre-wrap font-mono">{{ completion }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
