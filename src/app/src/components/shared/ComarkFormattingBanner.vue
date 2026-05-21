<script setup lang="ts">
import { ref } from 'vue'

defineProps({
  showAction: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['showDiff', 'applyFormatting'])

const isDiffShown = ref(false)

function toggleAction() {
  isDiffShown.value = !isDiffShown.value
  emit('showDiff', isDiffShown.value)
}

function applyFormatting() {
  emit('applyFormatting')
}
</script>

<template>
  <UAlert
    :title="$t('studio.alert.comarkFormatting')"
    :description="$t('studio.alert.comarkFormattingDescription')"
    icon="i-lucide-sparkles"
    color="info"
    variant="soft"
    :ui="{
      root: 'rounded-none border-b border-default px-4 py-3 gap-2',
      title: 'text-sm font-semibold',
      description: 'text-xs leading-relaxed',
      wrapper: 'gap-1',
    }"
  >
    <template
      v-if="showAction"
      #actions
    >
      <div class="flex items-center gap-2 mt-2">
        <UButton
          variant="solid"
          color="secondary"
          size="xs"
          icon="i-lucide-check"
          @click="applyFormatting"
        >
          {{ $t('studio.buttons.applyFormatting') }}
        </UButton>
        <UButton
          variant="soft"
          color="secondary"
          size="xs"
          :icon="isDiffShown ? 'i-lucide-arrow-left' : 'i-lucide-diff'"
          @click="toggleAction"
        >
          {{ isDiffShown ? $t('studio.buttons.backToEdition') : $t('studio.buttons.seeChanges') }}
        </UButton>
      </div>
    </template>
  </UAlert>
</template>
