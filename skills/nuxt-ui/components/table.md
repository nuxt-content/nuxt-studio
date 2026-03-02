# Table

A responsive table element to display data in rows and columns.

## Key Props

- `data`: as an array of objects, the columns will be generated based on the keys of the objects.
- `columns`: as an array of [ColumnDef](https://tanstack.
- `meta`: as an object ([TableMeta](https://tanstack.
- `loading`: to display a loading state, the `loading-color` prop to change its color and the `loading-animation` prop to change its animation.
- `sticky`: to make the header or footer sticky.
- `virtualize`: to enable virtualization for large datasets as a boolean or an object with options like `{ estimateSize: 65, overscan: 12 }`.

## Usage

```vue
<UTable
  <!-- props here -->
/>
```
