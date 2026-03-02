# ScrollArea

Creates scrollable containers with optional virtualization for large lists.

> Based on [Reka UI ScrollArea](https://reka-ui.com/docs/components/scroll-area)

## Key Props

- `orientation`: to control scroll direction (`'vertical'` or `'horizontal'`).
- `items`: array of data to render within the scrollable area.
- `virtualize`: enables performance optimization for large datasets (renders only visible items). Supports `estimateSize`, `lanes`, `gap`.
- `as`: specifies the underlying HTML element or component (defaults to `'div'`).
- `ui`: customization object for styling root, viewport, and items.

## Usage

```vue
<UScrollArea
  <!-- props here -->
/>
```
