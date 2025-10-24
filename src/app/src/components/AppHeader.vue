<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import HeaderMain from './header/HeaderMain.vue'
import HeaderReview from './header/HeaderReview.vue'
import HeaderSuccess from './header/HeaderSuccess.vue'

const route = useRoute()

const currentHeader = computed(() => {
  if (route.name === 'review') {
    return HeaderReview
  }
  if (['success', 'error'].includes(route.name as string)) {
    return HeaderSuccess
  }
  return HeaderMain
})
</script>

<template>
  <div class="bg-muted/50 border-default border-b-[0.5px] pr-4 gap-1.5 flex items-center justify-between px-4 h-[45px]">
    <component :is="currentHeader" />
  </div>
</template>
