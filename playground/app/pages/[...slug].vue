<script lang="ts" setup>
const route = useRoute()

if (route.path === '/') {
  await navigateTo('/alborz')
}

const { data: page } = await useAsyncData('page-' + route.path, () => {
  return queryCollection('content').path(route.path).first()
})
</script>

<template>
  <div>
    <ContentRenderer
      v-if="page"
      :value="page"
    />
  </div>
</template>
