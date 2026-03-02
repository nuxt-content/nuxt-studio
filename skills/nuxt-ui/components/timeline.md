# Timeline

A component that displays a sequence of events with dates, titles, icons or avatars.

## Key Props

- `items`: as an array of objects with the following properties:

- `date?: string`{lang="ts-type"}
- `title?: string`{lang="ts-type"}
- `description?: AvatarProps`{lang="ts-type"}
- `icon?: string`{lang="ts-type"}
- `avatar?: AvatarProps`{lang="ts-type"}
- `value?: string | number`{lang="ts-type"}
- [`slot?: string`{lang="ts-type"}](#with-custom-slot)
- `class?: any`{lang="ts-type"}
- `ui?: { item?: ClassNameValue, container?: ClassNameValue, indicator?: ClassNameValue, separator?: ClassNameValue, wrapper?: ClassNameValue, date?: ClassNameValue, title?: ClassNameValue, description?: ClassNameValue }`{lang="ts-type"}

## ::component-code

ignore:

- items
- class
- defaultValue
  external:
- items
  externalTypes:
- TimelineItem[]
  props:
  defaultValue: 2
  items: - date: 'Mar 15, 2025'
  title: 'Project Kickoff'
  description: 'Kicked off the project with team alignment.
- `color`: to change the color of the active items in a Timeline.
- `size`: to change the size of the Timeline.
- `orientation`: to change the orientation of the Timeline.
- `ui`: to create a Timeline with alternating layout.
- `slot`:

## Usage

```vue
<UTimeline
  <!-- props here -->
/>
```
