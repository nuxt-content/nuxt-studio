<script setup lang="ts">
const { data: page } = await useAsyncData('prefixed-page', () => queryCollection('prefixed').path(useRoute().path).first())
</script>

<template>
  <UContainer>
    Hello
    <ContentRenderer
      v-if="page"
      :value="page"
    />
  </UContainer>
</template>
