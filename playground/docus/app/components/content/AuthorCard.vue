<script setup lang="ts">
import { defineStudioMeta, ui, media, icon, select, collectionItem, hidden } from 'nuxt-studio/component-meta'

/**
 * Demo of the `defineStudioMeta` compiler macro. Only works in globally
 * registered components (`components/content/`), since nuxt-component-meta
 * is installed with `globalsOnly: true`.
 */
defineStudioMeta({
  props: {
    cover: ui({ label: 'Cover image', description: 'Displayed at the top of the card', type: media() }),
    badge: ui({ label: 'Badge icon', type: icon({ libraries: ['lucide'] }) }),
    author: ui({ label: 'Author', description: 'Main author of the card', type: collectionItem({ collection: 'authors', field: 'stem' }) }),
    friends: collectionItem({ collection: 'authors', field: 'stem', multiple: true }),
    variant: select({ options: ['default', 'outlined', 'minimal'] }),
    internal: hidden(),
    note: { label: 'Note', input: 'textarea', description: 'Shown in small print under the card' },
  },
  slots: {
    title: { label: 'Author headline' },
    description: { label: 'Short description', description: 'Displayed under the headline' },
  },
})

withDefaults(defineProps<{
  cover?: string
  badge?: string
  author?: string
  friends?: string[]
  variant?: string
  internal?: string
  note?: string
}>(), {
  variant: 'default',
})
</script>

<template>
  <div
    class="author-card"
    :class="`author-card--${variant}`"
  >
    <img
      v-if="cover"
      :src="cover"
      alt=""
      class="author-card__cover"
    >
    <p v-if="badge">
      <UIcon :name="badge" /> {{ badge }}
    </p>
    <h3><slot name="title" /></h3>
    <p><slot name="description" /></p>
    <p v-if="author">
      Author: {{ author }}
    </p>
    <p v-if="friends?.length">
      Friends: {{ friends.join(', ') }}
    </p>
    <small v-if="note">{{ note }}</small>
  </div>
</template>

<style scoped>
.author-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.author-card--outlined {
  border-width: 2px;
}

.author-card--minimal {
  border: none;
  padding: 0.5rem 0;
}

.author-card__cover {
  max-width: 100%;
  border-radius: 6px;
}
</style>
