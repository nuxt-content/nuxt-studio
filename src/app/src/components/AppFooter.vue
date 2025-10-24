<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudio } from '../composables/useStudio'
import { useStudioState } from '../composables/useStudioState'

const { ui, host, git } = useStudio()
const { preferences, manifestId } = useStudioState()
const user = host.user.get()

const showNewVersionAlert = ref(false)
const isReloadingApp = ref(false)

watch(manifestId, (newId) => {
  console.log('👀 Manifest ID changed')
  console.log('📦 Previous manifest ID:', manifestId.value)
  console.log('📦 New manifest ID:', newId)

  if (manifestId.value && manifestId.value !== newId) {
    console.log('✨ New version detected! Showing update alert')
    showNewVersionAlert.value = true
  }
})

function handleReload() {
  isReloadingApp.value = true
  window.location.reload()
  setTimeout(() => {
    isReloadingApp.value = false
  }, 2000)
}

const showTechnicalMode = computed({
  get: () => preferences.value.showTechnicalMode,
  set: (value) => {
    preferences.value.showTechnicalMode = value
  },
})

const repositoryUrl = computed(() => git.getBranchUrl())

const userMenuItems = computed(() => [
  [
  // [{
  //   slot: 'view-mode' as const,
  // }
    repositoryUrl.value
      ? {
          label: `${host.repository.owner}/${host.repository.repo}`,
          icon: 'i-simple-icons:github',
          to: repositoryUrl.value,
          target: '_blank',
        }
      : undefined,
  ].filter(Boolean),
  [{
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    onClick: () => {
      fetch('/__nuxt_content/studio/auth/session', { method: 'delete' }).then(() => {
        document.location.reload()
      })
    },
  }],
])
</script>

<template>
  <div
    class="bg-muted/50 border-default border-t-[0.5px] flex items-center justify-between gap-1.5 px-2 py-2"
  >
    <UDropdownMenu
      :portal="false"
      :items="userMenuItems"
      :ui="{ content: 'w-full' }"
    >
      <template #view-mode>
        <div
          class="w-full"
          @click.stop
        >
          <USwitch
            v-model="showTechnicalMode"
            label="Developer view"
            size="xs"
            :ui="{ root: 'w-full flex-row-reverse justify-between', wrapper: 'ms-0' }"
          />
        </div>
      </template>
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        :avatar="{ src: user?.avatar, alt: user?.name, size: '2xs' }"
        class="px-2 py-1 font-medium"
        :label="user?.name"
      />
    </UDropdownMenu>

    <UTooltip
      v-if="showNewVersionAlert"
      text="New website version detected. Click to reload."
    >
      <UButton
        label="New deployment"
        variant="subtle"
        color="secondary"
        trailing-icon="i-lucide-refresh-cw"
        size="xs"
        :loading="isReloadingApp"
        class="cursor-pointer"
        @click="handleReload"
      >
        <template #trailing>
          <span class="inline-flex rounded-full bg-secondary/30 p-0.5">
            <span class="inline-flex rounded-full bg-secondary p-0.5" />
          </span>
        </template>
      </UButton>
    </UTooltip>

    <div class="flex items-center">
      <UTooltip
        :text="preferences.syncEditorAndRoute ? 'Unlink editor and preview' : 'Link editor and preview'"
        :delay-duration="0"
      >
        <UButton
          icon="i-lucide-arrow-left-right"
          variant="ghost"
          :color="preferences.syncEditorAndRoute ? 'info' : 'neutral'"
          :class="!preferences.syncEditorAndRoute && 'opacity-50'"
          @click="preferences.syncEditorAndRoute = !preferences.syncEditorAndRoute"
        />
      </UTooltip>
      <UButton
        icon="i-lucide-panel-left-close"
        variant="ghost"
        color="neutral"
        @click="ui.close()"
      />
    </div>
  </div>
</template>
