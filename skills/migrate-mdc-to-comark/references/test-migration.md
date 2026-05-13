# Test Migration: Legacy MDC → Comark

Tests are the highest-volume source of conflicts when porting a legacy PR. The single biggest churn in the migration commit was `src/app/test/integration/tiptap.test.ts` (~2,300 lines diff). Use this guide to translate test assertions mechanically.

## API Mapping

| Legacy | Comark |
|---|---|
| `generateDocumentFromContent(md)` | `documentFromContent(md)` |
| `mdcToTiptap(doc.body, frontmatter, opts)` | `comarkToTiptap(doc.body, opts)` |
| `tiptapToMDC(tiptapDoc) → { body, data }` | `tiptapToComark(tiptapDoc) → ComarkTree` |
| `generateContentFromDocument(doc)` | `contentFromDocument(doc)` |
| Expected MDC AST `{ type: 'element', tag: 'note', props: {…}, children: [...] }` | Expected comark tuple `['note', attrs, ...children]` |
| Expected MDC text `{ type: 'text', value: 'hello' }` | Plain string `'hello'` |
| Expected MDC comment `{ type: 'comment', value: 'txt' }` | Tuple `[null, {}, 'txt']` |

## Test Skeleton

```ts
import { documentFromContent, contentFromDocument } from 'nuxt-studio/runtime/utils/document'
import { comarkToTiptap } from '~/utils/tiptap/comarkToTiptap'
import { tiptapToComark } from '~/utils/tiptap/tiptapToComark'

it('round-trips a callout', async () => {
  const md = '::note\nContent here\n::'
  const doc = await documentFromContent('content/test.md', md)
  const tiptapJSON = comarkToTiptap(doc!.body, { hasNuxtUI: true })

  // assert tiptapJSON shape…

  const comarkTree = await tiptapToComark(tiptapJSON)
  const result = await contentFromDocument({ ...doc!, body: comarkTree })
  expect(result).toContain('::note')
})
```

## Body-shape assertions

```ts
// Legacy expected MDC AST
expect(doc.body).toEqual({
  type: 'root',
  children: [
    {
      type: 'element',
      tag: 'note',
      props: { color: 'red' },
      children: [{ type: 'text', value: 'Hello' }],
    },
  ],
})

// Comark equivalent
expect(doc.body.nodes).toEqual([
  ['note', { color: 'red' }, 'Hello'],
])
expect(doc.body.frontmatter).toEqual({})  // if relevant
```

## Mock fixtures

The mocks under `src/app/test/mocks/` (`document.ts`, `draft.ts`, `database.ts`, `host.ts`) were all updated to return `ComarkTree`-shaped bodies. If the PR's test setup constructs MDC bodies inline, replace them with comark tuples. Prefer reusing the updated mock helpers over hand-rolling fixtures.

## Async-only assertions

`renderMarkdown` and therefore `contentFromDocument`, `areDocumentsEqual`, and `isDocumentMatchingContent` are now async on `main`. Tests that previously did:

```ts
expect(generateContentFromDocument(doc)).toBe('# Hello\n')
```

must become:

```ts
await expect(contentFromDocument(doc)).resolves.toBe('# Hello\n')
// or
expect(await contentFromDocument(doc)).toBe('# Hello\n')
```

## Key Differences (quick reference)

- **AST assertions**: replace `{ type: 'element', tag: 'X', props, children }` with tuple `['X', attrs, ...children]`
- **Text nodes**: replace `{ type: 'text', value: 'hello' }` with plain string `'hello'`
- **Comment nodes**: replace `{ type: 'comment', value: 'txt' }` with `[null, {}, 'txt']`
- **Options signature**: `mdcToTiptap(body, {}, { hasNuxtUI })` → `comarkToTiptap(body, { hasNuxtUI })`
- **Return shape**: `tiptapToMDC` returned `{ body, data }`; `tiptapToComark` returns a single `ComarkTree` with `nodes`, `frontmatter`, `meta`
- **Test file location**: the comark-era unit tests live at `src/app/test/unit/utils/tiptap/comarkToTiptap.test.ts`. The integration suite remains at `src/app/test/integration/tiptap.test.ts` but with tuple assertions throughout.
