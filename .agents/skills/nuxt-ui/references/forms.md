# Forms

## Form Components

| Component        | Purpose             | Key Props                                     | Version |
| ---------------- | ------------------- | --------------------------------------------- | ------- |
| `UInput`         | Text input          | `type`, `placeholder`, `icon`, `loading`      |         |
| `UTextarea`      | Multi-line text     | `rows`, `autoresize`, `maxrows`               |         |
| `USelect`        | Native select       | `options`, `placeholder`                      |         |
| `USelectMenu`    | Custom select       | `options`, `searchable`, `multiple`           |         |
| `UInputMenu`     | Autocomplete        | `options`, `searchable`                       |         |
| `UCheckbox`      | Single checkbox     | `label`, `description`                        |         |
| `UCheckboxGroup` | Multiple checkboxes | `items`, `orientation`                        |         |
| `URadioGroup`    | Radio options       | `items`, `orientation`                        |         |
| `USwitch`        | Toggle switch       | `label`, `description`, `on-icon`, `off-icon` |         |
| `USlider`        | Range slider        | `min`, `max`, `step`                          |         |
| `UPinInput`      | Code/OTP input      | `length`, `type`, `mask`                      |         |
| `UInputNumber`   | Number input        | `min`, `max`, `step`, `format-options`        |         |
| `UInputDate`     | Date picker         | `mode`, `range`, `locale`                     | v4.2+   |
| `UInputTime`     | Time picker         | `hour-cycle`, `minute-step`                   | v4.2+   |
| `UInputTags`     | Tag input           | `max`, `placeholder`                          |         |
| `UColorPicker`   | Color selection     | `format`, `swatches`                          |         |
| `UFileUpload`    | File upload         | `accept`, `multiple`, `max-files`             |         |

## Basic Input Examples

```vue
<script setup>
const email = ref('')
const bio = ref('')
const country = ref('')
</script>

<template>
  <!-- Text input -->
  <UInput v-model="email" type="email" placeholder="Email" icon="i-heroicons-envelope" />

  <!-- With validation state -->
  <UInput v-model="email" :color="emailError ? 'error' : undefined" />

  <!-- Textarea -->
  <UTextarea v-model="bio" placeholder="Bio" :rows="3" autoresize />

  <!-- Select -->
  <USelect v-model="country" :options="['USA', 'Canada', 'Mexico']" placeholder="Country" />
</template>
```

## SelectMenu (Custom Dropdown)

```vue
<script setup>
const selected = ref()
const options = [
  { label: 'John', value: 'john', avatar: { src: '/john.png' } },
  { label: 'Jane', value: 'jane', avatar: { src: '/jane.png' } }
]
</script>

<template>
  <USelectMenu v-model="selected" :options="options" searchable placeholder="Select user">
    <template #option="{ option }">
      <UAvatar v-bind="option.avatar" size="xs" />
      <span>{{ option.label }}</span>
    </template>
  </USelectMenu>
</template>
```

## Checkbox & Radio

```vue
<script setup>
const agreed = ref(false)
const plan = ref('free')
const features = ref([])
</script>

<template>
  <!-- Single checkbox -->
  <UCheckbox v-model="agreed" label="I agree to terms" description="Required" />

  <!-- Radio group -->
  <URadioGroup
    v-model="plan"
    :items="[
      { label: 'Free', value: 'free', description: '$0/mo' },
      { label: 'Pro', value: 'pro', description: '$10/mo' }
    ]"
  />

  <!-- Checkbox group -->
  <UCheckboxGroup
    v-model="features"
    :items="[
      { label: 'Dark mode', value: 'dark' },
      { label: 'Notifications', value: 'notifications' }
    ]"
  />
</template>
```

## Form Validation

Uses Standard Schema (Zod, Valibot, Yup, Joi, etc.)

### With Zod

```vue
<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  email: '',
  password: ''
})

const form = ref()

async function onSubmit() {
  await form.value.validate()
  // Submit logic
}
</script>

<template>
  <UForm ref="form" :schema="schema" :state="state" @submit="onSubmit">
    <UFormField name="email" label="Email">
      <UInput v-model="state.email" type="email" />
    </UFormField>

    <UFormField name="password" label="Password">
      <UInput v-model="state.password" type="password" />
    </UFormField>

    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```

