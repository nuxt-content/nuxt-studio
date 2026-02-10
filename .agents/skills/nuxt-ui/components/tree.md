# Tree

A tree view component to display and interact with hierarchical data structures.

> Based on [Reka UI Tree](https://reka-ui.com/docs/components/tree)

## Key Props

- `items`: as an array of objects with the following properties:

- `icon?: string`{lang="ts-type"}
- `label?: string`{lang="ts-type"}
- `trailingIcon?: string`{lang="ts-type"}
- `defaultExpanded?: boolean`{lang="ts-type"}
- `disabled?: boolean`{lang="ts-type"}
- `slot?: string`{lang="ts-type"}
- `children?: TreeItem[]`{lang="ts-type"}
- `onToggle?: (e: TreeItemToggleEvent<TreeItem>) => void`{lang="ts-type"}
- `onSelect?: (e: TreeItemSelectEvent<TreeItem>) => void`{lang="ts-type"}
- `class?: any`{lang="ts-type"}
- `ui?: { item?: ClassNameValue, itemWithChildren?: ClassNameValue, link?: ClassNameValue, linkLeadingIcon?: ClassNameValue, linkLabel?: ClassNameValue, linkTrailing?: ClassNameValue, linkTrailingIcon?: ClassNameValue, listWithChildren?: ClassNameValue }`{lang="ts-type"}

::note
A unique identifier is required for each item.

- `multiple`: to allow multiple item selections.
- `nested`: to control whether the Tree is rendered with nested structure or as a flat list.
- `color`: to change the color of the Tree.
- `size`: to change the size of the Tree.
- `disabled`: to prevent any user interaction with the Tree.
- `virtualize`: to enable virtualization for large lists as a boolean or an object with options like `{ estimateSize: 32, overscan: 12 }`.
- `slot`:

## Usage

```vue
<UTree
  <!-- props here -->
/>
```
