<script setup lang="ts">
import { computed } from 'vue'
import UAvatar from '@nuxt/ui/components/Avatar.vue'
// import { useUserSession } from '#imports'

// const { user, clear: logOut } = useUserSession()
const { user, clear: logOut } = {
  clear: () => {},
  user: { name: 'John Doe', avatar: 'https://avatar.nuxt.com/1.png' },
}

const userMenuItems = computed(() => [
  {
    label: 'Sign out',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    onClick: () => {
      logOut()
    },
  },
])
</script>

<template>
  <div
    ref="toolbarWrapper"
    class="toolbar-wrapper"
    style=" transition: all 0.3s ease; height: 60px;"
  >
    <div
      id="__nuxt_preview_toolbar_placeholder"
      part="toolbar-placeholder"
    >
&nbsp;
    </div>
    <div
      id="__nuxt_preview_toolbar"
      part="toolbar"
      class="relative"
    >
      <div class="flex gap-2 items-center">
        <UDropdownMenu
          :items="userMenuItems"
          :portal="false"
        >
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
          >
            <UAvatar
              :src="user?.avatar"
              size="xs"
            />
            <span>{{ user?.name }}</span>
          </UButton>
        </UDropdownMenu>
        <slot name="left" />
      </div>
      <div>
        <slot name="right" />
      </div>
    </div>
  </div>
</template>
