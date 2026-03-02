# SelectMenu

An advanced searchable select element.

> Based on [Reka UI SelectMenu](https://reka-ui.com/docs/components/combobox)

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
- [`type?: "label" | "separator" | "item"`{lang="ts-type"}](#with-items-type)
- [`icon?: string`{lang="ts-type"}](#with-icons-in-items)
- [`avatar?: AvatarProps`{lang="ts-type"}](#with-avatar-in-items)
- [`chip?: ChipProps`{lang="ts-type"}](#with-chip-in-items)
- `disabled?: boolean`{lang="ts-type"}
- `onSelect?: (e: Event) => void`{lang="ts-type"}
- `class?: any`{lang="ts-type"}
- `ui?: { label?: ClassNameValue, separator?: ClassNameValue, item?: ClassNameValue, itemLeadingIcon?: ClassNameValue, itemLeadingAvatarSize?: ClassNameValue, itemLeadingAvatar?: ClassNameValue, itemLeadingChipSize?: ClassNameValue, itemLeadingChip?: ClassNameValue, itemLabel?: ClassNameValue, itemTrailing?: ClassNameValue, itemTrailingIcon?: ClassNameValue }`{lang="ts-type"}

## ::component-code

ignore:

- modelValue.
- `multiple`: to allow multiple selections, the selected items will be separated by a comma in the trigger.
- `placeholder`: to set a placeholder text.
- `content`: to control how the SelectMenu content is rendered, like its `align` or `side` for example.
- `arrow`: to display an arrow on the SelectMenu.
- `color`: to change the ring color when the SelectMenu is focused.
- `variant`: to change the variant of the SelectMenu.
- `size`: to change the size of the SelectMenu.
- `icon`: to show an [Icon](/docs/components/icon) inside the SelectMenu.
- `avatar`: to display an [Avatar](/docs/components/avatar) inside the SelectMenu.

## Usage

```vue
<USelectMenu
  <!-- props here -->
/>
```

## Slots

- `#leading`
