<script setup lang="ts">
import type { FormItem } from '../../../types'
import type { PropType } from 'vue'
import { ref, computed, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { resolveIconPickerLibraries } from '../../../utils/resolveIconPickerLibraries'

const props = defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    default: () => ({}),
  },
})

const model = defineModel<string>({ default: '' })

// Ensure ${collection}:${name} is preserved when collection is hyphenated
const HYPHENATED_COLLECTION_PREFIXES = [
  'material-symbols-light',
  'material-symbols',
  'fluent-emoji-high-contrast',
  'fluent-emoji-flat',
  'fluent-emoji',
  'simple-icons',
  'flat-color-icons',
  'line-md',
  'svg-spinners',
  'vscode-icons',
  'game-icons',
  'file-icons',
  'flag-icons',
  'circle-flags',
  'fa6-brands',
  'fa6-regular',
  'fa6-solid',
  'fa-brands',
  'fa-regular',
  'fa-solid',
  'skill-icons',
  'token-branded',
] as const

function normalizeIconName(stored: string): string {
  if (!stored.startsWith('i-')) {
    return stored
  }

  const body = stored.slice(2)

  if (body.includes(':')) {
    return stored
  }

  for (const prefix of HYPHENATED_COLLECTION_PREFIXES) {
    const lead = `${prefix}-`

    if (body.startsWith(lead) && body.length > lead.length) {
      return `i-${prefix}:${body.slice(lead.length)}`
    }
  }

  return stored
}

const resolvedIconName = computed(() => normalizeIconName(model.value))

const search = ref('')
const icons = ref<string[]>([])
const isLoading = ref(false)
const popoverOpen = ref(false)

const iconLibraries = computed(() => {
  const globalLibraries = typeof window !== 'undefined'
    ? window.useStudioHost?.()?.meta?.iconLibraries
    : undefined
  return resolveIconPickerLibraries(
    props.formItem?.options as string[] | undefined,
    globalLibraries,
  )
})

// Fetch icons from Iconify API
async function fetchIcons(query: string) {
  if (!query || query.length < 2) {
    icons.value = []
    return
  }

  isLoading.value = true
  try {
    const prefixes = iconLibraries.value === 'all' ? '' : iconLibraries.value.join(',')
    const response = await fetch(
      `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=30` + (prefixes ? `&prefixes=${prefixes}` : ''),
    )
    const data = await response.json()
    icons.value = data.icons || []
  }
  catch {
    icons.value = []
  }
  finally {
    isLoading.value = false
  }
}

const debouncedFetch = useDebounceFn(fetchIcons, 300)

watch(search, (value) => {
  debouncedFetch(value)
})

function selectIcon(icon: string) {
  model.value = `i-${icon}`
  popoverOpen.value = false
  search.value = ''
  icons.value = []
}
</script>

<template>
  <div class="flex items-center gap-1">
    <div class="flex items-center justify-center size-6 bg-muted border border-muted rounded shrink-0">
      <UIcon
        v-if="model"
        :name="resolvedIconName"
        size="xs"
      />
      <UIcon
        v-else
        name="i-lucide-shapes"
        class="text-dimmed"
        size="xs"
      />
    </div>

    <UInput
      v-model="model"
      :placeholder="$t('studio.form.icon.placeholder')"
      size="xs"
      class="flex-1"
    >
      <template #trailing>
        <UPopover
          v-model:open="popoverOpen"
          :portal="false"
          :content="{ side: 'left' }"
          :ui="{ content: 'z-[1000]' }"
        >
          <UButton
            size="xs"
            color="neutral"
            variant="none"
            icon="i-lucide-search"
            class="cursor-pointer"
          />

          <template #content>
            <div class="p-3 w-72">
              <UInput
                v-model="search"
                :placeholder="$t('studio.form.icon.searchPlaceholder')"
                size="xs"
                icon="i-lucide-search"
                autofocus
                class="mb-3 w-full"
              />

              <div
                v-if="isLoading"
                class="flex items-center justify-center py-4"
              >
                <UIcon
                  name="i-lucide-loader-2"
                  class="size-5 animate-spin text-muted"
                />
              </div>

              <div
                v-else-if="icons.length > 0"
                class="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto"
              >
                <UTooltip
                  v-for="icon in icons"
                  :key="icon"
                  :text="icon"
                >
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="soft"
                    :icon="`i-${icon}`"
                    class="flex items-center justify-center"
                    @click="selectIcon(icon)"
                  />
                </UTooltip>
              </div>

              <p
                v-else-if="search.length >= 2"
                class="text-xs text-muted text-center py-4"
              >
                {{ $t('studio.form.icon.noIconsFound') }}
              </p>

              <p
                v-else
                class="text-xs text-muted text-center py-4"
              >
                {{ $t('studio.form.icon.searchHint') }}
              </p>

              <p class="text-xs text-dimmed mt-2">
                {{ $t('studio.form.icon.libraries') }} {{ iconLibraries === 'all' ? $t('studio.form.icon.allLibraries') : iconLibraries.join(', ') }}
              </p>
            </div>
          </template>
        </UPopover>
      </template>
    </UInput>
  </div>
</template>
