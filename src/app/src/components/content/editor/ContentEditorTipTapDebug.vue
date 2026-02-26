<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { JSONContent } from '@tiptap/vue-3'
import type { ComarkTree } from 'comark/ast'

const props = defineProps({
  currentTiptap: {
    type: Object as PropType<JSONContent | undefined>,
    default: undefined,
  },
  currentComark: {
    type: Object as PropType<ComarkTree | undefined>,
    default: undefined,
  },
  currentContent: {
    type: String,
    default: '',
  },
})

const formattedCurrentTiptap = computed(() => props.currentTiptap ? JSON.stringify(props.currentTiptap, null, 2) : 'No data')
const formattedCurrentComark = computed(() => props.currentComark ? JSON.stringify(props.currentComark, null, 2) : 'No data')
</script>

<template>
  <div class="border-b border-default bg-elevated p-4 overflow-auto max-h-[600px]">
    <div class="grid grid-cols-1 gap-4">
      <!-- Current Markdown Content -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-highlighted">
                Markdown
              </h3>
            </div>
            <CopyButton :content="currentContent" />
          </div>
        </template>

        <pre
          class="text-xs text-muted overflow-auto max-h-[250px] p-3 bg-default rounded-md border border-default whitespace-pre-wrap"
        >{{ currentContent || 'No data' }}</pre>
      </UCard>
      <!-- Current TipTap JSON -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-highlighted">
                TipTap JSON
              </h3>
            </div>
            <CopyButton :content="formattedCurrentTiptap" />
          </div>
        </template>

        <pre
          class="text-xs text-muted overflow-auto max-h-[250px] p-3 bg-default rounded-md border border-default"
        >{{ formattedCurrentTiptap || 'No data' }}</pre>
      </UCard>

      <!-- Current ComarkTree -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-highlighted">
                Comark AST
              </h3>
            </div>
            <CopyButton :content="formattedCurrentComark" />
          </div>
        </template>

        <pre
          class="text-xs text-muted overflow-auto max-h-[250px] p-3 bg-default rounded-md border border-default"
        >{{ formattedCurrentComark || 'No data' }}</pre>
      </UCard>
    </div>
  </div>
</template>
