<script setup lang="ts">
import type { TreeItem } from '../../types'
import type { PropType } from 'vue'
import { computed } from 'vue'
import { Image } from '@unpic/vue'
import { isImageFile } from '../../utils/file'

const props = defineProps({
  item: {
    type: Object as PropType<TreeItem>,
    required: true,
  },
})

const imageSrc = computed(() => isImageFile(props.item.fsPath) ? props.item.routePath : null)
</script>

<template>
  <ItemCard :item="item">
    <template #thumbnail>
      <div
        v-if="imageSrc"
        class="w-full h-full bg-[linear-gradient(45deg,#e6e9ea_25%,transparent_0),linear-gradient(-45deg,#e6e9ea_25%,transparent_0),linear-gradient(45deg,transparent_75%,#e6e9ea_0),linear-gradient(-45deg,transparent_75%,#e6e9ea_0)]"
      >
        <Image
          :src="imageSrc"
          width="48"
          height="48"
          alt="File preview"
          class="w-full h-full object-cover"
        />
      </div>
      <div v-else>
        <UIcon
          name="i-lucide-play"
          class="w-6 h-6 text-muted"
        />
      </div>
    </template>
  </ItemCard>
</template>
