# Slideover

A dialog that slides in from any side of the screen.

> Based on [Reka UI Slideover](https://reka-ui.com/docs/components/dialog)

## Key Props

- `title`: to set the title of the Slideover's header.
- `description`: to set the description of the Slideover's header.
- `close`: to customize or hide the close button (with `false` value) displayed in the Slideover's header.
- `side`: to set the side of the screen where the Slideover will slide in from.
- `transition`: to control whether the Slideover is animated or not.
- `overlay`: to control whether the Slideover has an overlay or not.
- `modal`: to control whether the Slideover blocks interaction with outside content.
- `dismissible`: to control whether the Slideover is dismissible when clicking outside of it or pressing escape.

## Usage

```vue
<USlideover
  <!-- props here -->
/>
```

## Slots

- `#content`
- `#header`
- `#body`
- `#footer`
