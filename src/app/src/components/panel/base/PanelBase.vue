<script setup lang="ts">
import PanelBaseHeader from './PanelBaseHeader.vue'
import PanelBaseFooter from './PanelBaseFooter.vue'

defineProps<{
  title?: string
}>()

const open = defineModel<boolean>()

function onBeforeEnter(el: Element) {
  const element = el as HTMLElement
  element.style.transform = 'translateX(-100%)'
  element.style.opacity = '0'
}

function onEnter(el: Element, done: () => void) {
  const element = el as HTMLElement

  element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out'

  // Small delay for the browser to render the initial state (else transition is not applied on enter)
  setTimeout(() => {
    element.style.transform = 'translateX(0)'
    element.style.opacity = '1'
  }, 10)

  setTimeout(done, 300)
}

function onLeave(el: Element, done: () => void) {
  const element = el as HTMLElement

  element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out'
  element.style.transform = 'translateX(-100%)'
  element.style.opacity = '0'

  setTimeout(done, 300)
}
</script>

<template>
  <Transition
    name="slide"
    :css="false"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @leave="onLeave"
  >
    <div
      v-if="open"
      class="fixed w-112 top-0 bottom-0 left-0 overflow-y-auto border-r border-gray-200 bg-white"
    >
      <PanelBaseHeader />

      <div class="min-h-[calc(100vh-var(--ui-header-height)-var(--ui-footer-height))]">
        <slot />
      </div>

      <PanelBaseFooter />
    </div>
  </Transition>
</template>
