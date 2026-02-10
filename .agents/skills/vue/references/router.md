# Vue Router Typing

Type-safe routing patterns for Vue Router.

> **For Nuxt:** Use file-based routing instead. See `nuxt` skill for Nuxt routing patterns.

## Route Meta Types

Extend `RouteMeta` for typed route.meta:

```ts
// router/types.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
    roles?: ('admin' | 'user')[]
  }
}
```

**Usage:**

```ts
const route = useRoute()
route.meta.requiresAuth // boolean | undefined (typed!)
route.meta.title // string | undefined
```

## Typed Route Params with unplugin-vue-router

Use `unplugin-vue-router` for fully typed routes:

```bash
pnpm add -D unplugin-vue-router
```

```ts
// vite.config.ts
import VueRouter from 'unplugin-vue-router/vite'

export default defineConfig({
  plugins: [VueRouter(), Vue()], // VueRouter BEFORE Vue
})
```

**Typed useRoute:**

```ts
// Auto-generated route types from file structure
const route = useRoute('/users/[id]')
route.params.id // string (typed!)

const route = useRoute('/posts/[...slug]')
route.params.slug // string[] (typed!)
```

**Typed router.push:**

```ts
const router = useRouter()

// ✅ Type-checked
router.push({ name: '/users/[id]', params: { id: '123' } })

// ❌ TypeScript error - wrong param
router.push({ name: '/users/[id]', params: { userId: '123' } })
```

## Scroll Behavior Types

Type scroll behavior function:

```ts
import type { RouterScrollBehavior } from 'vue-router'

const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => {
  if (savedPosition) return savedPosition
  if (to.hash) return { el: to.hash, behavior: 'smooth' }
  return { top: 0 }
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior,
})
```

## Dynamic Route Params

Handle union types for dynamic segments:

```ts
// routes/[type].vue where type can be 'posts' | 'users' | 'comments'
const route = useRoute()

// Narrow params type
type ContentType = 'posts' | 'users' | 'comments'

const type = route.params.type as ContentType

// Or use route guards
if (route.params.type === 'posts') {
  // TypeScript knows type is 'posts'
}
```

## Navigation Guards Types

Type navigation guards:

```ts
import type { NavigationGuardWithThis, RouteLocationNormalized } from 'vue-router'

const authGuard: NavigationGuardWithThis<undefined> = (to, from) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
}

router.beforeEach(authGuard)
```

**Per-route guards:**

```ts
const routes = [
  {
    path: '/admin',
    component: AdminPage,
    beforeEnter: (to: RouteLocationNormalized) => {
      if (!hasAdminRole()) return { name: 'forbidden' }
    },
  },
]
```

## RouteLocation Types

Common route types:

```ts
import type {
  RouteLocationNormalized,     // Resolved route (after navigation)
  RouteLocationNormalizedLoaded, // Current route (from useRoute)
  RouteLocationRaw,            // Input to router.push()
  RouteRecordRaw,              // Route config definition
} from 'vue-router'
```

## Common Mistakes

**Not extending RouteMeta module:**

```ts
// ❌ Loses type info
route.meta.customField // any

// ✅ Extend the interface
declare module 'vue-router' {
  interface RouteMeta { customField: string }
}
```

**Assuming params are always strings:**

```ts
// Catch-all routes have string[] params
const route = useRoute()

// ❌ May be string[]
const id = route.params.id

// ✅ Handle both cases
const id = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id
```
