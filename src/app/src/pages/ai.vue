<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudio } from '../composables/useStudio'
import { useAI } from '../composables/useAI'
import { TreeStatus, StudioItemActionId } from '../types'
import type { CollectionInfo } from '@nuxt/content'
import { findItemFromFsPath } from '../utils/tree'

const { host, context, aiContextTree } = useStudio()
const ai = useAI()

const isAnalyzing = ref(false)
const selectedCollection = ref<CollectionInfo | null>(null)

const currentTreeItem = computed(() => aiContextTree!.currentItem.value)
const currentDraftItem = computed(() => aiContextTree!.draft.current.value)

// Get the active collection - either from selectedCollection or derived from current file
const activeCollection = computed(() => {
  if (selectedCollection.value) {
    return selectedCollection.value
  }

  // If we have a current file open, derive collection from its path
  if (currentDraftItem.value?.fsPath) {
    const fileName = currentDraftItem.value.fsPath.split('/').pop()
    if (fileName?.endsWith('.md')) {
      const collectionName = fileName.replace('.md', '')
      return collections.value.find(c => c.name === collectionName)
    }
  }

  return null
})

const currentContextFilePath = computed(() => {
  if (!activeCollection.value) return null
  return contextFilePath(activeCollection.value)
})

// Get all collections except the studio collection itself
const collections = computed(() => {
  const allCollections = host.collection.list()
  const studioCollectionName = ai.contextFolder
  return allCollections.filter(c => c.name !== studioCollectionName)
})

// Check if a context file exists for a given collection
function hasContextFile(collection: CollectionInfo): boolean {
  const contextPath = contextFilePath(collection)
  return !!findItemFromFsPath(aiContextTree!.root.value, contextPath)
}

async function openContextFile(collection: CollectionInfo) {
  selectedCollection.value = collection
  const contextPath = contextFilePath(collection)

  const existingItem = findItemFromFsPath(aiContextTree!.root.value, contextPath)
  if (existingItem) {
    await aiContextTree!.selectItemByFsPath(contextPath)
  }
}

async function closeEditor() {
  selectedCollection.value = null
  await aiContextTree!.select(aiContextTree!.rootItem.value)
}

async function analyzeCollection() {
  if (!activeCollection.value) return

  isAnalyzing.value = true

  try {
    // Generate AI analysis
    const result = await ai.analyze(activeCollection.value)

    // Check if we have a draft for this file (file is open in editor)
    if (currentDraftItem.value) {
      // Update existing draft
      const documentFromContent = host.document.generate.documentFromContent
      const databaseItem = await documentFromContent(currentContextFilePath.value!, result)

      if (databaseItem) {
        await aiContextTree!.draft.update(currentContextFilePath.value!, databaseItem)
      }
    }
    else {
      // Create new file using action handler
      await context.itemActionHandler[StudioItemActionId.CreateDocument]({
        fsPath: currentContextFilePath.value!,
        content: result,
      })

      // Wait for the tree to be rebuilt by the hook
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Select the newly created file in the tree
      await aiContextTree!.selectItemByFsPath(currentContextFilePath.value!)
    }
  }
  catch { /* TODO: handle error */ }
  finally {
    isAnalyzing.value = false
  }
}

