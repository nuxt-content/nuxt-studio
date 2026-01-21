# Client Utilities

Pure functions for formatting, validation, transformation, and parsing.

## Quick Reference

| Category     | Examples                                      |
| ------------ | --------------------------------------------- |
| Formatters   | `formatCurrency`, `formatDate`, `formatBytes` |
| Validators   | `isValidEmail`, `isValidUrl`, `isValidPhone`  |
| Transformers | `slugify`, `truncate`, `capitalize`           |
| Parsers      | `parseQuery`, `parseJSON`, `parseDate`        |

## Rules

**Pure functions:**

- Same input → same output
- No side effects
- No external state mutation
- No API calls, no refs, no reactive

**When NOT to use utils:**

- Stateful logic → use composables
- Vue-specific → use composables
- Component logic → keep in component
- API calls → use queries

## Structure

```ts
// utils/formatters.ts
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatRelativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diff = date.getTime() - Date.now()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return rtf.format(days, 'day')
}
```

**Naming:** Descriptive verbs (`formatCurrency`, `validateEmail`, `parseQuery`)
**Organization:** Group by category (`formatters.ts`, `validators.ts`)
**Exports:** Named exports only

## Examples by Category

**Formatters:**

```ts
// utils/formatters.ts
export function formatBytes(bytes: number): string { ... }
export function formatPhone(phone: string): string { ... }
```

**Validators:**

```ts
// utils/validators.ts
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)
}

export function isValidUrl(url: string): boolean {
  try { new URL(url); return true }
  catch { return false }
}
```

**Transformers:**

```ts
// utils/transformers.ts
export function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

export function truncate(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length)}...` : text
}
```

**Parsers:**

```ts
// utils/parsers.ts
export function parseQuery(search: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(search))
}

export function parseJSON<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) }
  catch { return fallback }
}
```

## Common Mistakes

**Side effects (not pure):**

```ts
// ❌ Wrong - mutates external state
let count = 0
export function increment() {
  count++
  return count
}

// ✅ Correct - pure
export function add(a: number, b: number): number {
  return a + b
}
```

**Using utils for stateful logic:**

```ts
// ❌ Wrong - should be composable
export function useCounter() { ... }

// ✅ Correct - pure transformation
export function formatCount(count: number): string { ... }
```

## Organization

**Flat for small projects:**

```
utils/
├── formatters.ts
├── validators.ts
└── transformers.ts
```

**Nested for large projects:**

```
utils/
├── formatters/
│   ├── date.ts
│   ├── currency.ts
│   └── index.ts
└── validators/
    ├── email.ts
    └── index.ts
```
