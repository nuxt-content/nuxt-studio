# Carousel

A carousel with motion and swipe built using Embla.

## Key Props

- `items`: as an array and render each item using the default slot:

## ::component-example

name: 'carousel-items-example'
class: 'p-8'

---

::

You can also pass an array of objects with the following properties:

- `class?: any`{lang="ts-type"}
- `ui?: { item?: ClassNameValue }`{lang="ts-type"}

You can control how many items are visible by using the [`basis`](https://tailwindcss.

- `orientation`: to change the orientation of the Progress.
- `arrows`: to display prev and next buttons.
- `dots`: to display a list of dots to scroll to a specific slide.
- `autoplay`: as a boolean or an object to configure the [Autoplay plugin](https://www.
- `fade`: as a boolean or an object to configure the [Fade plugin](https://www.

## Usage

```vue
<UCarousel
  <!-- props here -->
/>
```
