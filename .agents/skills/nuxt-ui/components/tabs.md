# Tabs

A set of tab panels that are displayed one at a time.

> Based on [Reka UI Tabs](https://reka-ui.com/docs/components/tabs)

## Key Props

- `items`: as an array of objects with the following properties:

- `label?: string`{lang="ts-type"}
- `icon?: string`{lang="ts-type"}
- `avatar?: AvatarProps`{lang="ts-type"}
- `badge?: string | number | BadgeProps`{lang="ts-type"}
- `content?: string`{lang="ts-type"}
- `value?: string | number`{lang="ts-type"}
- `disabled?: boolean`{lang="ts-type"}
- [`slot?: string`{lang="ts-type"}](#with-custom-slot)
- `class?: any`{lang="ts-type"}
- `ui?: { trigger?: ClassNameValue, leadingIcon?: ClassNameValue, leadingAvatar?: ClassNameValue, leadingAvatarSize?: ClassNameValue, label?: ClassNameValue, trailingBadge?: ClassNameValue, trailingBadgeSize?: ClassNameValue, content?: ClassNameValue }`{lang="ts-type"}

## ::component-code

ignore:

- items
- class
  external:
- items
  externalTypes:
- TabsItem[]
  props:
  items: - label: Account
  icon: 'i-lucide-user'
  content: 'This is the account content.
- `color`: to change the color of the Tabs.
- `variant`: to change the variant of the Tabs.
- `size`: to change the size of the Tabs.
- `orientation`: to change the orientation of the Tabs.
- `slot`:

## Usage

```vue
<UTabs
  <!-- props here -->
/>
```

## Slots

- `#content`
