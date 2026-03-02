# InputMenu

An autocomplete input with real-time suggestions.

> Based on [Reka UI InputMenu](https://reka-ui.com/docs/components/combobox)

## Key Props

- `items`: as an array of strings, numbers or booleans:

## ::component-code

prettier: true
ignore:

- modelValue
- items
  external:
- items
- modelValue
  props:
  modelValue: 'Backlog'
  items: - Backlog - Todo - In Progress - Done

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
- `ui?: { tagsItem?: ClassNameValue, tagsItemText?: ClassNameValue, tagsItemDelete?: ClassNameValue, tagsItemDeleteIcon?: ClassNameValue, label?: ClassNameValue, separator?: ClassNameValue, item?: ClassNameValue, itemLeadingIcon?: ClassNameValue, itemLeadingAvatarSize?: ClassNameValue, itemLeadingAvatar?: ClassNameValue, itemLeadingChip?: ClassNameValue, itemLeadingChipSize?: ClassNameValue, itemLabel?: ClassNameValue, itemTrailing?: ClassNameValue, itemTrailingIcon?: ClassNameValue }`{lang="ts-type"}

## ::component-code

ignore:

- modelValue.
- `multiple`: to allow multiple selections, the selected items will be displayed as tags.
- `placeholder`: to set a placeholder text.
- `content`: to control how the InputMenu content is rendered, like its `align` or `side` for example.
- `arrow`: to display an arrow on the InputMenu.
- `color`: to change the ring color when the InputMenu is focused.
- `variant`: to change the variant of the InputMenu.
- `size`: to change the size of the InputMenu.
- `icon`: to show an [Icon](/docs/components/icon) inside the InputMenu.
- `avatar`: to show an [Avatar](/docs/components/avatar) inside the InputMenu.

## Usage

```vue
<UInputMenu
  <!-- props here -->
/>
```

## Slots

- `#leading`
