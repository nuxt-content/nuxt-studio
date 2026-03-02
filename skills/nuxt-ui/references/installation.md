# Installation

## Nuxt Installation

```bash
pnpm add @nuxt/ui
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css']
})
```

```css
/* assets/css/main.css */
@import 'tailwindcss';
@import '@nuxt/ui';
```

**Critical**: Wrap app in UApp for Toast, Tooltip, and overlays to work:

```vue
<!-- app.vue -->
<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
```

### pnpm Gotcha

If using pnpm, either:

1. Add `shamefully-hoist=true` to `.npmrc`, OR
2. Install tailwindcss explicitly: `pnpm add tailwindcss`

## Vue Installation (Vite)

```bash
pnpm add @nuxt/ui
```

```ts
import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), ui()]
})
```

```ts
import ui from '@nuxt/ui/vue-plugin'
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)
app.use(ui)
app.mount('#app')
```

```css
/* assets/main.css */
@import 'tailwindcss';
@import '@nuxt/ui';
```

**Critical**: Add `isolate` class to root for overlay stacking:

```vue
<!-- App.vue -->
<template>
  <div class="isolate">
    <UApp>
      <RouterView />
    </UApp>
  </div>
</template>
```

### Auto-imports

Vue generates `auto-imports.d.ts` and `components.d.ts`. Add to `.gitignore`:

```gitignore
auto-imports.d.ts
components.d.ts
```

## Module Options

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  ui: {
    prefix: 'U', // Component prefix (default 'U')
    fonts: true, // Enable @nuxt/fonts
    colorMode: true, // Enable @nuxtjs/color-mode
    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'],
      transitions: true, // transition-colors on components
      defaultVariants: {
        color: 'primary',
        size: 'md'
      },
      prefix: '' // Tailwind CSS prefix (v4.2+) - ensures prefixed utilities work
    },
    mdc: false, // Force Prose components
    content: false, // Force UContent* components
    experimental: {
      componentDetection: false // Tree-shake unused components (v4.1+) - auto-generates CSS only for used components
    }
  }
})
```

## Vue Vite Options

```ts
// vite.config.ts
ui({
  prefix: 'U',
  colorMode: true,
  inertia: true, // Inertia.js support
  theme: {
    colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'],
    transitions: true,
    defaultVariants: { color: 'primary', size: 'md' },
    prefix: ''
  },
  ui: {
    colors: { primary: 'green' }, // Runtime color config
    button: { /* theme overrides */ }
  }
})
```

## Auto-installed Modules

Nuxt UI automatically installs:

- `@nuxt/icon` - Icon system
- `@nuxt/fonts` - Web fonts (if `fonts: true`)
- `@nuxtjs/color-mode` - Dark mode (if `colorMode: true`)

## Common Issues

| Issue                     | Solution                                           |
| ------------------------- | -------------------------------------------------- |
| Tailwind not found (pnpm) | Add `shamefully-hoist=true` or install tailwindcss |
| Overlays not showing      | Wrap app in `<UApp>`                               |
| Vue overlays broken       | Add `isolate` class to root element                |
| Icons not loading         | Check @nuxt/icon is installed                      |
| Dark mode not working     | Ensure `colorMode: true` in config                 |

## Performance Features (v4.1+)

### Component Virtualization

Large datasets in CommandPalette, InputMenu, SelectMenu, Table, and Tree automatically use virtualization for better performance.

### Experimental Component Detection

Enable `experimental.componentDetection` to auto-generate CSS only for components you actually use:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ui: {
    experimental: {
      componentDetection: true
    }
  }
})
```

**Benefits:** Smaller CSS bundle, faster builds, reduced unused styles.

### Tailwind CSS Prefix Support (v4.2+)

Avoid style conflicts in complex apps:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ui: {
    theme: {
      prefix: 'ui-' // Prefixes all Tailwind utilities
    }
  }
})
```

**Result:** Components use `ui-bg-primary` instead of `bg-primary`.

## Best Practices

| Do                         | Don't                     |
| -------------------------- | ------------------------- |
| Wrap in UApp first         | Forget UApp wrapper       |
| Use semantic colors        | Hardcode color values     |
| Import CSS correctly       | Skip @nuxt/ui import      |
| Check pnpm hoisting        | Ignore tailwindcss errors |
| Use component detection    | Ship unused component CSS |
| Use prefix in complex apps | Risk style conflicts      |
