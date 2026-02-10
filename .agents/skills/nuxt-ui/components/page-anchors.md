# PageAnchors

A list of anchors to be displayed in the page.

## Key Props

- `links`: as an array of objects with the following properties:

- `label: string`{lang="ts-type"}
- `icon?: string`{lang="ts-type"}
- `class?: any`{lang="ts-type"}
- `ui?: { item?: ClassNameValue, link?: ClassNameValue, linkLabel?: ClassNameValue, linkLabelExternalIcon?: ClassNameValue, linkLeading?: ClassNameValue, linkLeadingIcon?: ClassNameValue }`{lang="ts-type"}

You can pass any property from the [Link](/docs/components/link#props) component such as `to`, `target`, etc.

## Usage

```vue
<UPageAnchors
  <!-- props here -->
/>
```
