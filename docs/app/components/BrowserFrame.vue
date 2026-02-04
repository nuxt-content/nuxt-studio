<template>
  <div class="group rounded-md overflow-hidden ring-1 ring-default">
    <div
      class="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-b border-default"
      aria-hidden="true"
    >
      <span class="size-2.5 rounded-full bg-muted/90 group-hover:bg-red-500 transition-colors duration-200" />
      <span class="size-2.5 rounded-full bg-muted/90 group-hover:bg-yellow-500 transition-colors duration-200" />
      <span class="size-2.5 rounded-full bg-muted/90 group-hover:bg-green-500 transition-colors duration-200" />
      <span
        v-if="title"
        class="ml-2 text-xs text-muted"
      >{{ title }}</span>
    </div>
    <slot mdc-unwrap="p" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>
