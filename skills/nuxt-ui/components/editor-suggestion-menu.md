# EditorSuggestionMenu

A command menu that displays formatting and action suggestions when typing the / character in the editor.

## Key Props

- `items`: as an array of objects with the following properties:

- [`kind?: "textAlign" | "heading" | "link" | "image" | "blockquote" | "bulletList" | "orderedList" | "codeBlock" | "horizontalRule" | "paragraph" | "clearFormatting" | "duplicate" | "delete" | "moveUp" | "moveDown" | "suggestion" | "mention" | "emoji"`{lang="ts-type"}](/docs/components/editor#handlers)
- `label?: string`{lang="ts-type"}
- `description?: string`{lang="ts-type"}
- `icon?: string`{lang="ts-type"}
- `type?: "label" | "separator"`{lang="ts-type"}
- `disabled?: boolean`{lang="ts-type"}

## ::component-example

elevated: true
collapse: true
name: 'editor-suggestion-menu-items-example'
class: 'p-8'

---

::

::note
You can also pass an array of arrays to the `items` prop to create separated groups of items.

- `char`: to change the trigger character.
- `options`: to customize the positioning behavior using [Floating UI options](https://floating-ui.

## Usage

```vue
<UEditorSuggestionMenu
  <!-- props here -->
/>
```
