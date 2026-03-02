---
name: vue
description: Use when editing .vue files, creating Vue 3 components, writing composables, or testing Vue code - provides Composition API patterns, props/emits best practices, VueUse integration, and reactive destructuring guidance
license: MIT
---

# Vue 3 Development

Reference for Vue 3 Composition API patterns, component architecture, and testing practices.

**Current stable:** Vue 3.5+ with enhanced reactivity performance (-56% memory, 10x faster array tracking), new SSR features, and improved developer experience.

## Overview

Progressive reference system for Vue 3 projects. Load only files relevant to current task to minimize context usage (~250 tokens base, 500-1500 per sub-file).

## When to Use

**Use this skill when:**

- Writing `.vue` components
- Creating composables (`use*` functions)
- Building client-side utilities
- Testing Vue components/composables

**Use `nuxt` skill instead for:**

- Server routes, API endpoints
- File-based routing, middleware
- Nuxt-specific patterns

**For styled UI components:** use `nuxt-ui` skill
**For headless accessible components:** use `reka-ui` skill
**For VueUse composables:** use `vueuse` skill

## Quick Reference

| Working on...            | Load file                  |
| ------------------------ | -------------------------- |
| `.vue` in `components/`  | references/components.md   |
| File in `composables/`   | references/composables.md  |
| File in `utils/`         | references/utils-client.md |
| `.spec.ts` or `.test.ts` | references/testing.md      |
| TypeScript patterns      | references/typescript.md   |
| Vue Router typing        | references/router.md       |

## Loading Files

**Load one file at a time based on file context:**

- Component work → [references/components.md](references/components.md)
- Composable work → [references/composables.md](references/composables.md)
- Utils work → [references/utils-client.md](references/utils-client.md)
- Testing → [references/testing.md](references/testing.md)
- TypeScript → [references/typescript.md](references/typescript.md)
- Vue Router → [references/router.md](references/router.md)

**DO NOT load all files at once** - wastes context on irrelevant patterns.

## Available Guidance

**[references/components.md](references/components.md)** - Props with reactive destructuring, emits patterns, defineModel for v-model, slots shorthand

**[references/composables.md](references/composables.md)** - Composition API structure, VueUse integration, lifecycle hooks, async patterns, reactivity gotchas

**[references/utils-client.md](references/utils-client.md)** - Pure functions, formatters, validators, transformers, when NOT to use utils

**[references/testing.md](references/testing.md)** - Vitest + @vue/test-utils, component testing, composable testing, router mocking

**[references/typescript.md](references/typescript.md)** - InjectionKey for provide/inject, vue-tsc strict templates, tsconfig settings, generic components

**[references/router.md](references/router.md)** - Route meta types, typed params with unplugin-vue-router, scroll behavior, navigation guards

## Examples

Working examples in `resources/examples/`:

- `component-example.vue` - Full component with all patterns
- `composable-example.ts` - Reusable composition function
