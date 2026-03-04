<script setup lang="ts">
import { ref, computed } from 'vue'
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'

const nodeProps = defineProps(nodeViewProps)

const node = computed(() => nodeProps.node)
const openPropsPopover = ref(false)
const isEditable = ref(true) // TODO: Connect to editor state

const CALLOUT_TYPES = ['callout', 'note', 'tip', 'warning', 'caution'] as const
type CalloutType = typeof CALLOUT_TYPES[number]

const CALLOUT_CONFIG: Record<CalloutType, { icon?: string, label: string, wrapperClass: string, iconClass?: string }> = {
  callout: {
    label: 'Callout',
    wrapperClass: 'border-muted bg-muted text-default',
  },
  note: {
    icon: 'i-lucide-info',
    label: 'Note',
    wrapperClass: 'border-info/25 bg-info/10 text-info-600 dark:text-info-300',
    iconClass: 'text-info',
  },
  tip: {
    icon: 'i-lucide-lightbulb',
    label: 'Tip',
    wrapperClass: 'border-success/25 bg-success/10 text-success-600 dark:text-success-300',
    iconClass: 'text-success',
  },
  warning: {
    icon: 'i-lucide-triangle-alert',
    label: 'Warning',
    wrapperClass: 'border-warning/25 bg-warning/10 text-warning-600 dark:text-warning-300',
    iconClass: 'text-warning',
  },
  caution: {
    icon: 'i-lucide-circle-alert',
    label: 'Caution',
    wrapperClass: 'border-error/25 bg-error/10 text-error-600 dark:text-error-300',
    iconClass: 'text-error',
  },
}

const tag = computed(() => (nodeProps.node.attrs.tag || 'note') as CalloutType)
const config = computed(() => CALLOUT_CONFIG[tag.value] || CALLOUT_CONFIG.note)
const componentProps = computed(() => nodeProps.node.attrs.props || {})

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
    <div
      class="group relative block px-4 py-3 rounded-md text-sm/6 my-5 last:mb-0 [&_code]:text-xs/5 [&_code]:bg-default [&_pre]:bg-default [&_ul]:my-1.5 [&_ol]:my-2.5 *:last:mb-0! [&_ul]:ps-4.5 [&_ol]:ps-4.5 [&_li]:my-0 border"
      :class="config.wrapperClass"
    >
      <!-- Hover toolbar -->
      <div
        class="absolute -top-3.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-default rounded border border-muted shadow-xs px-1 py-0.5"
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

        <UBadge
          v-if="Object.keys(componentProps).length > 0"
          color="neutral"
          variant="subtle"
          size="xs"
        >
          {{ Object.keys(componentProps).length }}
        </UBadge>

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

      <div class="flex items-start gap-1.5">
        <UIcon
          v-if="config.icon"
          :name="config.icon"
          class="size-4 shrink-0 mt-1.5"
          :class="config.iconClass"
        />
        <NodeViewContent
          as="span"
          class="flex-1 min-w-0"
        />
      </div>
    </div>
  </NodeViewWrapper>
</template>
