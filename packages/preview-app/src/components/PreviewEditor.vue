<script setup lang="ts">
import { ref, watch, toRaw } from 'vue'
import { decompressTree } from '@nuxt/content/runtime'
import { MDCEditorAST } from '@farnabaz/mdc-editor'

const props = defineProps<{
  content: any
  markdown: string
}>()

const modelValue = defineModel<any>()

const emit = defineEmits<{
  (e: 'update:content', content: any): void
  (e: 'update:markdown', markdown: string): void
  (e: 'revert'): void
  (e: 'commit'): void
}>()
const content = ref({})
const originalContent = ref({})

watch(() => props.content, (value) => {
  if (!value) {
    content.value = {}
    return
  }
  if (value.body?.type === 'minimark') {
    content.value = {
      ...value,
      body: decompressTree(value?.body),
      id: undefined,
      extension: undefined,
      stem: undefined,
      path: undefined,
      __hash__: undefined,
    }
  }
  else {
    content.value = {
      ...value,
      id: undefined,
      extension: undefined,
      stem: undefined,
      path: undefined,
      __hash__: undefined,
    }
  }
}, { immediate: true })

watch(() => modelValue.value, (value) => {
  if (value) {
    originalContent.value = props.content
  }
})

watch(content, async (value) => {
  emit('update:content', {
    ...toRaw(value),
    id: props.content.id,
    extension: props.content.extension,
    stem: props.content.stem,
    path: props.content.path,
    __hash__: props.content.__hash__,
  })
})

function discard() {
  emit('update:content', originalContent.value)
  modelValue.value = false
}

function revert() {
  emit('revert')
}

function confirm() {
  modelValue.value = false
}
</script>

<template>
  <Transition name="slide">
    <div
      v-if="modelValue"
      class="fixed top-0 bottom-0 right-0 w-112 h-full overflow-y-auto text-black dark:text-white bg-white dark:bg-neutral-900"
    >
      <!-- <USlideover
      v-model:open="modelValue"
      :portal="false"
      :ui="{ body: '!p-0'}"
    > -->
      <!-- <template #header> -->
      <div class="flex justify-between items-center p-2">
        <UButton
          label="Discard"
          icon="i-lucide-corner-up-left"
          color="neutral"
          variant="ghost"
          @click="discard"
        />

        <UButton
          label="Confirm"
          icon="i-lucide-check"
          color="neutral"
          variant="ghost"
          @click="confirm"
        />
      </div>
      <!-- </template> -->
      <!-- <template #footer>
        <UButton label="Save" icon="i-lucide-save" color="primary" variant="solid" />
      </template> -->
      <!-- <template #body> -->
      <!-- <MDCEditorAST v-model="content" /> -->
      <SimpleTextEditor v-model:document="content" />
      <!-- </template> -->
    <!-- </USlideover> -->
    </div>
  </Transition>
</template>

<style>
  .slide-leave-active,
.slide-enter-active {
  transition: 0.3s;
}
.slide-enter-from {
  transform: translate(100%, 0);
}
.slide-enter {
  transform: translate(0, 0);
}
.slide-leave-to {
  transform: translate(100%, 0);
}
</style>
