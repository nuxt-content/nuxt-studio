<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'

const nodeProps = defineProps(nodeViewProps)

const CALLOUT_CONFIG = {
  note: { color: 'info' as const, icon: 'i-lucide-info', label: 'Note' },
  tip: { color: 'success' as const, icon: 'i-lucide-lightbulb', label: 'Tip' },
  warning: { color: 'warning' as const, icon: 'i-lucide-triangle-alert', label: 'Warning' },
  caution: { color: 'error' as const, icon: 'i-lucide-circle-alert', label: 'Caution' },
} as const

type CalloutType = keyof typeof CALLOUT_CONFIG

const calloutType = computed(() => (nodeProps.node.attrs.type || 'note') as CalloutType)
const extraProps = computed(() => nodeProps.node.attrs.props || {})
const config = computed(() => CALLOUT_CONFIG[calloutType.value] || CALLOUT_CONFIG.note)

function setType(type: CalloutType) {
  nodeProps.updateAttributes({ type })
}

function onDelete(event: Event) {
  event.stopPropagation()
  event.preventDefault()
  nodeProps.deleteNode()
}
</script>

<template>
  <NodeViewWrapper as="div">
    <div class="relative group my-2">
      <!-- Hover border with dashed outline -->
      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 border-2 border-dashed border-muted rounded-lg pointer-events-none z-10" />

      <!-- Top bar with type selector and delete button -->
      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 left-2 right-2 flex items-center justify-between z-20">
        <!-- Type selector -->
        <div class="flex items-center gap-px bg-white border border-muted rounded px-1 py-0.5">
          <button
            v-for="(cfg, type) in CALLOUT_CONFIG"
            :key="type"
            class="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded transition-colors"
            :class="calloutType === type ? 'bg-muted text-default' : 'text-muted hover:text-default'"
            @click.stop="setType(type as CalloutType)"
          >
            <UIcon
              :name="cfg.icon"
              class="size-3"
            />
            {{ cfg.label }}
          </button>
        </div>

        <!-- Delete button -->
        <div class="flex items-center bg-white border border-muted rounded p-1">
          <UTooltip text="Delete">
            <UButton
              variant="ghost"
              size="2xs"
              class="text-muted hover:text-default"
              icon="i-lucide-trash"
              aria-label="Delete"
              @click="onDelete"
            />
          </UTooltip>
        </div>
      </div>

      <!-- The actual UCallout component -->
      <UCallout
        :color="extraProps.color || config.color"
        :icon="extraProps.icon || config.icon"
      >
        <NodeViewContent />
      </UCallout>
    </div>
  </NodeViewWrapper>
</template>
