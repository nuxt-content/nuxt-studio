# Stepper

A set of steps that are used to indicate progress through a multi-step process.

> Based on [Reka UI Stepper](https://reka-ui.com/docs/components/stepper)

## Key Props

- `items`: as an array of objects with the following properties:

- `title?: string`{lang="ts-type"}
- `description?: AvatarProps`{lang="ts-type"}
- `content?: string`{lang="ts-type"}
- `icon?: string`{lang="ts-type"}
- `value?: string | number`{lang="ts-type"}
- `disabled?: boolean`{lang="ts-type"}
- [`slot?: string`{lang="ts-type"}](#with-custom-slot)
- `class?: any`{lang="ts-type"}
- `ui?: { item?: ClassNameValue, container?: ClassNameValue, trigger?: ClassNameValue, indicator?: ClassNameValue, icon?: ClassNameValue, separator?: ClassNameValue, wrapper?: ClassNameValue, title?: ClassNameValue, description?: ClassNameValue }`{lang="ts-type"}

## ::component-code

ignore:

- items
- class
  external:
- items
  externalTypes:
- StepperItem[]
  props:
  items: - title: 'Address'
  description: 'Add your address here'
  icon: 'i-lucide-house' - title: 'Shipping'
  description: 'Set your preferred shipping method'
  icon: 'i-lucide-truck' - title: 'Checkout'
  description: 'Confirm your order'
  class: 'w-full'

---

::

::note
Click on the items to navigate through the steps.

- `color`: to change the color of the Stepper.
- `size`: to change the size of the Stepper.
- `orientation`: to change the orientation of the Stepper.
- `disabled`: to disable navigation through the steps.
- `slot`:

## Usage

```vue
<UStepper
  <!-- props here -->
/>
```

## Slots

- `#content`
