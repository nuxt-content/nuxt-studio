# Nuxt Configuration

## When to Use

Configuring `nuxt.config.ts`, modules, auto-imports, runtime config, layers.

## Basic Structure

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],

  runtimeConfig: {
    // Private (server-only)
    apiSecret: process.env.API_SECRET,

    public: {
      // Public (client + server)
      apiBase: process.env.API_BASE || 'http://localhost:3000'
    }
  },

  app: {
    head: {
      title: 'My App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
```

## Runtime Config

Access runtime config in app:

```ts
// Server-side
const config = useRuntimeConfig()
console.log(config.apiSecret) // Available

// Client-side
const config = useRuntimeConfig()
console.log(config.public.apiBase) // Available
console.log(config.apiSecret) // undefined (private)
```

### Runtime Config Validation (Recommended)

Use `nuxt-safe-runtime-config` for type-safe runtime config with build-time validation:

```bash
npx nuxi module add nuxt-safe-runtime-config
```

**Benefits:**

- Build-time validation (catches missing env vars early)
- Optional runtime validation (validates when server starts)
- Auto-generated types (no manual type definitions needed)
- No manual env var checks required (schema handles validation)

**Example with Valibot:**

```ts
import { number, object, optional, string } from 'valibot'

export default defineNuxtConfig({
  modules: ['nuxt-safe-runtime-config'],

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    secretKey: process.env.SECRET_KEY,
    port: Number.parseInt(process.env.PORT || '3000'),
    public: {
      apiBase: process.env.PUBLIC_API_BASE,
      appName: 'My App',
    },
  },

  safeRuntimeConfig: {
    $schema: object({
      public: object({
        apiBase: string(),
        appName: optional(string()),
      }),
      databaseUrl: string(),
      secretKey: string(),
      port: optional(number()),
    }),
    validateAtRuntime: true, // Optional: validate when server starts
  },
})
```

**Usage:**

```ts
// Auto-typed from schema - no generics needed
const config = useSafeRuntimeConfig()
// config.public.apiBase is string
// config.databaseUrl is string
```

**No manual env checks needed:**

```ts
// ❌ Don't do this with nuxt-safe-runtime-config
if (!config.databaseUrl) throw new Error('Missing DATABASE_URL')

// ✅ Schema validation handles it automatically
// If env var is missing, build fails with detailed error
```

Works with Zod, ArkType, or any Standard Schema library. See: https://github.com/onmax/nuxt-safe-runtime-config

## Auto-Imports

Nuxt auto-imports from these directories:

- `components/` - Vue components
- `composables/` - Composition functions
- `utils/` - Utility functions
- `server/utils/` - Server utilities (server-only)

### Custom Auto-Imports

```ts
export default defineNuxtConfig({
  imports: {
    dirs: [
      'stores',
      'types'
    ]
  }
})
```

### Disable Auto-Import

```ts
export default defineNuxtConfig({
  imports: {
    autoImport: false
  }
})
```

## Modules

```ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    ['@nuxtjs/google-fonts', {
      families: {
        Inter: [400, 700]
      }
    }]
  ]
})
```

## App Config

For non-sensitive config exposed to client:

```ts
// app.config.ts
export default defineAppConfig({
  theme: {
    primaryColor: '#3b82f6',
    borderRadius: '0.5rem'
  }
})
```

Access in app:

```ts
const appConfig = useAppConfig()
console.log(appConfig.theme.primaryColor)
```

## TypeScript

```ts
export default defineNuxtConfig({
  typescript: {
    strict: true,
    typeCheck: true,
    shim: false
  }
})
```

## Build Configuration

```ts
export default defineNuxtConfig({
  build: {
    transpile: ['some-package']
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/styles/variables" as *;'
        }
      }
    }
  }
})
```

## Route Rules

Pre-render, cache, or customize routes:

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/api/**': { cors: true },
    '/admin/**': { ssr: false },
    '/blog/**': { swr: 3600 } // Cache for 1 hour
  }
})
```

## Experimental Features

```ts
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4
  },

  experimental: {
    typedPages: true,
    viewTransition: true
  }
})
```

## Nitro Config

Server engine configuration:

```ts
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel',
    compressPublicAssets: true,
    routeRules: {
      '/api/**': { cors: true }
    }
  }
})
```

## Layers

Extend or share configuration:

```ts
export default defineNuxtConfig({
  extends: [
    './base-layer'
  ]
})
```

## Environment Variables

Use `.env` file:

```env
API_SECRET=secret123
API_BASE=https://api.example.com
```

Access via runtimeConfig:

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    apiSecret: process.env.API_SECRET,
    public: {
      apiBase: process.env.API_BASE
    }
  }
})
```

## Best Practices

- **Use nuxt-safe-runtime-config** for runtime config with validation
- **Public vs private** - keep secrets in private runtimeConfig
- **App config** for non-sensitive client config
- **Route rules** for performance (prerender, cache, SWR)
- **Auto-imports** for cleaner code
- **TypeScript strict mode** for better DX

## Common Mistakes

| ❌ Wrong                   | ✅ Right                     |
| -------------------------- | ---------------------------- |
| Hardcoded API URLs         | Use runtimeConfig.public     |
| Secrets in app.config      | Use runtimeConfig (private)  |
| Import everything manually | Let Nuxt auto-import         |
| process.env in client code | Use useRuntimeConfig()       |
| Manual env var validation  | Use nuxt-safe-runtime-config |
| if (!config.x) throw error | Schema validation handles it |

## Resources

- Nuxt config: https://nuxt.com/docs/api/nuxt-config
- Runtime config: https://nuxt.com/docs/guide/going-further/runtime-config
- App config: https://nuxt.com/docs/guide/directory-structure/app-config
- Modules: https://nuxt.com/modules
