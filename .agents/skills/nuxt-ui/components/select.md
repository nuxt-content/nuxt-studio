# Select

A select element to choose from a list of options.

> Based on [Reka UI Select](https://reka-ui.com/docs/components/select)

## Key Props

- `items`: as an array of strings, numbers or booleans:

## ::component-code

prettier: true
ignore:

- modelValue
- items
- class
  external:
- items
- modelValue
  props:
  modelValue: 'Backlog'
  items: - Backlog - Todo - In Progress - Done
  class: 'w-48'

---

::

You can also pass an array of objects with the following properties:

- `label?: string`{lang="ts-type"}
- [`value?: string`{lang="ts-type"}](#value-key)
- [`type?: "label" | "separator" | "item"`{lang="ts-type"}](#with-items-type)
- [`icon?: string`{lang="ts-type"}](#with-icons-in-items)
- [`avatar?: AvatarProps`{lang="ts-type"}](#with-avatar-in-items)
- [`chip?: ChipProps`{lang="ts-type"}](#with-chip-in-items)
- `disabled?: boolean`{lang="ts-type"}
- `class?: any`{lang="ts-type"}
- `ui?: { label?: ClassNameValue, separator?: ClassNameValue, item?: ClassNameValue, itemLeadingIcon?: ClassNameValue, itemLeadingAvatarSize?: ClassNameValue, itemLeadingAvatar?: ClassNameValue, itemLeadingChipSize?: ClassNameValue, itemLeadingChip?: ClassNameValue, itemLabel?: ClassNameValue, itemTrailing?: ClassNameValue, itemTrailingIcon?: ClassNameValue }`{lang="ts-type"}

## ::component-code

ignore:

- modelValue
- items
- class
  external:
- items
- modelValue
  externalTypes:
- SelectItem[]
  props:
  modelValue: 'backlog'
  items: - label: 'Backlog'
  value: 'backlog' - label: 'Todo'
  value: 'todo' - label: 'In Progress'
  value: 'in_progress' - label: 'Done'
  value: 'done'
  class: 'w-48'

---

::

::caution
When using objects, you need to reference the `value` property of the object in the `v-model` directive or the `default-value` prop.

- `multiple`: to allow multiple selections, the selected items will be separated by a comma in the trigger.
- `placeholder`: to set a placeholder text.
- `content`: to control how the Select content is rendered, like its `align` or `side` for example.
- `arrow`: to display an arrow on the Select.
- `color`: to change the ring color when the Select is focused.
- `variant`: to change the variant of the Select.
- `size`: to change the size of the Select.
- `icon`: to show an [Icon](/docs/components/icon) inside the Select.
- `avatar`: to show an [Avatar](/docs/components/avatar) inside the Select.

## Usage

```vue
<USelect
  <!-- props here -->
/>
```

## Slots

- `#leading`
