# Theming

## Semantic Colors

| Color       | Default | Purpose                                     |
| ----------- | ------- | ------------------------------------------- |
| `primary`   | green   | CTAs, active states, brand, important links |
| `secondary` | blue    | Secondary buttons, alternatives             |
| `success`   | green   | Success messages, positive states           |
| `info`      | blue    | Info alerts, help text                      |
| `warning`   | yellow  | Warnings, pending states                    |
| `error`     | red     | Errors, destructive actions                 |
| `neutral`   | slate   | Text, borders, disabled states              |

## Configuring Colors

### Nuxt (app.config.ts)

```ts
// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'indigo',
      secondary: 'violet',
      success: 'emerald',
      error: 'rose'
    }
  }
})
```

### Vue (vite.config.ts)

```ts
ui({
  ui: {
    colors: {
      primary: 'indigo',
      secondary: 'violet'
    }
  }
})
```

## Adding Custom Colors

1. Register in theme config:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'tertiary'] // Add new color
    }
  }
})
```

2. Define in CSS (all 11 shades required):

```css
@theme {
  --color-tertiary-50: #fef2f2;
  --color-tertiary-100: #fee2e2;
  --color-tertiary-200: #fecaca;
  --color-tertiary-300: #fca5a5;
  --color-tertiary-400: #f87171;
  --color-tertiary-500: #ef4444;
  --color-tertiary-600: #dc2626;
  --color-tertiary-700: #b91c1c;
  --color-tertiary-800: #991b1b;
  --color-tertiary-900: #7f1d1d;
  --color-tertiary-950: #450a0a;
}
```

3. Assign and use:

```ts
// app.config.ts
export default defineAppConfig({
  ui: { colors: { tertiary: 'tertiary' } }
})
```

```vue
<UButton color="tertiary">Custom Color</UButton>
```

## CSS Variables

### Text Utilities

| Class              | Light | Dark | Use                       |
| ------------------ | ----- | ---- | ------------------------- |
| `text-dimmed`      | 400   | 500  | Placeholders, hints       |
| `text-muted`       | 500   | 400  | Secondary text            |
| `text-toned`       | 600   | 300  | Subtitles                 |
| `text-default`     | 700   | 200  | Body text                 |
| `text-highlighted` | 900   | 100  | Headings, emphasis        |
| `text-inverted`    | 50    | 950  | On dark/light backgrounds |

### Background Utilities

| Class         | Light | Dark | Use               |
| ------------- | ----- | ---- | ----------------- |
| `bg-default`  | white | 900  | Page background   |
| `bg-muted`    | 50    | 800  | Subtle sections   |
| `bg-elevated` | white | 800  | Cards, modals     |
| `bg-accented` | 100   | 700  | Hover states      |
| `bg-inverted` | 900   | 100  | Inverted sections |

### Border Utilities

| Class             | Light | Dark |
| ----------------- | ----- | ---- |
| `border-default`  | 200   | 800  |
| `border-muted`    | 100   | 800  |
| `border-accented` | 200   | 700  |
| `border-inverted` | 900   | 100  |

### Global Variables

```css
:root {
  --ui-radius: 0.25rem; /* Base border radius */
  --ui-container: 80rem; /* Container max-width */
  --ui-header-height: 4rem; /* Header height */
}
```

## Custom CSS Variables

```css
/* assets/css/main.css */
:root {
  --ui-primary: var(--ui-color-primary-700);
  --ui-radius: 0.5rem;
}
.dark {
  --ui-primary: var(--ui-color-primary-200);
}
```

## Solid Colors (Black/White)

Can't use `primary: 'black'` - set in CSS:

```css
:root {
  --ui-primary: black;
}
.dark {
  --ui-primary: white;
}
```

## Tailwind Variants Override

### Global Override (app.config.ts)

```ts
export default defineAppConfig({
  ui: {
    button: {
      slots: {
        base: 'font-bold rounded-full'
      },
      variants: {
        size: {
          md: { base: 'px-6 py-3' }
        }
      },
      compoundVariants: [{
        color: 'neutral',
        variant: 'outline',
        class: { base: 'ring-2' }
      }],
      defaultVariants: {
        color: 'neutral',
        variant: 'outline'
      }
    }
  }
})
```

### Per-Component Override

```vue
<!-- ui prop overrides slots -->
<UButton :ui="{ base: 'font-mono' }">Custom</UButton>

<!-- class prop overrides root/base slot -->
<UButton class="rounded-none">Square</UButton>
```

## Matching Theme Structure in app.config

**CRITICAL**: Components have two theme structure patterns. Your app.config MUST match the component's theme structure.

### Pattern 1: Slots-Based Themes (Most Components)

Components like Button, Card, Input, Select use `slots:` in their theme:

```ts
// Component theme (Button, Card, etc.)
export default {
  slots: {
    base: '...',
    root: '...',
    icon: '...'
  }
}
```

**app.config usage**:

```ts
ui: {
  button: {
    slots: { base: 'font-bold' }  // ✅ Match slots structure
  }
}
```

### Pattern 2: Flat Base Themes (Container, Skeleton, etc.)

Components like Container, Skeleton, Form, Main use flat `base:` in their theme:

```ts
// Component theme (Container, Skeleton, etc.)
export default {
  base: 'w-full max-w-container'
}
```

**app.config usage**:

```ts
ui: {
  container: {
    base: 'max-w-lg'  // ✅ Match flat structure
  }
}
```

### Common Mistake

```ts
// ❌ WRONG - Don't use slots for flat-base components
ui: {
  container: {
    slots: { base: 'max-w-lg' }  // TypeScript error!
  }
}

// ❌ WRONG - Don't use flat for slots-based components
ui: {
  button: {
    base: 'font-bold'  // Won't work correctly
  }
}
```

### How to Check Component Structure

1. Check component docs: https://ui.nuxt.com/components/[component]
2. Look at "Theme" section - shows the structure
3. Match that structure in your app.config

## Component Theme Structure

```ts
// Each component has slots, variants, compoundVariants, defaultVariants
export default {
  slots: {
    root: 'relative',
    base: 'px-4 py-2',
    icon: 'size-5'
  },
  variants: {
    color: {
      primary: { base: 'bg-primary text-inverted' },
      neutral: { base: 'bg-neutral text-default' }
    },
    size: {
      sm: { base: 'text-sm', icon: 'size-4' },
      md: { base: 'text-base', icon: 'size-5' },
      lg: { base: 'text-lg', icon: 'size-6' }
    }
  },
  defaultVariants: {
    color: 'primary',
    size: 'md'
  }
}
```

## Dark Mode

Handled by `@nuxtjs/color-mode`. Access via:

```ts
const colorMode = useColorMode()
colorMode.preference = 'dark' // 'light', 'dark', 'system'
```

```vue
<UColorModeButton /> <!-- Toggle button -->
<UColorModeSelect /> <!-- Dropdown select -->
```

## Best Practices

| Do                                     | Don't                         |
| -------------------------------------- | ----------------------------- |
| Use semantic colors                    | Hardcode hex values           |
| Override via app.config                | Modify source theme files     |
| Use CSS variables for custom colors    | Skip dark mode variants       |
| Define all 11 shades for custom colors | Use partial shade definitions |
