# EditorMentionMenu

A mention menu that displays user suggestions when typing the @ character in the editor.

## Key Props

- `items`: as an array of objects with the following properties:

- `label: string`{lang="ts-type"}
- `avatar?: AvatarProps`{lang="ts-type"}
- `icon?: string`{lang="ts-type"}
- `description?: string`{lang="ts-type"}
- `disabled?: boolean`{lang="ts-type"}

## ::component-example

elevated: true
collapse: true
name: 'editor-mention-menu-items-example'
class: 'p-8'

---

::

::note
You can also pass an array of arrays to the `items` prop to create separated groups of items.

- `char`: to change the trigger character.
- `options`: to customize the positioning behavior using [Floating UI options](https://floating-ui.

## Usage

```vue
<UEditorMentionMenu
  <!-- props here -->
/>
```