### With Valibot

```vue
<script setup lang="ts">
import * as v from 'valibot'

const schema = v.object({
  email: v.pipe(v.string(), v.email('Invalid email')),
  password: v.pipe(v.string(), v.minLength(8, 'Min 8 characters'))
})

type Schema = v.InferOutput<typeof schema>

const state = reactive<Partial<Schema>>({
  email: '',
  password: ''
})
</script>

<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit">
    <!-- Same as above -->
  </UForm>
</template>
```

## UFormField Props

```vue
<UFormField
  name="email"              <!-- Field name (matches state key) -->
  label="Email"             <!-- Label text -->
  description="Your email"  <!-- Help text -->
  hint="Optional"           <!-- Right-aligned hint -->
  required                  <!-- Shows asterisk -->
  :help="error?.message"    <!-- Error message -->
>
  <UInput v-model="state.email" />
</UFormField>
```

## UFieldGroup (Group Fields)

```vue
<UFieldGroup label="Name">
  <UInput v-model="firstName" placeholder="First" />
  <UInput v-model="lastName" placeholder="Last" />
</UFieldGroup>
```

## Input States

```vue
<!-- Disabled -->
<UInput disabled placeholder="Disabled" />

<!-- Loading -->
<UInput :loading="true" placeholder="Loading..." />

<!-- With icon -->
<UInput icon="i-heroicons-magnifying-glass" placeholder="Search" />

<!-- Trailing icon -->
<UInput trailing-icon="i-heroicons-x-mark" placeholder="Clearable" />
```

## File Upload

```vue
<script setup>
const { files, open, reset } = useFileUpload()
</script>

<template>
  <UFileUpload v-model="files" accept="image/*" multiple :max-files="5">
    <UButton @click="open">Upload</UButton>
  </UFileUpload>
</template>
```

## Date & Time Pickers (v4.2+)

### Date Picker

```vue
<script setup>
const date = ref(new Date())
const range = ref({ start: new Date(), end: new Date() })
</script>

<template>
  <!-- Single date -->
  <UInputDate v-model="date" />

  <!-- Date range -->
  <UInputDate v-model="range" mode="range" />

  <!-- With locale -->
  <UInputDate v-model="date" locale="es" />
</template>
```

### Time Picker

```vue
<script setup>
import { Time } from '@internationalized/date'

const time = ref(new Time(12, 0))
</script>

<template>
  <!-- Basic time picker -->
  <UInputTime v-model="time" />

  <!-- 24-hour format -->
  <UInputTime v-model="time" hour-cycle="24" />

  <!-- Custom step (minutes) -->
  <UInputTime v-model="time" :minute-step="15" />
</template>
```

## Common Patterns

### Login Form

```vue
<UForm :schema="loginSchema" :state="state" @submit="login">
  <UFormField name="email" label="Email" required>
    <UInput v-model="state.email" type="email" icon="i-heroicons-envelope" />
  </UFormField>
  <UFormField name="password" label="Password" required>
    <UInput v-model="state.password" type="password" icon="i-heroicons-lock-closed" />
  </UFormField>
  <UButton type="submit" block :loading="loading">Sign in</UButton>
</UForm>
```

### Settings Form

```vue
<UForm :state="settings" @submit="save">
  <UFormField name="notifications" label="Notifications">
    <USwitch v-model="settings.notifications" label="Enable notifications" />
  </UFormField>
  <UFormField name="theme" label="Theme">
    <URadioGroup v-model="settings.theme" :items="themeOptions" />
  </UFormField>
  <UButton type="submit">Save</UButton>
</UForm>
```

## Best Practices

| Do                                | Don't                      |
| --------------------------------- | -------------------------- |
| Use UForm + UFormField            | Build custom form wrappers |
| Use Standard Schema (Zod/Valibot) | Write custom validation    |
| Use v-model on form inputs        | Manually sync form state   |
| Use `required` prop for asterisks | Add asterisks manually     |
| Use `description` for help text   | Use separate help elements |
