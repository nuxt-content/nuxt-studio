# Nuxt Composables & Utilities

## When to Use

Working with Nuxt-specific composables, URL handling, navigation, or data fetching.

## URL & Request Handling

### useRequestURL()

**ALWAYS use `useRequestURL()` instead of `window.origin` or `window.location`:**

```ts
// ✅ Correct - works SSR + client
const url = useRequestURL()
console.log(url.origin) // https://example.com
console.log(url.pathname) // /users/123
console.log(url.search) // ?tab=profile

// ❌ Wrong - breaks on SSR, not available server-side
const origin = window.origin
const path = window.location.pathname
```

**Why:** `window` is undefined during SSR. `useRequestURL()` works everywhere.

### useRequestURL() Patterns

```ts
// Get full URL
const url = useRequestURL()
const fullUrl = url.href // https://example.com/users/123?tab=profile

// Get origin (base URL)
const baseUrl = url.origin // https://example.com

// Get path
const path = url.pathname // /users/123

// Get query params (use useRoute() instead for better typing)
const params = url.searchParams
const tab = params.get('tab') // 'profile'

// Build absolute URL
const apiUrl = `${url.origin}/api/users`
```

## Navigation Composables

### navigateTo()

```ts
// Navigate to route
await navigateTo('/about')

// Type-safe navigation
await navigateTo({ name: '/users/[userId]', params: { userId: '123' } })

// External URL
await navigateTo('https://nuxt.com', { external: true })

// Replace history
await navigateTo('/login', { replace: true })

// Open in new tab
await navigateTo('/docs', { open: { target: '_blank' } })

// Server-side redirect
return navigateTo('/login') // in middleware or server route
```

### useRouter()

```ts
const router = useRouter()

// Navigate
router.push({ name: '/users/[userId]', params: { userId: '123' } })

// Go back
router.back()

// Go forward
router.forward()

// Navigation guards
router.beforeEach((to, from) => {
  // Guard logic
})
```

### useRoute()

```ts
// Generic route
const route = useRoute()

// Typed route (preferred)
const route = useRoute('/users/[userId]')

// Access params
const userId = route.params.userId

// Access query
const tab = route.query.tab

// Access meta
const requiresAuth = route.meta.requiresAuth
```

## Data Fetching

### useFetch()

```ts
// Basic fetch
const { data, error, pending, refresh } = await useFetch('/api/users')

// With params
const { data } = await useFetch('/api/users', {
  query: { page: 1, limit: 10 }
})

// With key for deduplication
const { data } = await useFetch(`/api/users/${userId}`, {
  key: `user-${userId}`
})

// Lazy fetch (doesn't block navigation)
const { data } = await useLazyFetch('/api/users')

// Watch and refetch
const page = ref(1)
const { data } = await useFetch('/api/users', {
  query: { page },
  watch: [page]
})

// Cancel requests with AbortController (Nuxt 4.2+)
const controller = new AbortController()
const { data } = await useFetch('/api/users', {
  signal: controller.signal
})
// Later: controller.abort() to cancel the request
```

### useAsyncData()

```ts
// Custom async logic
const { data, error, pending, refresh } = await useAsyncData('users', async () => {
  const response = await $fetch('/api/users')
  return response.filter(u => u.active)
})

// Lazy version
const { data } = await useLazyAsyncData('users', async () => {
  return await $fetch('/api/users')
})

// Cancel with AbortController (Nuxt 4.2+)
const controller = new AbortController()
const { data } = await useAsyncData('users', async () => {
  return await $fetch('/api/users', { signal: controller.signal })
})
// Later: controller.abort() to cancel

// Custom cache logic with getCachedData
const { data } = await useAsyncData('users',
  async () => $fetch('/api/users'),
  {
    getCachedData: (key) => {
      // Return cached data or null/undefined to trigger fetch
      const cached = useNuxtData(key)
      return cached.data.value
    }
  }
)

// Deep reactivity for nested objects
// Default is shallow in Nuxt 4 (was deep in Nuxt 3)
const { data } = await useAsyncData('user',
  async () => $fetch('/api/user'),
  {
    deep: true // Makes nested properties reactive
  }
)
```

## State Management

### useState()

```ts
// Create shared state
const counter = useState('counter', () => 0)

// Use in components
counter.value++

// With type
const user = useState<User | null>('user', () => null)
```

## App Context

### useNuxtApp()

```ts
const nuxtApp = useNuxtApp()

// Access provided values
const { $api, $hello } = nuxtApp

// Access hooks
nuxtApp.hook('page:finish', () => {
  console.log('Page loaded')
})

// Access Vue app
nuxtApp.vueApp.use(SomePlugin)
```

### useRuntimeConfig()

```ts
// Access runtime config
const config = useRuntimeConfig()

// Public config (client + server)
const apiBase = config.public.apiBase

// Private config (server only)
const apiSecret = config.apiSecret // undefined on client
```

## Head Management

### useHead()

```ts
// Set page meta
useHead({
  title: 'User Profile',
  meta: [
    { name: 'description', content: 'View user profile' },
    { property: 'og:title', content: 'User Profile' }
  ],
  link: [
    { rel: 'canonical', href: 'https://example.com/profile' }
  ]
})

// Dynamic values
const user = ref({ name: 'John' })
useHead({
  title: () => `${user.value.name}'s Profile`
})
```

### useSeoMeta()

```ts
// Cleaner SEO meta
useSeoMeta({
  title: 'User Profile',
  description: 'View user profile',
  ogTitle: 'User Profile',
  ogDescription: 'View user profile',
  ogImage: 'https://example.com/image.jpg',
  twitterCard: 'summary_large_image'
})
```

## Best Practices

- **Use useRequestURL()** NOT window.origin/location
- **Type routes** with useRoute('/path/[param]')
- **Use useFetch** for API calls (deduplication, SSR)
- **Key your fetches** for proper caching
- **useState for shared state** across components
- **useSeoMeta** for cleaner SEO tags

## Common Mistakes

| ❌ Wrong                     | ✅ Right                                              |
| ---------------------------- | ----------------------------------------------------- |
| `window.origin`              | `useRequestURL().origin`                              |
| `window.location.pathname`   | `useRequestURL().pathname`                            |
| `fetch()` in components      | `useFetch()` or `useAsyncData()`                      |
| `router.push('/path/' + id)` | `router.push({ name: '/path/[id]', params: { id } })` |
| Duplicate fetches            | Use `key` parameter                                   |

## Resources

- Nuxt composables: https://nuxt.com/docs/api/composables/use-fetch
- Data fetching: https://nuxt.com/docs/getting-started/data-fetching
- useRequestURL: https://nuxt.com/docs/api/composables/use-request-url
- **For NuxtTime, NuxtLink, NuxtImg:** See nuxt-components.md
