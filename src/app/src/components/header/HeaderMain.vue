<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStudio } from '../../composables/useStudio'
import type { StudioFeature } from '../../types'
import { useStudioState } from '../../composables/useStudioState'
import { useAI } from '../../composables/useAI'
import type { TabsItem } from '@nuxt/ui/components/Tabs.vue.d.ts'

const router = useRouter()
const route = useRoute()
const { context } = useStudio()
const ai = useAI()
const { t } = useI18n()
const { setLocation, devMode } = useStudioState()

const items = computed(() => {
  const tabs: TabsItem[] = [
    {
      label: t('studio.nav.content'),
      value: 'content',
      to: '/content',
    },
    {
      label: t('studio.nav.media'),
      value: 'media',
      to: '/media',
    },
  ]

  // Only add AI tab if AI is enabled and in dev mode
  if (ai.enabled && devMode.value) {
    tabs.push({
      label: `${t('studio.nav.ai')}`,
      value: 'ai',
      to: '/ai',
      badge: {
        label: t('studio.badges.experimental'),
        color: 'secondary',
        size: 'xs',
      },
    })
  }

  return tabs
})

const current = computed({
  get: () => route.name as string,
  set: async (name: StudioFeature) => {
    await router.push({ name })

    const currentItem = context.activeTree.value.currentItem.value
    setLocation(name, currentItem.fsPath)

    // Ensure active tree select the approriate draft
    await context.activeTree.value.select(context.activeTree.value.currentItem.value)
  },
})
</script>

<template>
  <div class="w-full flex items-center justify-between gap-2">
    <UTabs
      v-model="current"
      :content="false"
      :items="items"
      variant="link"
      size="md"
      color="neutral"
      :ui="{ trigger: 'py-1 px-2', list: 'py-2 px-0' }"
    />

    <UButton
      v-if="!devMode"
      :label="$t('studio.buttons.review')"
      color="neutral"
      :variant="context.draftCount.value > 0 ? 'solid' : 'soft'"
      to="/review"
      :disabled="context.draftCount.value === 0"
      icon="i-lucide-file-diff"
      :ui="{ leadingIcon: 'size-3.5' }"
    >
      <template
        v-if="context.draftCount.value > 0"
        #leading
      >
        <UBadge
          :label="context.draftCount.value.toString()"
          class="bg-neutral-400"
          size="xs"
          variant="soft"
        />
      </template>
    </UButton>
  </div>
</template>
