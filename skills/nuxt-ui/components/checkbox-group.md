# CheckboxGroup

A set of checklist buttons to select multiple option from a list.

> Based on [Reka UI CheckboxGroup](https://reka-ui.com/docs/components/checkbox#group-root)

## Key Props

- `items`: as an array of strings or numbers:

## ::component-code

prettier: true
ignore:

- modelValue
- items
  external:
- items
- modelValue
  props:
  modelValue: - 'System'
  items: - 'System' - 'Light' - 'Dark'

---

::

You can also pass an array of objects with the following properties:

- `label?: string`{lang="ts-type"}
- `description?: string`{lang="ts-type"}
- [`value?: string`{lang="ts-type"}](#value-key)
- `disabled?: boolean`{lang="ts-type"}
- `class?: any`{lang="ts-type"}
- `ui?: { item?: ClassNameValue, container?: ClassNameValue, base?: ClassNameValue, 'indicator'?: ClassNameValue, icon?: ClassNameValue, wrapper?: ClassNameValue, label?: ClassNameValue, description?: ClassNameValue }`{lang="ts-type"}

## ::component-code

ignore:

- modelValue
- items
  external:
- items
- modelValue
  externalTypes:
- CheckboxGroupItem[]
  props:
  modelValue: - 'system'
  items: - label: 'System'
  description: 'This is the first option.
- `legend`: to set the legend of the CheckboxGroup.
- `color`: to change the color of the CheckboxGroup.
- `variant`: to change the variant of the CheckboxGroup.
- `size`: to change the size of the CheckboxGroup.
- `orientation`: to change the orientation of the CheckboxGroup.
- `indicator`: to change the position or hide the indicator.
- `disabled`: to disable the CheckboxGroup.

## Usage

```vue
<UCheckboxGroup
  <!-- props here -->
/>
```
