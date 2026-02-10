# Nuxt Middleware & Plugins

## When to Use

Working with `middleware/` or `plugins/` directories, route guards, app extensions.

## Route Middleware

Route middleware runs before navigation. Used for auth checks, redirects, logging.

### Global Middleware

Runs on every route change. **REQUIRED: Use `.global.ts` suffix:**

```ts
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return navigateTo('/login')
  }
})
```

**Without `.global.ts` suffix, middleware is named (not global).**

## Red Flags - Stop and Check Skill

If you're thinking any of these, STOP and re-read this skill:

- "Suffix doesn't matter, it's about where I put it"
- "I'll redirect() instead of return navigateTo()"
- "I remember Nuxt 3 middleware patterns"
- "Export default function is simpler"

All of these mean: You're using outdated patterns. Use Nuxt 4 patterns instead.

### Named Middleware

Runs only when explicitly applied. No `.global` suffix:

```ts
// middleware/admin.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore()

  if (!auth.isAdmin) {
    return navigateTo('/')
  }
})
```

Apply in page:

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})
</script>
```

### Middleware Return Values

```ts
export default defineNuxtRouteMiddleware((to, from) => {
  // Allow navigation
  return

  // Redirect
  return navigateTo('/login')

  // Abort navigation
  return abortNavigation()

  // Abort with error
  return abortNavigation('Not authorized')
})
```

### Middleware Order

1. Global middleware (alphabetical by filename)
2. Layout middleware (if layout defines middleware)
3. Page middleware (defined in definePageMeta)

## Plugins

Plugins extend Vue app with global functionality. Run during app initialization.

### Basic Plugin

```ts
// plugins/my-plugin.ts
export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      hello: (name: string) => `Hello ${name}!`
    }
  }
})
```

Use in components:

```vue
<script setup lang="ts">
const { $hello } = useNuxtApp()
console.log($hello('World')) // "Hello World!"
</script>
```

### Plugin with Vue Plugin

```ts
import type { PluginOptions } from 'vue-toastification'
// plugins/toast.client.ts
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, {
    position: 'top-right',
    timeout: 3000
  } as PluginOptions)
})
```

### Plugin with Hooks

```ts
// plugins/init.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:created', () => {
    console.log('App created')
  })

  nuxtApp.hook('page:finish', () => {
    console.log('Page finished loading')
  })
})
```

### Client-Only or Server-Only

Use file suffix:

- `.client.ts` - runs only on client
- `.server.ts` - runs only on server

```ts
// plugins/analytics.client.ts
export default defineNuxtPlugin(() => {
  // Only runs in browser
  if (window.analytics) {
    window.analytics.init()
  }
})
```

### Plugin Order

Use numeric prefix for execution order:

```
plugins/
├── 01.first.ts
├── 02.second.ts
└── 03.third.ts
```

### Async Plugins

```ts
// plugins/api.ts
export default defineNuxtPlugin(async (nuxtApp) => {
  const config = await fetch('/api/config').then(r => r.json())

  return {
    provide: {
      config
    }
  }
})
```

## Best Practices

**Middleware:**

- **Return navigation or nothing** - don't mutate state heavily
- **Keep logic minimal** - delegate to composables/stores
- **Use for guards & redirects** only
- **Check meta properly** - `to.meta.requiresAuth`
- **Global = `.global.ts`** suffix required

**Plugins:**

- **Use for app-wide functionality** only
- **Provide via `provide`** for type safety
- **Consider client/server context** - use `.client`/`.server`
- **Minimize work** in plugin initialization
- **Use hooks** for lifecycle events

## Common Mistakes

| ❌ Wrong                             | ✅ Right                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `export default function({ route })` | `export default defineNuxtRouteMiddleware((to, from) => {})` |
| Mutate route object                  | Return navigateTo() or nothing                               |
| `middleware/auth.ts` (not global)    | `middleware/auth.global.ts` (global)                         |
| `redirect('/login')`                 | `return navigateTo('/login')`                                |
| Plugin without defineNuxtPlugin      | Wrap in defineNuxtPlugin()                                   |

## Middleware Example: Auth

```ts
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore()

  // Public routes
  const publicRoutes = ['/', '/login', '/register']
  if (publicRoutes.includes(to.path)) {
    return
  }

  // Check auth
  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }

  // Check role
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return abortNavigation('Access denied')
  }
})
```

## Plugin Example: API Client

```ts
// plugins/api.ts
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ request, options }) {
      const auth = useAuthStore()
      if (auth.token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${auth.token}`
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        navigateTo('/login')
      }
    }
  })

  return {
    provide: {
      api
    }
  }
})
```

## Resources

- Nuxt middleware: https://nuxt.com/docs/guide/directory-structure/middleware
- Nuxt plugins: https://nuxt.com/docs/guide/directory-structure/plugins
- Route middleware: https://nuxt.com/docs/getting-started/routing#route-middleware
