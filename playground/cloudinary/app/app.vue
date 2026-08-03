<script setup lang="ts">
const { data } = await useAsyncData('page', () => queryCollection('pages').path(useRoute().path).first())
</script>

<template>
  <div>
    <header class="header">
      <h1>Cloudinary Playground</h1>
      <nav>
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/about">About</NuxtLink>
        <NuxtLink to="/media-picker">Media picker</NuxtLink>
        <NuxtLink to="/admin">Studio</NuxtLink>
      </nav>
    </header>
    <div class="content">
      <ContentRenderer
        v-if="data"
        :value="data"
      />
    </div>
  </div>
</template>

<style scoped>
.header {
  align-items: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  color: inherit;
  font-size: 0.9rem;
  text-decoration: none;
}

.content {
  padding: 4rem 1rem 2rem;
}

@media (prefers-color-scheme: dark) {
  .header {
    background-color: #1a1a1a;
    border-bottom-color: #333;
  }
}

@media (max-width: 640px) {
  .header {
    align-items: flex-start;
    flex-direction: column;
  }

  nav {
    flex-wrap: wrap;
  }
}
</style>
