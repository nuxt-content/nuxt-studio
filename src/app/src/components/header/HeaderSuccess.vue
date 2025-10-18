<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.push('/content')
}
</script>

<template>
  <div class="w-full flex items-center gap-2">
    <UTooltip
      text="Back to content"
      :kbds="['esc']"
    >
      <UButton
        icon="i-ph-arrow-left"
        color="neutral"
        variant="soft"
        size="sm"
        aria-label="Back"
        @click="goBack"
      />
    </UTooltip>
  </div>
</template>
