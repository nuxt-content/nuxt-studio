<script setup lang="ts">
const { data: nav } = await useAsyncData('nav', () => {
  return queryCollectionNavigation('content')
})
</script>

<template>
  <div class="two-column-layout">
    <nav class="sidebar">
      <ul>
        <li
          v-for="item in nav"
          :key="item.id as string"
        >
          <NuxtLink :to="item.path">{{ item.title }}</NuxtLink>
        </li>
      </ul>
    </nav>
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.two-column-layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 220px;
  background: #f7f7f7;
  padding: 2rem 1rem;
  border-right: 1px solid #e0e0e0;
}
.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sidebar li {
  margin-bottom: 1rem;
}
.sidebar a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
}

.content {
  flex: 1;
  padding: 2rem;
}

.content * {
  max-width: 100%;
}
</style>
