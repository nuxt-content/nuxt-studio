<script setup lang="ts">
import { ref, computed } from 'vue'
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'

const nodeProps = defineProps(nodeViewProps)

const openPropsPopover = ref(false)

const node = computed(() => nodeProps.node)

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
    <div class="relative group my-2">
      <!-- Hover border with component name and actions -->
      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 border-2 border-dashed border-muted rounded-lg pointer-events-none" />

      <!-- Top bar with component name and actions -->
      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 left-2 right-2 flex items-center justify-between z-10">
        <!-- Component name -->
        <div class="bg-white px-2 text-xs font-medium text-muted border border-muted rounded">
          UPageHero
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 bg-white border border-muted rounded p-1">
          <!-- Props button -->
          <UPopover v-model:open="openPropsPopover">
            <UTooltip
              text="Edit properties"
              :disabled="openPropsPopover"
            >
              <UButton
                variant="ghost"
                size="2xs"
                class="text-muted hover:text-default"
                icon="i-lucide-sliders-horizontal"
                aria-label="Edit properties"
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

          <!-- Delete button -->
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

      <!-- NodeViewContent will render all slot children, each using TiptapExtensionUPageHeroSlot -->
      <NodeViewContent />
    </div>
  </NodeViewWrapper>
</template>
