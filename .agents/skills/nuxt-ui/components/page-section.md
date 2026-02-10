# PageSection

A responsive section for your pages.

## Key Props

- `title`: to set the title of the section.
- `description`: to set the description of the section.
- `headline`: to set the headline of the section.
- `icon`: to set the icon of the section.
- `features`: to display a list of [PageFeature](/docs/components/page-feature) under the description as an array of objects with the following properties:

- `title?: string`{lang="ts-type"}
- `description?: string`{lang="ts-type"}
- `icon?: string`{lang="ts-type"}
- `orientation?: 'horizontal' | 'vertical'`{lang="ts-type"}

You can pass any property from the [Link](/docs/components/link#props) component such as `to`, `target`, etc.

- `links`: to display a list of [Button](/docs/components/button) under the description.
- `orientation`: to change the orientation with the default slot.
- `reverse`: to reverse the orientation of the default slot.

## Usage

```vue
<UPageSection
  <!-- props here -->
/>
```
