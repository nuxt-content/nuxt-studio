# Composables

## useToast

Show notifications. Requires `<UApp>` wrapper.

```ts
const toast = useToast()

// Add toast
toast.add({
  title: 'Success',
  description: 'Item saved',
  color: 'success',
  icon: 'i-heroicons-check-circle',
  timeout: 5000
})

// Remove specific toast
toast.remove('toast-id')

// Clear all toasts
toast.clear()
```

See overlays.md for full toast options.

## useOverlay

Programmatically create modals, slidelovers, drawers.

```ts
const overlay = useOverlay()

// Create modal
const modal = overlay.create(MyModalComponent, {
  props: { title: 'Confirm' },
  modal: true // Default: true
})

// Wait for result
const result = await modal.result

// Close programmatically
modal.close(returnValue)
```

### Confirm Dialog Pattern

```vue
<!-- ConfirmDialog.vue -->
<script setup>
const props = defineProps<{ title: string; message: string }>()
const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <UModal :open="true">
    <template #header>{{ title }}</template>
    <p>{{ message }}</p>
    <template #footer>
      <UButton variant="ghost" @click="emit('cancel')">Cancel</UButton>
      <UButton color="error" @click="emit('confirm')">Confirm</UButton>
    </template>
  </UModal>
</template>
```

```ts
// Usage
const overlay = useOverlay()

async function confirmDelete() {
  const modal = overlay.create(ConfirmDialog, {
    props: { title: 'Delete?', message: 'This cannot be undone.' },
    events: {
      confirm: () => modal.close(true),
      cancel: () => modal.close(false)
    }
  })

  if (await modal.result) {
    // Delete item
  }
}
```

## defineShortcuts

Define keyboard shortcuts.

```ts
defineShortcuts({
  // Single key
  escape: () => closeModal(),

  // Modifier + key (meta = Cmd on Mac, Ctrl on Windows)
  meta_k: () => openSearch(),
  meta_shift_p: () => openCommandPalette(),

  // Ctrl specific
  ctrl_s: () => save(),

  // Alt/Option
  alt_n: () => newItem(),

  // Arrow keys
  arrowup: () => navigateUp(),
  arrowdown: () => navigateDown(),

  // With condition
  meta_enter: {
    handler: () => submit(),
    whenever: [isFormValid]
  }
})
```

### Shortcut Syntax

| Key     | Meaning                    |
| ------- | -------------------------- |
| `meta`  | Cmd (Mac) / Ctrl (Windows) |
| `ctrl`  | Ctrl key                   |
| `alt`   | Alt / Option key           |
| `shift` | Shift key                  |
| `_`     | Key separator              |

### Extract Shortcuts (for display)

```ts
const shortcuts = extractShortcuts({
  meta_k: () => {},
  escape: () => {}
})
// Returns: { meta_k: { key: 'K', metaKey: true }, ... }
```

## useKbd

Detect current keyboard state.

```ts
const kbd = useKbd()

// Reactive state
kbd.meta // true if Cmd/Ctrl pressed
kbd.ctrl // true if Ctrl pressed
kbd.shift // true if Shift pressed
kbd.alt // true if Alt/Option pressed
```

## useScrollspy

Track scroll position for anchor navigation.

```ts
const { activeId } = useScrollspy({
  ids: ['section-1', 'section-2', 'section-3'],
  offset: 100 // Pixels from top
})

// activeId.value = 'section-2' (currently visible)
```

### With Table of Contents

```vue
<script setup>
const sections = ['intro', 'features', 'pricing']
const { activeId } = useScrollspy({ ids: sections })
</script>

<template>
  <nav>
    <a
      v-for="id in sections"
      :href="`#${id}`"
      :class="{ 'font-bold': activeId === id }"
    >
      {{ id }}
    </a>
  </nav>
</template>
```

## useFileUpload

Handle file uploads.

```ts
const { files, open, reset, remove } = useFileUpload({
  accept: 'image/*',
  multiple: true,
  maxFiles: 5,
  maxSize: 5 * 1024 * 1024 // 5MB
})

// Open file picker
open()

// Files selected
files.value // FileList

// Reset selection
reset()

// Remove specific file
remove(index)
```

### With UFileUpload

```vue
<script setup>
const { files, open, reset } = useFileUpload()
</script>

<template>
  <UFileUpload v-model="files" accept="image/*" @change="handleFiles">
    <template #default="{ dragover }">
      <div :class="{ 'border-primary': dragover }">
        Drop files here or <UButton @click="open">Browse</UButton>
      </div>
    </template>
  </UFileUpload>
</template>
```

## defineLocale

Define/extend locale for i18n.

```ts
// locales/es.ts
export default defineLocale({
  name: 'Español',
  code: 'es',
  messages: {
    select: {
      placeholder: 'Seleccionar...',
      noResults: 'Sin resultados'
    },
    pagination: {
      previous: 'Anterior',
      next: 'Siguiente'
    }
  }
})
```

### Extend Existing Locale

```ts
import en from '@nuxt/ui/locale/en'

export default extendLocale(en, {
  messages: {
    select: {
      placeholder: 'Choose an option...'
    }
  }
})
```

### Use in App

```vue
<script setup>
import es from '~/locales/es'
</script>

<template>
  <UApp :locale="es">
    <NuxtPage />
  </UApp>
</template>
```

## useFormField

Access form field context in custom components.

```ts
// Inside custom form component
const { name, error, disabled } = useFormField()

// name: field name from UFormField
// error: validation error message
// disabled: if field is disabled
```

### Custom Input Component

```vue
<script setup>
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue'])

const { error } = useFormField()
</script>

<template>
  <input
    :value="modelValue"
    :class="{ 'border-error': error }"
    @input="emit('update:modelValue', $event.target.value)"
  />
  <span v-if="error" class="text-error">{{ error }}</span>
</template>
```

## Quick Reference

| Composable         | Purpose                         |
| ------------------ | ------------------------------- |
| `useToast`         | Show notifications              |
| `useOverlay`       | Programmatic modals/slidelovers |
| `defineShortcuts`  | Keyboard shortcuts              |
| `useKbd`           | Keyboard state detection        |
| `useScrollspy`     | Track scroll for TOC            |
| `useFileUpload`    | File upload handling            |
| `defineLocale`     | i18n locale definition          |
| `extendLocale`     | Extend existing locale          |
| `useFormField`     | Form field context              |
| `extractShortcuts` | Parse shortcut definitions      |
