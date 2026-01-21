# Vue Testing

Test patterns for Vue 3 components, composables, and utilities.

## Quick Reference

| Test Type        | Pattern                              |
| ---------------- | ------------------------------------ |
| Component        | `mount(Component, { props, slots })` |
| User interaction | `await wrapper.trigger('click')`     |
| Emitted events   | `wrapper.emitted('update')`          |
| Composable       | Call directly, test return values    |
| Utils            | Pure function testing (easiest)      |

## Stack

- **Vitest** - test runner
- **@vue/test-utils** - component mounting, interaction
- **@testing-library/vue** - user-centric alternative
- **happy-dom / jsdom** - DOM environment

## File Location

Colocate tests with code:

```
Button.vue → Button.spec.ts
useAuth.ts → useAuth.spec.ts
formatters.ts → formatters.spec.ts
```

## Component Tests

### Basic

```ts
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

it('renders slot', () => {
  const wrapper = mount(Button, {
    slots: { default: 'Click me' }
  })
  expect(wrapper.text()).toBe('Click me')
})

it('emits on click', async () => {
  const wrapper = mount(Button)
  await wrapper.trigger('click')
  expect(wrapper.emitted('click')).toHaveLength(1)
})
```

### Props

```ts
it('applies variant class', () => {
  const wrapper = mount(Button, {
    props: { variant: 'primary' }
  })
  expect(wrapper.classes()).toContain('btn-primary')
})
```

### Emits

```ts
it('emits update with payload', async () => {
  const wrapper = mount(Input)
  await wrapper.find('input').setValue('new value')
  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new value'])
})
```

### Slots

```ts
it('renders named slots', () => {
  const wrapper = mount(Card, {
    slots: {
      header: '<h1>Title</h1>',
      default: '<p>Content</p>'
    }
  })
  expect(wrapper.html()).toContain('<h1>Title</h1>')
})
```

## Composable Tests

Call directly, no mounting needed:

```ts
import { useCounter } from './useCounter'

it('increments count', () => {
  const { count, increment } = useCounter(0)
  expect(count.value).toBe(0)
  increment()
  expect(count.value).toBe(1)
})

it('resets to initial', () => {
  const { count, increment, reset } = useCounter(5)
  increment()
  increment()
  expect(count.value).toBe(7)
  reset()
  expect(count.value).toBe(5)
})
```

## Utils Tests

Easiest - pure functions:

```ts
import { formatCurrency, slugify } from './formatters'

describe('formatCurrency', () => {
  it('formats USD', () => {
    expect(formatCurrency(10.5)).toBe('$10.50')
  })
})

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special chars', () => {
    expect(slugify('Hello! World?')).toBe('hello-world')
  })
})
```

## Mocking

**Composables:**

```ts
import { vi } from 'vitest'

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, name: 'Test' },
    isAuthenticated: true
  }))
}))
```

**API calls:**

```ts
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: [] })
  })
)
```

## Router Mocking

Mock `useRoute` and `useRouter` for component tests:

```ts
import { vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: { id: '123' },
    query: { filter: 'active' },
    path: '/users/123',
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}))

it('uses route params', () => {
  const wrapper = mount(UserPage)
  expect(wrapper.text()).toContain('123')
})
```

**Dynamic route mocking per test:**

```ts
import { useRoute } from 'vue-router'

it('handles different routes', () => {
  vi.mocked(useRoute).mockReturnValue({
    params: { id: '456' },
  } as any)

  const wrapper = mount(UserPage)
  expect(wrapper.text()).toContain('456')
})
```

## Suspense and Teleport

**Testing async components with Suspense:**

```ts
import { flushPromises, mount } from '@vue/test-utils'

it('renders async content', async () => {
  const wrapper = mount(AsyncComponent, {
    global: {
      stubs: { Suspense: false }, // Don't stub Suspense
    },
  })

  // Wait for async setup to complete
  await flushPromises()

  expect(wrapper.text()).toContain('Loaded content')
})
```

**Testing Teleport:**

```ts
it('teleports modal content', () => {
  const wrapper = mount(Modal, {
    global: {
      stubs: {
        teleport: true, // Stub teleport to render inline
      },
    },
  })

  expect(wrapper.text()).toContain('Modal content')
})
```

**Access teleported content:**

```ts
it('finds teleported content', () => {
  document.body.innerHTML = '<div id="modal-target"></div>'

  mount(Modal, { props: { open: true } })

  // Content teleports to #modal-target
  expect(document.body.innerHTML).toContain('Modal content')
})
```

## Best Practices

**Do:**

- Test behavior (what user sees/does), not implementation
- Arrange-Act-Assert structure
- One assertion per test
- Descriptive test names
- Mock external dependencies

**Don't:**

- Test Vue internals (reactivity)
- Test third-party libraries
- Test trivial getters/setters
- Test implementation details

## What to Test

**Test:**

- User interactions (clicks, inputs)
- Conditional rendering
- Props validation, emitted events
- Computed values, business logic

**Skip:**

- Vue internals, third-party libs
- Trivial getters/setters
- Implementation details

## Running

```bash
pnpm test                          # all
pnpm exec vitest Button.spec.ts   # specific
pnpm exec vitest --watch           # watch
pnpm test --coverage               # coverage
```

**Docs:** [vitest.dev](https://vitest.dev/) · [test-utils.vuejs.org](https://test-utils.vuejs.org/)
