# PricingPlan

A customizable pricing plan to display in a pricing page.

## Key Props

- `title`: to set the title of the PricingPlan.
- `description`: to set the description of the PricingPlan.
- `badge`: to display a [Badge](/docs/components/badge) next to the title of the PricingPlan.
- `price`: to set the price of the PricingPlan.
- `discount`: to set a discounted price that will be displayed alongside the original price (which will be shown with a strikethrough).
- `features`: as an array of string to display a list of features on the PricingPlan:

## ::component-code

prettier: true
hide:

- class
  ignore:
- title
- description
- price
- features
  props:
  title: 'Solo'
  description: 'For bootstrappers and indie hackers.
- `button`: with any property from the [Button](/docs/components/button) component to display a button at the bottom of the PricingPlan.
- `variant`: to change the variant of the PricingPlan.
- `orientation`: to change the orientation of the PricingPlan.
- `tagline`: to display a tagline text above the price.

## Usage

```vue
<UPricingPlan
  <!-- props here -->
/>
```
