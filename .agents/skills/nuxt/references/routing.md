# Nuxt File-Based Routing

## When to Use

Working with `pages/` or `layouts/` directories, file-based routing, navigation.

## File-Based Routing Basics

`pages/` folder structure directly maps to routes. File names determine URLs.

## Naming Conventions

**Key principles:**

- **ALWAYS use descriptive params:** `[userId].vue` NOT `[id].vue`
- **Use `.` for path segments:** `users.edit.vue` → `/users/edit`
- **Optional params:** `[[paramName]].vue`
- **Catch-all:** `[...path].vue`
- **Route groups for organization:** `(folder)/` groups files without affecting URLs

## Red Flags - Stop and Check Skill

If you're thinking any of these, STOP and re-read this skill:

- "String paths are simpler than typed routes"
- "Generic param names like [id] are fine"
- "I remember how Nuxt 3 worked"

All of these mean: You're about to use outdated patterns. Use Nuxt 4 patterns instead.

## File Structure Example

```
pages/
├── index.vue               # /
├── about.vue               # /about
├── [...slug].vue           # catch-all for 404
├── users.edit.vue          # /users/edit - breaks out of nesting
├── users.vue               # parent route (layout for /users/*)
└── users/
    ├── index.vue           # /users
    └── [userId].vue        # /users/:userId
```

## Route Groups for Organization

Route groups organize files WITHOUT affecting URLs. Wrap folder names in parentheses:

```
pages/
├── (marketing)/            # group folder (ignored in URL)
│   ├── about.vue           # /about (not /marketing/about)
│   └── pricing.vue         # /pricing
└── (admin)/                # group folder (ignored in URL)
    ├── dashboard.vue       # /dashboard
    └── settings.vue        # /settings
```

**Use route groups to:**

- Organize pages by feature/team
- Group related routes without affecting URLs
- Keep large projects maintainable

## Parent Routes (Layouts)

Parent route = layout for nested routes:

```vue
<!-- pages/users.vue -->
<template>
  <div class="users-layout">
    <nav>
      <NuxtLink to="/users">All Users</NuxtLink>
      <NuxtLink to="/users/create">Create User</NuxtLink>
    </nav>
    <NuxtPage />
  </div>
</template>
```

Child routes:

```
pages/
├── users.vue           # Parent route with <NuxtPage />
└── users/
    ├── index.vue       # /users
    ├── [userId].vue    # /users/:userId
    └── create.vue      # /users/create
```

## definePage() for Route Customization

```vue
<script setup lang="ts">
definePage({
  name: 'user-profile',
  path: '/profile/:userId',  // Override default path
  alias: ['/me', '/profile'],
  meta: {
    requiresAuth: true,
    title: 'User Profile',
    roles: ['user', 'admin']
  }
})
</script>

<template>
  <div>Profile content</div>
</template>
```

## Typed Router

**ALWAYS use typed routes for navigation:**

```ts
// ✅ Type-safe with route name
await navigateTo({ name: '/users/[userId]', params: { userId: '123' } })

// ❌ String-based (not type-safe, avoid)
await navigateTo('/users/123')
```

**REQUIRED: Check `typed-router.d.ts` for available route names and params before navigating.**

## useRoute with Types

Pass route name for stricter typing:

```ts
// Generic route
const route = useRoute()

// Typed route (preferred)
const route = useRoute('/users/[userId]')
// route.params.userId is now typed correctly
```

## Navigation

```ts
// Navigate to route
await navigateTo('/about')
await navigateTo({ name: '/users/[userId]', params: { userId: '123' } })

// Navigate with query
await navigateTo({ path: '/search', query: { q: 'nuxt' } })

// External redirect
await navigateTo('https://nuxt.com', { external: true })

// Replace history
await navigateTo('/login', { replace: true })

// Open in new tab
await navigateTo('/docs', { open: { target: '_blank' } })
```

## Route Meta & Middleware

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'dashboard',
  meta: {
    requiresAuth: true
  }
})
</script>
```

## Dynamic Routes Patterns

```
[userId].vue              # /users/123
[[slug]].vue              # /blog or /blog/post (optional)
[...path].vue             # /a/b/c (catch-all)
[[...path]].vue           # / or /a/b/c (optional catch-all)
```

## Breaking Out of Nested Routing

Use `.` to create routes at parent level:

```
pages/
├── users.vue               # /users layout
├── users/
│   └── [userId].vue        # /users/123
└── users.settings.vue      # /users/settings (NOT nested under layout)
```

## Best Practices

- **`index.vue` for index routes** - valid and correct for creating default routes
- **Route groups `(folder)/` for organization** - group files without affecting URLs
- **Descriptive param names** - `[userId]` not `[id]`, `[postSlug]` not `[slug]`
- **Type-safe navigation** - use route names, not strings
- **Check typed-router.d.ts** for available routes
- **Parent routes for layouts** - `users.vue` with `<NuxtPage />`
- **Use definePage** for custom paths/aliases
- **Catch-all for 404** - `[...path].vue` or `[...slug].vue`

## Common Mistakes

| ❌ Wrong                     | ✅ Right                                                          |
| ---------------------------- | ----------------------------------------------------------------- |
| `[id].vue`                   | `[userId].vue` or `[postId].vue`                                  |
| `navigateTo('/users/' + id)` | `navigateTo({ name: '/users/[userId]', params: { userId: id } })` |
| `<Nuxt />`                   | `<NuxtPage />`                                                    |
| Separate layouts/ folder     | Parent routes with `<NuxtPage />`                                 |

## Resources

- Nuxt routing: https://nuxt.com/docs/guide/directory-structure/pages
- File-based routing: https://nuxt.com/docs/getting-started/routing
