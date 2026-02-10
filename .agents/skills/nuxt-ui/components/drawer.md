# Drawer

A drawer that smoothly slides in & out of the screen.

## Key Props

- `title`: to set the title of the Drawer's header.
- `description`: to set the description of the Drawer's header.
- `direction`: to control the direction of the Drawer.
- `inset`: to inset the Drawer from the edges.
- `handle`: to control whether the Drawer has a handle or not.
- `overlay`: to control whether the Drawer has an overlay or not.
- `modal`: to control whether the Drawer blocks interaction with outside content.
- `dismissible`: to control whether the Drawer is dismissible when clicking outside of it or pressing escape.

## Usage

```vue
<UDrawer
  <!-- props here -->
/>
```

## Slots

- `#content`
- `#header`
- `#body`
- `#footer`
