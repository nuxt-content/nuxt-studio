<script setup lang="ts">
import { ref, computed } from 'vue'
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'

const nodeProps = defineProps(nodeViewProps)

const node = computed(() => nodeProps.node)
const openPropsPopover = ref(false)
const isEditable = ref(true) // TODO: Connect to editor state

const CALLOUT_TYPES = ['callout', 'note', 'tip', 'warning', 'caution'] as const
type CalloutType = typeof CALLOUT_TYPES[number]
type UIColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

interface ColorClasses {
  baseClass: string
  iconClass: string
  externalIconClass: string
  hoverBorderClass: string
}

interface CalloutConfig extends ColorClasses {
  label: string
  icon?: string
}

// Exact classes from @nuxt/ui prose/callout theme
const CALLOUT_CONFIG: Record<CalloutType, CalloutConfig> = {
  callout: {
    label: 'Callout',
    baseClass: 'border border-muted bg-muted text-default',
    iconClass: 'text-highlighted',
    externalIconClass: 'text-dimmed group-hover:text-highlighted',
    hoverBorderClass: 'hover:border-inverted',
  },
  note: {
    label: 'Note',
    icon: 'i-lucide-info',
    baseClass: 'border border-info/25 bg-info/10 text-info-600 dark:text-info-300',
    iconClass: 'text-info',
    externalIconClass: 'text-info-600 dark:text-info-300 group-hover:text-info',
    hoverBorderClass: 'hover:border-info',
  },
  tip: {
    label: 'Tip',
    icon: 'i-lucide-lightbulb',
    baseClass: 'border border-success/25 bg-success/10 text-success-600 dark:text-success-300',
    iconClass: 'text-success',
    externalIconClass: 'text-success-600 dark:text-success-300 group-hover:text-success',
    hoverBorderClass: 'hover:border-success',
  },
  warning: {
    label: 'Warning',
    icon: 'i-lucide-triangle-alert',
    baseClass: 'border border-warning/25 bg-warning/10 text-warning-600 dark:text-warning-300',
    iconClass: 'text-warning',
    externalIconClass: 'text-warning-600 dark:text-warning-300 group-hover:text-warning',
    hoverBorderClass: 'hover:border-warning',
  },
  caution: {
    label: 'Caution',
    icon: 'i-lucide-circle-alert',
    baseClass: 'border border-error/25 bg-error/10 text-error-600 dark:text-error-300',
    iconClass: 'text-error',
    externalIconClass: 'text-error-600 dark:text-error-300 group-hover:text-error',
    hoverBorderClass: 'hover:border-error',
  },
}

// Color overrides matching @nuxt/ui prose/callout color variants
const COLOR_CONFIG: Record<UIColor, ColorClasses> = {
  primary: {
    baseClass: 'border border-primary/25 bg-primary/10 text-primary-600 dark:text-primary-300',
    iconClass: 'text-primary',
    externalIconClass: 'text-primary-600 dark:text-primary-300 group-hover:text-primary',
    hoverBorderClass: 'hover:border-primary',
  },
  secondary: {
    baseClass: 'border border-secondary/25 bg-secondary/10 text-secondary-600 dark:text-secondary-300',
    iconClass: 'text-secondary',
    externalIconClass: 'text-secondary-600 dark:text-secondary-300 group-hover:text-secondary',
    hoverBorderClass: 'hover:border-secondary',
  },
  success: {
    baseClass: 'border border-success/25 bg-success/10 text-success-600 dark:text-success-300',
    iconClass: 'text-success',
    externalIconClass: 'text-success-600 dark:text-success-300 group-hover:text-success',
    hoverBorderClass: 'hover:border-success',
  },
  info: {
    baseClass: 'border border-info/25 bg-info/10 text-info-600 dark:text-info-300',
    iconClass: 'text-info',
    externalIconClass: 'text-info-600 dark:text-info-300 group-hover:text-info',
    hoverBorderClass: 'hover:border-info',
  },
  warning: {
    baseClass: 'border border-warning/25 bg-warning/10 text-warning-600 dark:text-warning-300',
    iconClass: 'text-warning',
    externalIconClass: 'text-warning-600 dark:text-warning-300 group-hover:text-warning',
    hoverBorderClass: 'hover:border-warning',
  },
  error: {
    baseClass: 'border border-error/25 bg-error/10 text-error-600 dark:text-error-300',
    iconClass: 'text-error',
    externalIconClass: 'text-error-600 dark:text-error-300 group-hover:text-error',
    hoverBorderClass: 'hover:border-error',
  },
  neutral: {
    baseClass: 'border border-muted bg-muted text-default',
    iconClass: 'text-highlighted',
    externalIconClass: 'text-dimmed group-hover:text-highlighted',
    hoverBorderClass: 'hover:border-inverted',
  },
}

