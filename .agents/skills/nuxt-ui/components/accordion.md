# Accordion

A stacked set of collapsible panels.

> Based on [Reka UI Accordion](https://reka-ui.com/docs/components/accordion)

## Key Props

- `items`: as an array of objects with the following properties:

- `label?: string`{lang="ts-type"}
- `icon?: string`{lang="ts-type"}
- `trailingIcon?: string`{lang="ts-type"}
- `content?: string`{lang="ts-type"}
- `value?: string`{lang="ts-type"}
- `disabled?: boolean`{lang="ts-type"}
- [`slot?: string`{lang="ts-type"}](#with-custom-slot)
- `class?: any`{lang="ts-type"}
- `ui?: { item?: ClassNameValue, header?: ClassNameValue, trigger?: ClassNameValue, leadingIcon?: ClassNameValue, label?: ClassNameValue, trailingIcon?: ClassNameValue, content?: ClassNameValue, body?: ClassNameValue }`{lang="ts-type"}

## ::component-code

ignore:

- items
  external:
- items
  externalTypes:
- AccordionItem[]
  hide:
- class
  props:
  class: 'px-4'
  items: - label: 'Icons'
  icon: 'i-lucide-smile'
  content: 'You have nothing to do, @nuxt/icon will handle it automatically.
- `disabled`:
- `slot`:

## Usage

```vue
<UAccordion
  <!-- props here -->
/>
```

## Slots

- `#body`
- `#content`
