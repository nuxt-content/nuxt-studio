# Overlays

**Prerequisite**: All overlays require `<UApp>` wrapper in app root.

## Toast (Notifications)

### Basic Usage

```vue
<script setup>
const toast = useToast()

function showToast() {
  toast.add({
    title: 'Success!',
    description: 'Your changes have been saved.',
    color: 'success',
    icon: 'i-heroicons-check-circle'
  })
}
</script>

<template>
  <UButton @click="showToast">Show Toast</UButton>
</template>
```

### Toast Options

```ts
toast.add({
  id: 'unique-id', // Custom ID (auto-generated if omitted)
  title: 'Title', // Toast title
  description: 'Details', // Toast body
  color: 'success', // primary, success, error, warning, info
  icon: 'i-heroicons-check', // Left icon
  avatar: { src: '...' }, // Avatar instead of icon
  timeout: 5000, // Auto-dismiss (0 = never)
  actions: [{ // Action buttons
    label: 'Undo',
    click: () => {}
  }],
  callback: () => {} // Called on dismiss
})
```

### Toast Types

```ts
// Success
toast.add({ title: 'Saved', color: 'success', icon: 'i-heroicons-check-circle' })

// Error
toast.add({ title: 'Error', color: 'error', icon: 'i-heroicons-x-circle' })

// Warning
toast.add({ title: 'Warning', color: 'warning', icon: 'i-heroicons-exclamation-triangle' })

// Info
toast.add({ title: 'Info', color: 'info', icon: 'i-heroicons-information-circle' })

// Remove toast
toast.remove('toast-id')

// Clear all
toast.clear()
```

## Modal

### Basic Modal

```vue
<script setup>
const isOpen = ref(false)
</script>

<template>
  <UButton @click="isOpen = true">Open Modal</UButton>

  <UModal v-model:open="isOpen">
    <template #header>
      <h3>Modal Title</h3>
    </template>

    <p>Modal content goes here...</p>

    <template #footer>
      <UButton variant="ghost" @click="isOpen = false">Cancel</UButton>
      <UButton @click="save">Save</UButton>
    </template>
  </UModal>
</template>
```

### Modal Props

```vue
<UModal
  v-model:open="isOpen"
  title="Modal Title"          <!-- Alternative to #header slot -->
  description="Subtitle"       <!-- Below title -->
  :close="true"                <!-- Show close button -->
  :close-icon="'i-heroicons-x-mark'"
  :overlay="true"              <!-- Show backdrop -->
  :transition="true"           <!-- Enable animation -->
  :prevent-close="false"       <!-- Prevent close on overlay click -->
  fullscreen                   <!-- Full screen mode -->
>
```

### Programmatic Modal (useOverlay)

```vue
<script setup>
const overlay = useOverlay()

async function openConfirm() {
  const modal = overlay.create(ConfirmModal, {
    props: { title: 'Confirm action?' },
    events: {
      confirm: () => modal.close(true),
      cancel: () => modal.close(false)
    }
  })

  const result = await modal.result
  if (result) {
    // User confirmed
  }
}
</script>
```

## Slideover

Side panel overlay (from edge of screen).

```vue
<script setup>
const isOpen = ref(false)
</script>

<template>
  <UButton @click="isOpen = true">Open Slideover</UButton>

  <USlideover v-model:open="isOpen" title="Settings" side="right">
    <div class="p-4">
      Settings content...
    </div>
  </USlideover>
</template>
```

### Slideover Props

```vue
<USlideover
  v-model:open="isOpen"
  title="Title"
  description="Subtitle"
  side="right"              <!-- left, right, top, bottom -->
  :overlay="true"
  :transition="true"
  :prevent-close="false"
>
```

## Drawer

Bottom sheet overlay (vaul-vue).

```vue
<script setup>
const isOpen = ref(false)
</script>

<template>
  <UButton @click="isOpen = true">Open Drawer</UButton>

  <UDrawer v-model:open="isOpen">
    <div class="p-4">
      Drawer content...
    </div>
  </UDrawer>
</template>
```

### Drawer Props

```vue
<UDrawer
  v-model:open="isOpen"
  title="Drawer Title"
  description="Subtitle"
  handle                     <!-- Show drag handle -->
  :should-scale-background="true"
  :close-threshold="0.25"    <!-- Swipe threshold to close -->
>
```

## Popover

```vue
<UPopover>
  <UButton>Open Popover</UButton>

  <template #content>
    <div class="p-4">
      Popover content
    </div>
  </template>
</UPopover>
```

### Popover Props

```vue
<UPopover
  :open="isOpen"
  side="bottom"              <!-- top, right, bottom, left -->
  align="center"             <!-- start, center, end -->
  :arrow="true"
  :delay="{ open: 0, close: 0 }"
>
```

## Tooltip

```vue
<UTooltip text="Helpful tip">
  <UButton icon="i-heroicons-question-mark-circle" />
</UTooltip>

<!-- With slot content -->
<UTooltip>
  <UButton>Hover me</UButton>
  <template #content>
    <p>Rich tooltip content</p>
  </template>
</UTooltip>
```

## DropdownMenu

```vue
<script setup>
const items = [
  { label: 'Edit', icon: 'i-heroicons-pencil', click: () => {} },
  { label: 'Duplicate', icon: 'i-heroicons-document-duplicate' },
  { type: 'separator' },
  { label: 'Delete', icon: 'i-heroicons-trash', color: 'error' }
]
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton icon="i-heroicons-ellipsis-vertical" variant="ghost" />
  </UDropdownMenu>
</template>
```

### Nested Items

```vue
<script setup>
const items = [
  { label: 'New', children: [
    { label: 'File', click: () => {} },
    { label: 'Folder', click: () => {} }
  ]},
  { label: 'Delete' }
]
</script>
```

## ContextMenu

Right-click menu.

```vue
<UContextMenu :items="items">
  <div class="h-40 border rounded flex items-center justify-center">
    Right-click here
  </div>
</UContextMenu>
```

## CommandPalette

Search-driven command menu (Fuse.js powered).

```vue
<script setup>
const isOpen = ref(false)

const groups = [{
  key: 'actions',
  label: 'Actions',
  items: [
    { label: 'New file', icon: 'i-heroicons-document-plus', click: () => {} },
    { label: 'New folder', icon: 'i-heroicons-folder-plus', click: () => {} }
  ]
}, {
  key: 'navigation',
  label: 'Navigation',
  items: [
    { label: 'Home', to: '/' },
    { label: 'Settings', to: '/settings' }
  ]
}]
</script>

<template>
  <UCommandPalette v-model:open="isOpen" :groups="groups" placeholder="Search..." />
</template>
```

### Keyboard Shortcut

```vue
<script setup>
defineShortcuts({
  meta_k: () => { isOpen.value = true }
})
</script>
```

## Best Practices

| Do                                     | Don't                       |
| -------------------------------------- | --------------------------- |
| Use useToast for notifications         | Build custom toast systems  |
| Use UModal for dialogs                 | Use alerts for complex UI   |
| Use Slideover for panels               | Use modals for side content |
| Use Drawer for mobile sheets           | Use slideover on mobile     |
| Use CommandPalette for search          | Build custom search UI      |
| Use programmatic overlays for confirms | Create confirm components   |
