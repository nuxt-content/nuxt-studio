<script setup lang="ts">
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'

defineProps(nodeViewProps)
</script>

<template>
  <NodeViewWrapper as="div">
    <!-- NodeViewContent will render all slot children, each using TiptapExtensionUPageHeroSlot -->
    <NodeViewContent />
  </NodeViewWrapper>
</template>
