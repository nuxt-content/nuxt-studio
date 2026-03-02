# Module Development

Module anatomy, Kit utilities, and common patterns.

## defineNuxtModule

```ts
import { addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'

export interface ModuleOptions {
  apiKey?: string
  prefix?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxtjs/example',
    configKey: 'example',
    compatibility: { nuxt: '>=3.0.0' }
  },
  defaults: {
    apiKey: '',
    prefix: 'My'
  },
  hooks: {
    'app:error': err => console.error(err)
  },
  moduleDependencies: {
    '@nuxtjs/tailwindcss': { version: '>=6.0.0', optional: true }
  },
  // Or as async function (Nuxt 4.3+)
  async moduleDependencies(nuxt) {
    const needsSupport = nuxt.options.runtimeConfig.public?.feature
    return {
      '@nuxtjs/tailwindcss': needsSupport ? {} : { optional: true }
    }
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    addPlugin(resolve('./runtime/plugin'))
  }
})
```

User configures via `configKey`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/example'],
  example: { apiKey: 'xxx' }
})
```

## Critical: #imports in Published Modules

Auto-imports don't work in `node_modules`. Runtime files must explicitly import:

```ts
// src/runtime/composables/useMyFeature.ts

// Wrong - won't work in published module
// Right - explicit import
import { useRoute } from '#imports'

const route = useRoute()
const route = useRoute()
```

## Adding Plugins

```ts
import { addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    addPlugin(resolve('./runtime/plugin'))
  }
})
```

```ts
// src/runtime/plugin.ts
import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: { myHelper: (msg: string) => console.log(msg) }
  }
})
```

**Async plugins (Nuxt 4.3+):** Lazy-load build plugins:

```ts
import { addVitePlugin, addWebpackPlugin } from '@nuxt/kit'

export default defineNuxtModule({
  async setup() {
    // Lazy-load only the bundler plugin needed
    addVitePlugin(() => import('my-plugin/vite').then(r => r.default()))
    addWebpackPlugin(() => import('my-plugin/webpack').then(r => r.default()))
  }
})
```

## Adding Components

```ts
import { addComponent, addComponentsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // Single component
    addComponent({
      name: 'MyButton',
      filePath: resolve('./runtime/components/MyButton.vue')
    })

    // Or entire directory with prefix
    addComponentsDir({
      path: resolve('./runtime/components'),
      prefix: 'My' // <MyButton>, <MyCard>
    })
  }
})
```

## Adding Composables

```ts
import { addImports, addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // Single or multiple
    addImports([
      { name: 'useAuth', from: resolve('./runtime/composables/useAuth') },
      { name: 'useUser', from: resolve('./runtime/composables/useUser') }
    ])

    // Or entire directory
    addImportsDir(resolve('./runtime/composables'))
  }
})
```

## Adding Server Routes

```ts
import { addServerHandler, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    addServerHandler({
      route: '/api/_my-module/status',
      handler: resolve('./runtime/server/api/status.get')
    })
  }
})
```

**Always prefix routes:** `/api/_my-module/` avoids conflicts.

**Server imports (Nuxt 4.3+):** Use `#server` alias in server files:

```ts
// runtime/server/api/users.ts
import { helper } from '#server/utils/helper'  // Clean imports
```

## Runtime Config

```ts
export default defineNuxtModule({
  setup(options, nuxt) {
    // Public (client + server)
    nuxt.options.runtimeConfig.public.myModule = { apiUrl: options.apiUrl }

    // Private (server only)
    nuxt.options.runtimeConfig.myModule = { apiKey: options.apiKey }
  }
})
```

## Lifecycle Hooks

```ts
export default defineNuxtModule({
  hooks: {
    'pages:extend': (pages) => {
      pages.push({ name: 'custom', path: '/custom', file: resolve('./runtime/pages/custom.vue') })
    }
  },
  setup(options, nuxt) {
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.prerender ||= {}
      nitroConfig.prerender.routes ||= []
      nitroConfig.prerender.routes.push('/my-route')
    })

    // Cleanup on close
    nuxt.hook('close', async () => {
      await cleanup()
    })
  }
})
```

| Hook           | When               |
| -------------- | ------------------ |
| `ready`        | Nuxt initialized   |
| `modules:done` | All modules loaded |
| `pages:extend` | Modify pages array |
| `nitro:config` | Configure Nitro    |
| `close`        | Nuxt shutting down |

## Custom Hooks

```ts
export interface ModuleHooks {
  'my-module:init': (config: MyConfig) => void
}

declare module '#app' {
  interface RuntimeNuxtHooks extends ModuleHooks {}
}

export default defineNuxtModule({
  setup(options, nuxt) {
    nuxt.hook('modules:done', async () => {
      await nuxt.callHook('my-module:init', { foo: 'bar' })
    })
  }
})
```

## Virtual Files (Templates)

```ts
import { addTemplate, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  setup(options, nuxt) {
    addTemplate({
      filename: 'my-module/config.mjs',
      getContents: () => `export const config = ${JSON.stringify(options)}`
    })
  }
})
```

Import: `import { config } from '#build/my-module/config.mjs'`

## Type Declarations

```ts
import { addTypeTemplate, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  setup(options, nuxt) {
    addTypeTemplate({
      filename: 'types/my-module.d.ts',
      getContents: () => `
        declare module '#app' {
          interface NuxtApp { $myHelper: (msg: string) => void }
        }
        export {}
      `
    })
  }
})
```

## Logging & Errors

Use `consola.withTag` for consistent module logging:

```ts
import { consola } from 'consola'

const logger = consola.withTag('my-module')

export default defineNuxtModule({
  setup(options, nuxt) {
    logger.info('Initializing...')
    logger.warn('Deprecated option used')

    // Errors must include tag manually - consola doesn't add it
    if (!options.apiKey) {
      throw new Error('[my-module] `apiKey` option is required')
    }
  }
})
```

## Disabling Modules

**Set to `false` to disable (Nuxt 4.3+):**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  tailwindcss: false  // Disable the module
})
```

**Disable inherited layer modules:**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['../base-layer'],
  disabledModules: ['@nuxt/image', '@sentry/nuxt/module']
})
```

Only works for modules from layers, not root project modules.

## Local Modules

For project-specific modules:

```ts
// modules/my-local-module/index.ts
import { defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: { name: 'my-local-module' },
  setup(options, nuxt) {
    // Module logic
  }
})
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['./modules/my-local-module']
})
```

## Quick Reference

| Task             | Kit Function                            |
| ---------------- | --------------------------------------- |
| Add plugin       | `addPlugin()`                           |
| Add component    | `addComponent()` / `addComponentsDir()` |
| Add composable   | `addImports()` / `addImportsDir()`      |
| Add server route | `addServerHandler()`                    |
| Add server utils | `addServerImports()`                    |
| Virtual file     | `addTemplate()` / `addServerTemplate()` |
| Add types        | `addTypeTemplate()`                     |
| Add CSS          | `nuxt.options.css.push()`               |

## Resources

- [Nuxt Kit](https://nuxt.com/docs/api/kit)
- [Hooks](https://nuxt.com/docs/api/advanced/hooks)
