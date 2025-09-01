<template>
  <div class="browser-frame">
    <div class="browser-header">
      <div class="browser-controls">
        <span class="control-button control-red" />
        <span class="control-button control-yellow" />
        <span class="control-button control-green" />
      </div>
      <div class="browser-title">
        {{ title }}
      </div>
    </div>
    <div class="browser-content">
      <slot mdc-unwrap="p" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<style scoped>
.browser-frame {
  width: fit-content;
  border-radius: 0.75rem;
  border: 1px solid #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.browser-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.browser-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-button {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.control-red {
  background-color: #ef4444;
}

.control-yellow {
  background-color: #eab308;
}

.control-green {
  background-color: #22c55e;
}

.browser-title {
  color: #6b7280;
}

.browser-content {
  padding: 1rem;
}
</style>
