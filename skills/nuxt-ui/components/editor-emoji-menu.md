# EditorEmojiMenu

An emoji picker menu that displays emoji suggestions when typing the : character in the editor.

## Key Props

- `items`: as an array of objects with the following properties:

- `name: string`{lang="ts-type"}
- `emoji: string`{lang="ts-type"}
- `shortcodes?: string[]`{lang="ts-type"}
- `tags?: string[]`{lang="ts-type"}
- `group?: string`{lang="ts-type"}
- `fallbackImage?: string`{lang="ts-type"}

## ::component-example

elevated: true
collapse: true
name: 'editor-emoji-menu-items-example'
class: 'p-8'

---

::

::note
You can also pass an array of arrays to the `items` prop to create separated groups of items.

- `char`: to change the trigger character.
- `options`: to customize the positioning behavior using [Floating UI options](https://floating-ui.

## Usage

```vue
<UEditorEmojiMenu
  <!-- props here -->
/>
```
