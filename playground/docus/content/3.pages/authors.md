---
title: Authors page
description: Page file corresponding to a custom case collection with an empty prefix different from the include path.
navigation:
  icon: i-lucide-test
---

## Authors page

Page file corresponding to a custom case collection with an empty prefix different from the include path.

```text [content.config.ts]
pages: defineCollection({
    type: 'page',
    source: {
      include: '3.pages/**/*.md',
      prefix: '/',
    },
  }),
```

## Authors list from Authors component

::authors
---
authorsOne:
  - name: John Doe One
    avatar: https://placehold.co/150
    role: contributor
    bio: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
  - name: Jane Doe One
    avatar: https://placehold.co/150
    role: creator
    bio: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
authorsTwo:
  - name: John Doe Two
    avatar: https://placehold.co/150
    role: maintainer
    bio: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
  - name: Jane Doe Two
    avatar: https://placehold.co/150
    role: contributor
    bio: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
---
::

## Authors list from data collection

```text [content.config.ts]
authors: defineCollection({
    type: 'data',
    source: {
      include: 'authors/**/*',
    },
    schema: createAuthorsSchema(),
  }),
```
