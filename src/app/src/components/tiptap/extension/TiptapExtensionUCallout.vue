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

// Mirrors ProseCallout theme color variants exactly (src/theme/prose/callout.ts)
const CALLOUT_COLOR_CLASSES = {
  info: {
    base: 'border border-info/25 bg-info/10 text-info-600 dark:text-info-300 [&>ul]:marker:text-info/50',
    icon: 'text-info',
  },
  success: {
    base: 'border border-success/25 bg-success/10 text-success-600 dark:text-success-300 [&>ul]:marker:text-success/50',
    icon: 'text-success',
  },
  warning: {
    base: 'border border-warning/25 bg-warning/10 text-warning-600 dark:text-warning-300 [&>ul]:marker:text-warning/50',
    icon: 'text-warning',
  },
  error: {
    base: 'border border-error/25 bg-error/10 text-error-600 dark:text-error-300 [&>ul]:marker:text-error/50',
    icon: 'text-error',
  },
} as const

type CalloutType = keyof typeof CALLOUT_CONFIG
type CalloutColor = keyof typeof CALLOUT_COLOR_CLASSES

const calloutType = computed(() => (nodeProps.node.attrs.type || 'note') as CalloutType)
const extraProps = computed(() => nodeProps.node.attrs.props || {})
const config = computed(() => CALLOUT_CONFIG[calloutType.value] || CALLOUT_CONFIG.note)
const colorClasses = computed(() => {
  const color = (extraProps.value.color || config.value.color) as CalloutColor
  return CALLOUT_COLOR_CLASSES[color] ?? CALLOUT_COLOR_CLASSES.info
})

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
    <div class="relative group my-5">
      <!-- Dashed hover outline -->
      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 border-2 border-dashed border-muted rounded-md pointer-events-none z-10" />

      <!-- Floating toolbar: type selector + delete -->
      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 left-2 right-2 flex items-center justify-between z-20">
        <div class="flex items-center gap-px bg-white border border-muted rounded px-1 py-0.5">
          <button
            v-for="(cfg, type) in CALLOUT_CONFIG"
            :key="type"
            class="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded transition-colors"
            :class="calloutType === type ? 'bg-muted text-default' : 'text-muted hover:text-default'"
            @click.stop="setType(type as CalloutType)"
          >
            <UIcon :name="cfg.icon" class="size-3" />
            {{ cfg.label }}
          </button>
        </div>

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

      <!--
        ProseCallout layout: matches Nuxt UI ProseCallout.vue exactly.
        Base classes from src/theme/prose/callout.ts (slots.base).
        NodeViewContent as="span" + [&_p]:inline mirrors mdc-unwrap="p" so text
        flows on the same line as the icon, matching the rendered output.
      -->
      <div
        class="block px-4 py-3 rounded-md text-sm/6 [&_code]:text-xs/5 [&_code]:bg-default [&_pre]:bg-default [&_ul]:my-2.5 [&_ol]:my-2.5 *:last:mb-0! [&_ul]:ps-4.5 [&_ol]:ps-4.5 [&_li]:my-0 [&_p]:inline [&_p]:m-0"
        :class="colorClasses.base"
      >
        <UIcon
          :name="extraProps.icon || config.icon"
          class="size-4 shrink-0 align-sub me-1.5 inline-block"
          :class="colorClasses.icon"
        />
        <NodeViewContent as="span" />
      </div>
    </div>
  </NodeViewWrapper>
</template>
