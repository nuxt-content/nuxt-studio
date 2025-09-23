<script setup lang="ts">
const { data } = await useAsyncData('posts', () => queryCollection('docs').path(useRoute().path).first())
</script>

<template>
  <div>
    <ContentRenderer
      v-if="data"
      :value="data"
    />
  </div>
</template>