function contextFilePath(collection: CollectionInfo) {
  return `${ai.contextFolder}/${collection.name}.md`
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between gap-2 px-4 py-1 border-b-[0.5px] border-default bg-muted/70">
      <div class="flex items-center gap-2">
        <UIcon
          v-if="isAnalyzing"
          name="i-lucide-loader-2"
          class="size-4 animate-spin"
        />
        <UButton
          v-else-if="currentTreeItem.type === 'file' || activeCollection"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="closeEditor"
        />
        <h2 class="text-sm font-medium">
          {{
            isAnalyzing
              ? $t('studio.ai.analyzingCollection')
              : (
                currentTreeItem.type === 'file'
                  ? $t('studio.ai.collectionGuide', { collectionName: currentTreeItem.name.replace('.md', '') })
                  : $t('studio.ai.writingStyleGuide')
              )
          }}
        </h2>
      </div>
      <div class="flex items-center gap-2">
        <div
          v-if="isAnalyzing && ai.completion.value"
          class="text-xs text-muted"
        >
          {{ $t('studio.ai.characterCount', { count: ai.completion.value.length }) }}
        </div>
        <UTooltip
          v-else-if="currentTreeItem.type === 'file' && currentDraftItem"
          :text="$t('studio.tooltips.regenerateAIContext')"
        >
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="isAnalyzing"
            @click="analyzeCollection"
          />
        </UTooltip>
      </div>
    </div>

    <div class="flex-1 relative">
      <div
        v-if="aiContextTree!.draft.isLoading.value"
        class="absolute inset-0 bg-primary/3 animate-pulse z-10 pointer-events-none"
      />
      <template v-else>
        <div
          v-if="isAnalyzing && ai.completion.value"
          class="h-full overflow-y-auto p-6"
        >
          <div class="max-w-4xl mx-auto prose prose-sm text-foreground">
            <pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">{{ ai.completion.value }}</pre>
          </div>
        </div>

        <!-- Show ContentEditor when a context file is selected -->
        <ContentEditor
          v-else-if="currentTreeItem.type === 'file' && currentDraftItem"
          :draft-item="currentDraftItem"
          :read-only="currentTreeItem.status === TreeStatus.Deleted"
        />

        <!-- Show analyze button when collection is selected but no file exists -->
        <div
          v-else-if="activeCollection"
          class="h-full flex items-center justify-center p-4"
        >
          <div class="max-w-md text-center space-y-4">
            <UIcon
              name="i-lucide-sparkles"
              class="size-12 mx-auto text-primary opacity-50"
            />
            <div>
              <h3 class="text-lg font-medium mb-2">
                {{ $t('studio.ai.noStyleGuide') }}
              </h3>
              <p class="text-sm text-muted mb-4">
                {{ $t('studio.ai.noStyleGuideDescription', { collectionName: activeCollection.name }) }}
              </p>
            </div>
            <UButton
              icon="i-lucide-sparkles"
              :loading="isAnalyzing"
              @click="analyzeCollection"
            >
              {{ isAnalyzing ? $t('studio.ai.analyzing') : $t('studio.ai.analyzeCollection') }}
            </UButton>
          </div>
        </div>

        <!-- Show collections list when nothing is selected -->
        <div
          v-else
          class="h-full overflow-y-auto p-4"
        >
          <div class="max-w-2xl mx-auto space-y-4">
            <UAlert
              color="secondary"
              variant="subtle"
              icon="i-lucide-flask-conical"
              :title="$t('studio.ai.experimentalAlert')"
              to="https://nuxt.studio/ai"
              :actions="[{
                label: $t('studio.ai.learnMore'),
                to: 'https://nuxt.studio/ai',
                target: '_blank',
                color: 'secondary',
                variant: 'outline',
                size: 'xs',
              }]"
              :ui="{ icon: 'size-4', title: 'text-xs' }"
            />

            <div class="space-y-2">
              <h3 class="text-sm font-medium">
                {{ $t('studio.ai.collectionContextFiles') }}
              </h3>
              <p class="text-sm text-muted">
                {{ $t('studio.ai.collectionContextDescription') }}
              </p>
            </div>

            <div
              v-if="collections.length === 0"
              class="p-8 text-center text-muted"
            >
              <UIcon
                name="i-lucide-folder-open"
                class="size-12 mx-auto mb-2 opacity-50"
              />
              <p>{{ $t('studio.ai.noCollectionsFound') }}</p>
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
                    <UBadge
                      size="xs"
                      :variant="hasContextFile(collection) ? 'subtle' : 'outline'"
                      :color="hasContextFile(collection) ? 'success' : 'neutral'"
                    >
                      {{ hasContextFile(collection) ? $t('studio.ai.generated') : $t('studio.ai.notGenerated') }}
                    </UBadge>
                  </div>
                </div>
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-4 text-muted"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
