<script setup lang="ts">
interface Author {
  name: string
  avatar?: string
  role?: 'creator' | 'maintainer' | 'contributor'
  bio?: string
}

const props = defineProps<{
  authorsOne?: {
    name: string
    avatar?: string
    role?: 'creator' | 'maintainer' | 'contributor'
    bio?: string
  }[]
  authorsTwo?: Author[]
}>()

const selectedGroup = ref<'one' | 'two'>('one')

const displayedAuthors = computed(() => {
  return selectedGroup.value === 'one' ? props.authorsOne : props.authorsTwo
})
</script>

<template>
  <div class="space-y-6">
    <UFieldGroup>
      <UButton
        :variant="selectedGroup === 'one' ? 'solid' : 'outline'"
        color="neutral"
        label="Authors One"
        @click="selectedGroup = 'one'"
      />
      <UButton
        :variant="selectedGroup === 'two' ? 'solid' : 'outline'"
        color="neutral"
        label="Authors Two"
        @click="selectedGroup = 'two'"
      />
    </UFieldGroup>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="author in displayedAuthors"
        :key="author.name"
        class="bg-elevated rounded-xl p-6 border border-default hover:border-accented transition-colors duration-200"
      >
        <div class="flex items-center gap-4">
          <UAvatar
            :src="author.avatar"
            :alt="author.name"
            size="xl"
          />
          <div class="flex-1 min-w-0">
            <h3 class="text-highlighted font-semibold truncate">
              {{ author.name }}
            </h3>
            <p
              v-if="author.role"
              class="text-muted text-sm"
            >
              {{ author.role }}
            </p>
          </div>
        </div>
        <p
          v-if="author.bio"
          class="mt-4 text-muted text-sm leading-relaxed"
        >
          {{ author.bio }}
        </p>
      </div>
    </div>
  </div>
</template>
