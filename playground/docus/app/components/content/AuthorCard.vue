<script setup lang="ts">
defineStudioMeta({
  props: {
    cover: { label: 'Cover image', description: 'Displayed at the top of the card', input: 'media' },
    badge: { label: 'Badge icon', input: 'icon', iconLibraries: ['lucide'] },
    note: { label: 'Note', description: 'Shown in small print under the card', input: 'textarea' },
    internal: { hidden: true },
    social: {
      label: 'Social',
      fields: {
        github: { label: 'GitHub username' },
        avatar: { label: 'Avatar', input: 'media' },
      },
    },
  },
  slots: {
    title: { label: 'Author headline' },
    description: { label: 'Short description', description: 'Displayed under the headline' },
  },
})

defineProps<{
  cover?: string
  badge?: string
  note?: string
  internal?: string
  social?: { github?: string, avatar?: string }
}>()
</script>

<template>
  <div class="author-card">
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
    <p v-if="social?.github">
      <img
        v-if="social.avatar"
        :src="social.avatar"
        alt=""
        class="author-card__avatar"
      >
      @{{ social.github }}
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

.author-card__avatar {
  display: inline-block;
  width: 1.5rem;
  border-radius: 9999px;
}

.author-card__cover {
  max-width: 100%;
  border-radius: 6px;
}
</style>
