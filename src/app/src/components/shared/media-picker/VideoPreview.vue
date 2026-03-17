<script setup lang="ts">
import type { TreeItem } from '../../../types'

defineProps<{ media: TreeItem }>()
</script>

<template>
  <div
    class="w-full h-full bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex flex-col items-center justify-center relative overflow-hidden rounded-lg"
  >
    <!-- Decorative film strip pattern -->
    <div class="absolute inset-y-0 left-0 w-3 bg-neutral-950 flex flex-col justify-around py-1">
      <div
        v-for="i in 6"
        :key="i"
        class="w-1.5 h-2 bg-neutral-700 mx-auto rounded-sm"
      />
    </div>

    <div class="absolute inset-y-0 right-0 w-3 bg-neutral-950 flex flex-col justify-around py-1">
      <div
        v-for="i in 6"
        :key="i"
        class="w-1.5 h-2 bg-neutral-700 mx-auto rounded-sm"
      />
    </div>

    <div class="size-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 shadow-lg">
      <UIcon
        name="i-lucide-video"
        class="size-7 text-white ml-0.5"
      />
    </div>

    <!-- Filename -->
    <p class="absolute bottom-0 inset-x-0 text-[10px] text-neutral-300 truncate px-4 py-2 bg-linear-to-t from-black/60 to-transparent text-center font-medium">
      {{ media.name }}
    </p>
  </div>
</template>
