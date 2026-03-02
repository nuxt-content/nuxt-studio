# Modal

A dialog window that can be used to display a message or request user input.

> Based on [Reka UI Modal](https://reka-ui.com/docs/components/dialog)

## Key Props

- `title`: to set the title of the Modal's header.
- `description`: to set the description of the Modal's header.
- `close`: to customize or hide the close button (with `false` value) displayed in the Modal's header.
- `transition`: to control whether the Modal is animated or not.
- `overlay`: to control whether the Modal has an overlay or not.
- `modal`: to control whether the Modal blocks interaction with outside content.
- `dismissible`: to control whether the Modal is dismissible when clicking outside of it or pressing escape.
- `scrollable`: to make the Modal's content scrollable within the overlay.
- `fullscreen`: to make the Modal fullscreen.

## Usage

```vue
<UModal
  <!-- props here -->
/>
```

## Slots

- `#content`
- `#header`
- `#body`
- `#footer`
