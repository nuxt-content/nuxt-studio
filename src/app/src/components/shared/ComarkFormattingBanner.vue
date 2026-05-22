<script setup lang="ts">
import { ref } from 'vue'
import comarkLogo from '../../assets/comark.svg?raw'

withDefaults(defineProps<{
  showAction?: boolean
}>(), {
  showAction: false,
})

const emit = defineEmits<{
  showDiff: [value: boolean]
  applyFormatting: []
}>()

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
    color="secondary"
    variant="soft"
    :ui="{
      root: 'rounded-none border-b border-default px-4 py-3 gap-2',
      title: 'text-xs font-semibold',
      description: 'text-xs leading-relaxed',
      wrapper: 'gap-1',
    }"
  >
    <template #leading>
      <a
        href="https://comark.dev"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Comark"
        class="inline-flex items-center"
      >
        <!-- eslint-disable-next-line vue/no-v-html -- static build-time asset -->
        <span
          class="h-4 w-auto text-secondary [&_svg]:h-full [&_svg]:w-auto"
          v-html="comarkLogo"
        />
      </a>
    </template>
    <template #description>
      <i18n-t
        keypath="studio.alert.comarkFormattingDescription"
        tag="span"
      >
        <template #comark>
          <a
            href="https://comark.dev/syntax/markdown"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium underline underline-offset-2 hover:text-secondary"
          >Comark</a>
        </template>
      </i18n-t>
    </template>
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
