<script setup lang="ts">
import { useError } from '../composables/useError'

const { error, clearError } = useError()
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-300"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="error?.title"
      class="sticky bottom-0 z-50 border-t border-default bg-linear-to-r from-error/10 via-error/15 to-error/10 backdrop-blur-sm px-4 py-3"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="flex-1 flex items-center gap-3 truncate">
          <div class="shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-full bg-error/20">
              <UIcon
                name="i-lucide-alert-triangle"
                class="w-4 h-4 text-error"
              />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-highlighted">
              {{ error.title }}
            </p>
            <p class="text-xs text-muted mt-0.5 truncate">
              {{ error.message }}
            </p>
          </div>
        </div>
        <UButton
          color="error"
          variant="ghost"
          size="sm"
          leading-icon="i-lucide-x"
          @click="clearError"
        >
          {{ $t('studio.notifications.error.dismiss') }}
        </UButton>
      </div>
    </div>
  </Transition>
</template>
