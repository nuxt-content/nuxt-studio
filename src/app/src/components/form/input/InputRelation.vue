<script setup lang="ts">
import type { FormItem } from '../../../types'
import type { RelationOption } from '../../../utils/relation'
import type { PropType } from 'vue'
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStudio } from '../../../composables/useStudio'
import { buildRelationOptions, filterRelationOptions } from '../../../utils/relation'

const props = defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    default: () => ({}),
  },
})

const model = defineModel<string>({ default: '' })

const { host } = useStudio()
const { t } = useI18n()

const popoverOpen = ref(false)
const search = ref('')
const isLoading = ref(true)
const options = ref<RelationOption[]>([])

const relation = computed(() => props.formItem?.relation)

// Documents of the referenced collection, as { value, label } picker options
async function loadOptions() {
  const target = relation.value
  if (!target?.collection) {
    options.value = []
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    const documents = await host.document.db.list()
    const items = documents.filter(document =>
      document.fsPath && host.collection.getByFsPath(document.fsPath)?.name === target.collection,
    )

    options.value = buildRelationOptions(items, target)
  }
  catch {
    options.value = []
  }
  finally {
    isLoading.value = false
  }
}

watch(() => relation.value?.collection, loadOptions, { immediate: true })

const filteredOptions = computed(() => filterRelationOptions(options.value, search.value))

// Label of the stored value, so the field reads as a name instead of a slug
const selectedLabel = computed(() => options.value.find(option => option.value === model.value)?.label)

// A value matching no document is left untouched but flagged, never rewritten
const isUnresolved = computed(() => Boolean(model.value) && !isLoading.value && !selectedLabel.value)

const tooltip = computed(() => {
  if (isUnresolved.value) {
    return t('studio.form.relation.unresolved')
  }

  return selectedLabel.value || t('studio.form.relation.collectionHint', { collection: relation.value?.collection })
})

function selectOption(option: RelationOption) {
  model.value = option.value
  popoverOpen.value = false
  search.value = ''
}
</script>

<template>
  <div class="flex items-center gap-1">
    <UTooltip
      v-if="relation?.collection"
      :text="tooltip"
    >
      <div class="flex items-center justify-center size-6 bg-muted border border-muted rounded shrink-0">
        <UIcon
          v-if="isUnresolved"
          name="i-lucide-triangle-alert"
          class="text-warning"
        />
        <UIcon
          v-else-if="selectedLabel"
          name="i-lucide-link"
          class="text-muted"
        />
        <UIcon
          v-else
          name="i-lucide-link-2-off"
          class="text-dimmed"
        />
      </div>
    </UTooltip>

    <UInput
      v-model="model"
      :placeholder="$t('studio.form.relation.placeholder')"
      size="xs"
      class="flex-1"
    >
      <template
        v-if="relation?.collection"
        #trailing
      >
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
                :placeholder="$t('studio.form.relation.searchPlaceholder')"
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
                v-else-if="filteredOptions.length > 0"
                class="flex flex-col gap-0.5 max-h-48 overflow-y-auto"
              >
                <button
                  v-for="option in filteredOptions"
                  :key="option.value"
                  type="button"
                  class="flex flex-col items-start text-left px-2 py-1 rounded cursor-pointer hover:bg-elevated"
                  :class="{ 'bg-elevated': option.value === model }"
                  @click="selectOption(option)"
                >
                  <span class="text-xs text-highlighted truncate max-w-full">{{ option.label }}</span>
                  <span class="text-[10px] text-dimmed font-mono truncate max-w-full">{{ option.value }}</span>
                </button>
              </div>

              <p
                v-else
                class="text-xs text-muted text-center py-4"
              >
                {{ search ? $t('studio.form.relation.noResultsFound') : $t('studio.form.relation.noDocumentsAvailable', { collection: relation.collection }) }}
              </p>

              <p
                v-if="!isLoading && filteredOptions.length > 0"
                class="text-xs text-dimmed mt-2"
              >
                {{ $t('studio.form.relation.optionCount', { count: filteredOptions.length, total: options.length }, options.length) }}
              </p>
            </div>
          </template>
        </UPopover>
      </template>
    </UInput>
  </div>
</template>
