# FooterColumns

A list of links as columns to display in your Footer.

## Key Props

- `columns`: as an array of objects with the following properties:

- `label: string`{lang="ts-type"}
- `children?: FooterColumnLink[]`{lang="ts-type"}

Each column contains a `children` array of objects that define the links.

## Usage

```vue
<UFooterColumns
  <!-- props here -->
/>
```
