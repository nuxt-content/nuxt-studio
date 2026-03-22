<script setup lang="ts">
const props = defineProps({
  showAction: {
    type: Boolean,
    default: false,
  },
  shown: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['showDiff'])

function toggleAction() {
  emit('showDiff', !props.shown)
}
</script>

<template>
  <UAlert
    :title="$t('studio.alert.mdcFormatting')"
    color="info"
    variant="soft"
    orientation="horizontal"
    :ui="{ title: 'text-xs', root: 'rounded-none py-2 border-b border-default' }"
  >
    <template
      v-if="showAction"
      #actions
    >
      <UButton
        variant="soft"
        color="secondary"
        size="xs"
        class="bg-white hover:bg-muted dark:bg-accented dark:hover:bg-elevated"
        @click="toggleAction"
      >
        {{ shown ? $t('studio.buttons.backToEdition') : $t('studio.buttons.seeChanges') }}
      </UButton>
    </template>
  </UAlert>
</template>
