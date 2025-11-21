<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { JSONContent } from '@tiptap/vue-3'
import type { MDCRoot } from '@nuxtjs/mdc'

const props = defineProps({
  initialMdc: {
    type: Object as PropType<{ body: MDCRoot, data: Record<string, unknown> } | undefined>,
    default: undefined,
  },
  initialContent: {
    type: String,
    default: '',
  },
  initialTiptap: {
    type: Object as PropType<JSONContent | undefined>,
    default: undefined,
  },
  currentTiptap: {
    type: Object as PropType<JSONContent | undefined>,
    default: undefined,
  },
  currentMdc: {
    type: Object as PropType<{ body: MDCRoot, data: Record<string, unknown> } | undefined>,
    default: undefined,
  },
  currentContent: {
    type: String,
    default: '',
  },
})

// Formatted content for display
const formattedInitialMDC = computed(() => props.initialMdc ? JSON.stringify(props.initialMdc, null, 2) : 'No data')
const formattedInitialContent = computed(() => props.initialContent || 'No data')
const formattedInitialTiptap = computed(() => props.initialTiptap ? JSON.stringify(props.initialTiptap, null, 2) : 'No data')
const formattedCurrentTiptap = computed(() => props.currentTiptap ? JSON.stringify(props.currentTiptap, null, 2) : 'No data')
const formattedCurrentMDC = computed(() => props.currentMdc ? JSON.stringify(props.currentMdc, null, 2) : 'No data')
</script>

<template>
  <div class="border-b border-default bg-elevated p-4 overflow-auto max-h-[600px]">
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <!-- Initial Markdown Content -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UBadge
                color="neutral"
                variant="outline"
                size="xs"
              >
                Initial
              </UBadge>
              <h3 class="text-sm font-semibold text-highlighted">
                Markdown
              </h3>
            </div>
            <CopyButton :content="formattedInitialContent" />
          </div>
        </template>

        <pre
          class="text-xs text-muted overflow-auto max-h-[250px] p-3 bg-default rounded-md border border-default whitespace-pre-wrap"
        >{{ formattedInitialContent }}</pre>
      </UCard>

      <!-- Initial Document -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UBadge
                color="neutral"
                variant="outline"
                size="xs"
              >
                Initial
              </UBadge>
              <h3 class="text-sm font-semibold text-highlighted">
                MDC JSON
              </h3>
            </div>
            <CopyButton :content="formattedInitialMDC" />
          </div>
        </template>

        <pre
          class="text-xs text-muted overflow-auto max-h-[250px] p-3 bg-default rounded-md border border-default"
        >{{ formattedInitialMDC || 'No data' }}</pre>
      </UCard>

      <!-- Initial TipTap JSON -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UBadge
                color="neutral"
                variant="outline"
                size="xs"
              >
                Initial
              </UBadge>
              <h3 class="text-sm font-semibold text-highlighted">
                TipTap JSON
              </h3>
            </div>
            <CopyButton :content="formattedInitialTiptap" />
          </div>
        </template>

        <pre
          class="text-xs text-muted overflow-auto max-h-[250px] p-3 bg-default rounded-md border border-default"
        >{{ formattedInitialTiptap || 'No data' }}</pre>
      </UCard>

      <!-- Current TipTap JSON -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UBadge
                color="success"
                variant="outline"
                size="xs"
              >
                Current
              </UBadge>
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

      <!-- Current MDC -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UBadge
                color="success"
                variant="outline"
                size="xs"
              >
                Current
              </UBadge>
              <h3 class="text-sm font-semibold text-highlighted">
                MDC JSON
              </h3>
            </div>
            <CopyButton :content="formattedCurrentMDC" />
          </div>
        </template>

        <pre
          class="text-xs text-muted overflow-auto max-h-[250px] p-3 bg-default rounded-md border border-default"
        >{{ formattedCurrentMDC || 'No data' }}</pre>
      </UCard>

      <!-- Current Markdown Content -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UBadge
                color="success"
                variant="outline"
                size="xs"
              >
                Current
              </UBadge>
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
    </div>
  </div>
</template>
