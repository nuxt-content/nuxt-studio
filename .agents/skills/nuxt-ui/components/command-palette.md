# CommandPalette

A command palette with full-text search powered by Fuse.js for efficient fuzzy matching.

> Based on [Reka UI CommandPalette](https://reka-ui.com/docs/components/listbox)

## Key Props

- `groups`: as an array of objects with the following properties:

- `id: string`{lang="ts-type"}
- `label?: string`{lang="ts-type"}
- `slot?: string`{lang="ts-type"}
- `items?: CommandPaletteItem[]`{lang="ts-type"}
- [`ignoreFilter?: boolean`{lang="ts-type"}](#with-ignore-filter)
- [`postFilter?: (searchTerm: string, items: T[]) => T[]`{lang="ts-type"}](#with-post-filtered-items)
- `highlightedIcon?: string`{lang="ts-type"}

::caution
You must provide an `id` for each group otherwise the group will be ignored.

- `multiple`: to allow multiple selections.
- `placeholder`: to change the placeholder text.
- `icon`: to customize the input [Icon](/docs/components/icon).
- `loading`: to show a loading icon on the CommandPalette.
- `close`: to display a [Button](/docs/components/button) to dismiss the CommandPalette.
- `back`: to customize or hide the back button (with `false` value) displayed when navigating into a submenu.
- `disabled`: to disable the CommandPalette.
- `virtualize`: to enable virtualization for large lists as a boolean or an object with options like `{ estimateSize: 32, overscan: 12 }`.
- `slot`:

## Usage

```vue
<UCommandPalette
  <!-- props here -->
/>
```

## Slots

- `#footer`
- `#item`