const tag = computed(() => (nodeProps.node.attrs.tag || 'callout') as CalloutType)
const componentProps = computed(() => nodeProps.node.attrs.props || {})

const config = computed(() => {
  const base = CALLOUT_CONFIG[tag.value] || CALLOUT_CONFIG.callout
  const colorOverride = componentProps.value.color as UIColor | undefined
  if (colorOverride && colorOverride in COLOR_CONFIG) {
    return { ...base, ...COLOR_CONFIG[colorOverride] }
  }
  return base
})
const icon = computed(() => (componentProps.value.icon as string) || config.value.icon)
const to = computed(() => componentProps.value.to as string | undefined)
const isExternalTo = computed(() => !!to.value && to.value.startsWith('http'))

function setType(type: CalloutType) {
  nodeProps.updateAttributes({ tag: type })
}

function updateComponentProps(props: Record<string, unknown>) {
  nodeProps.updateAttributes({ props })
}

function onDelete(event: Event) {
  event.stopPropagation()
  event.preventDefault()
  nodeProps.deleteNode()
}
</script>

<template>
  <NodeViewWrapper as="div">
    <div class="group relative my-5 last:mb-0">
      <!-- Hover toolbar -->
      <div
        class="absolute -top-3.5 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-default rounded border border-muted shadow-xs px-1 py-0.5"
        :contenteditable="false"
      >
        <UTooltip
          v-for="type in CALLOUT_TYPES"
          :key="type"
          :text="CALLOUT_CONFIG[type].label"
        >
          <UButton
            variant="ghost"
            size="2xs"
            :icon="CALLOUT_CONFIG[type].icon || 'i-lucide-message-square'"
            :class="[tag === type ? 'text-default' : 'text-muted hover:text-default']"
            :aria-label="CALLOUT_CONFIG[type].label"
            :disabled="!isEditable"
            @click.prevent.stop="setType(type)"
          />
        </UTooltip>

        <UPopover v-model:open="openPropsPopover">
          <UTooltip
            :text="$t('studio.tiptap.element.editProps')"
            :disabled="openPropsPopover"
          >
            <UButton
              variant="ghost"
              size="2xs"
              class="text-muted hover:text-default"
              icon="i-lucide-sliders-horizontal"
              :disabled="!isEditable"
              :aria-label="$t('studio.tiptap.element.editProps')"
              @click.stop
            />
          </UTooltip>

          <template #content>
            <TiptapComponentProps
              :node="node"
              :update-props="updateComponentProps"
            />
          </template>
        </UPopover>

        <UTooltip :text="$t('studio.tiptap.element.delete')">
          <UButton
            variant="ghost"
            size="2xs"
            class="text-muted hover:text-default"
            icon="i-lucide-trash"
            :disabled="!isEditable"
            :aria-label="$t('studio.tiptap.element.delete')"
            @click="onDelete"
          />
        </UTooltip>
      </div>

      <!-- Callout body: mirrors prose Callout theme exactly -->
      <div
        :class="[
          'relative flex items-start px-4 py-3 rounded-md text-sm/6 last:mb-0 [&_code]:text-xs/5 [&_code]:bg-default [&_pre]:bg-default *:last:mb-0! [&_ul]:ps-4.5 [&_ol]:ps-4.5 [&_li]:my-0 transition-colors',
          config.baseClass,
          to && 'border-dashed',
          to && config.hoverBorderClass,
        ]"
      >
        <!-- External link icon (top-right, only for external URLs) -->
        <UIcon
          v-if="isExternalTo"
          name="i-lucide-arrow-up-right"
          :class="['size-4 absolute right-2 top-2 pointer-events-none transition-colors', config.externalIconClass]"
          :contenteditable="false"
        />

        <!-- Icon before content -->
        <UIcon
          v-if="icon"
          :name="icon"
          :class="['size-4 shrink-0 mt-1.5 me-1.5 transition-colors', config.iconClass]"
          :contenteditable="false"
        />

        <NodeViewContent
          as="div"
          class="flex-1 min-w-0"
        />
      </div>
    </div>
  </NodeViewWrapper>
</template>
