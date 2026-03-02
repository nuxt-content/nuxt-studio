# Nuxt Built-in Components

## When to Use

Working with images, links, or time display in templates. **Always prefer Nuxt components over HTML elements.**

## Component Preferences

| HTML Element | Nuxt Component | Why                                    |
| ------------ | -------------- | -------------------------------------- |
| `<a>`        | `<NuxtLink>`   | Client-side navigation, prefetching    |
| `<img>`      | `<NuxtImg>`    | Optimization, lazy loading, responsive |
| `<time>`     | `<NuxtTime>`   | SSR-safe formatting, localization      |

## NuxtLink

**ALWAYS use `<NuxtLink>` instead of `<a>` for internal links:**

```vue
<template>
  <!-- Internal navigation -->
  <NuxtLink to="/about">About</NuxtLink>
  <NuxtLink :to="{ name: '/users/[userId]', params: { userId } }">Profile</NuxtLink>

  <!-- External links (uses target="_blank" automatically with external) -->
  <NuxtLink to="https://nuxt.com" external>Nuxt Docs</NuxtLink>

  <!-- Prefetch control -->
  <NuxtLink to="/dashboard" :prefetch="false">Dashboard</NuxtLink>

  <!-- Active state styling -->
  <NuxtLink to="/settings" active-class="text-primary" exact-active-class="font-bold">
    Settings
  </NuxtLink>
</template>
```

**Props:**

- `to` - Route path or route object
- `external` - Force external link behavior
- `target` - Link target (`_blank`, etc.)
- `prefetch` - Enable/disable prefetching (default: true)
- `noPrefetch` - Disable prefetching
- `activeClass` - Class when route matches
- `exactActiveClass` - Class when route exactly matches

**Docs:** https://nuxt.com/docs/api/components/nuxt-link

## NuxtImg

**ALWAYS use `<NuxtImg>` instead of `<img>` for images:**

Requires `@nuxt/image` module (usually pre-installed).

```vue
<template>
  <!-- Basic usage -->
  <NuxtImg src="/images/hero.jpg" alt="Hero image" />

  <!-- Responsive with sizes -->
  <NuxtImg
    src="/images/banner.jpg"
    alt="Banner"
    width="1200"
    height="600"
    sizes="100vw sm:50vw md:400px"
  />

  <!-- Lazy loading (default) -->
  <NuxtImg src="/images/photo.jpg" loading="lazy" alt="Photo" />

  <!-- Eager loading for above-fold -->
  <NuxtImg src="/images/logo.svg" loading="eager" alt="Logo" />

  <!-- With placeholder blur -->
  <NuxtImg src="/images/product.jpg" placeholder alt="Product" />

  <!-- Provider-specific (Cloudinary, etc.) -->
  <NuxtImg provider="cloudinary" src="/folder/image.jpg" width="500" />

  <!-- Format conversion -->
  <NuxtImg src="/images/photo.png" format="webp" alt="Photo" />
</template>
```

**Props:**

- `src` - Image source path
- `alt` - Alt text (required for accessibility)
- `width` / `height` - Dimensions
- `sizes` - Responsive sizes
- `loading` - `lazy` (default) or `eager`
- `placeholder` - Show blur placeholder while loading
- `format` - Force output format (`webp`, `avif`, etc.)
- `quality` - Image quality (1-100)
- `provider` - Image provider (cloudinary, imgix, etc.)

**For art direction, use `<NuxtPicture>` (different sources per breakpoint).**

**Docs:** https://image.nuxt.com/usage/nuxt-img

## NuxtTime

**ALWAYS use `<NuxtTime>` instead of `<time>` or manual formatting:**

```vue
<template>
  <!-- Relative time -->
  <NuxtTime :datetime="post.createdAt" relative />
  <!-- Output: "2 hours ago" -->

  <!-- Absolute with locale -->
  <NuxtTime :datetime="event.date" locale="en-US" />

  <!-- Custom format -->
  <NuxtTime :datetime="date" year="numeric" month="long" day="numeric" />
  <!-- Output: "December 6, 2025" -->

  <!-- Short format -->
  <NuxtTime :datetime="date" month="short" day="numeric" />
  <!-- Output: "Dec 6" -->

  <!-- With time -->
  <NuxtTime :datetime="date" hour="numeric" minute="2-digit" />
</template>
```

**Props:**

- `datetime` - Date string, Date object, or timestamp
- `relative` - Show relative time ("2 hours ago")
- `locale` - Locale for formatting
- `year`, `month`, `day`, `hour`, `minute`, `second` - Intl.DateTimeFormat options

**Docs:** https://nuxt.com/docs/api/components/nuxt-time

## Common Mistakes

| ❌ Wrong                              | ✅ Right                                 |
| ------------------------------------- | ---------------------------------------- |
| `<a href="/about">`                   | `<NuxtLink to="/about">`                 |
| `<img src="/photo.jpg">`              | `<NuxtImg src="/photo.jpg" alt="...">`   |
| `<time>{{ formatDate(date) }}</time>` | `<NuxtTime :datetime="date" />`          |
| `formatTimeAgo(date)` in template     | `<NuxtTime :datetime="date" relative />` |
| `new Date().toLocaleDateString()`     | `<NuxtTime :datetime="date" />`          |

## Best Practices

- **NuxtLink for all internal routes** - enables prefetching and client-side navigation
- **NuxtImg for all images** - automatic optimization, lazy loading, responsive
- **NuxtTime for all dates** - SSR-safe, automatic localization
- **Always provide alt text** for images
- **Use `loading="eager"`** for above-the-fold images
- **Use sizes prop** for responsive images

## Resources

- NuxtLink: https://nuxt.com/docs/api/components/nuxt-link
- NuxtImg: https://image.nuxt.com/usage/nuxt-img
- NuxtPicture: https://image.nuxt.com/usage/nuxt-picture
- NuxtTime: https://nuxt.com/docs/api/components/nuxt-time
