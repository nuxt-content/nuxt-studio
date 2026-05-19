# Porting Guide: comarkToTiptap.ts / tiptapToComark.ts

When porting logic from a deleted `mdcToTiptap.ts` / `tiptapToMdc.ts` into the comark equivalents, follow the patterns already established in the comark files on `main`. These are the conventions to match.

## Option Threading Pattern

Options flow as **function parameters**, never as module-level mutable state.

```ts
// Entry point extracts options
export function comarkToTiptap(tree: ComarkTree, options?: { hasNuxtUI?: boolean }): JSONContent {
  const hasNuxtUI = options?.hasNuxtUI ?? false
  const content = cleanNodes.flatMap(node => comarkNodeToTiptap(node, undefined, hasNuxtUI))
}

// Middle layer threads it through
export function comarkNodeToTiptap(node: ComarkNode, parentTag?: string, hasNuxtUI = false): JSONContent | JSONContent[] {
  return createElementNode(node as ComarkElement, tagStr, hasNuxtUI)
}

// Leaf function uses it; option-dependent constants defined locally
function createElementNode(node: ComarkElement, type: string, hasNuxtUI = false): JSONContent {
  const CALLOUT_TAGS = new Set(['callout', 'note', 'tip', 'warning', 'caution'])
  const tiptapType = hasNuxtUI && CALLOUT_TAGS.has(type) ? 'u-callout' : 'element'
}
```

Constants that depend on options (like `CALLOUT_TAGS`) are defined **inside** the function that uses them, not at module level.

## Adding a New TipTap Node Type

Example: adding `u-callout`.

**In `comarkToTiptap.ts`** — detect the comark tag inside `createElementNode`:

```ts
const tiptapType = hasNuxtUI && CALLOUT_TAGS.has(type) ? 'u-callout' : 'element'
return createTipTapNode(processedNode, tiptapType, { attrs: { tag: type }, children: slotWrapped })
```

The `tag` attr stores the original comark tag string (e.g. `'note'`, `'tip'`).

**In `tiptapToComark.ts`** — add to `tiptapToComarkMap` and write a dedicated creator:

```ts
// In the map
'u-callout': (node: JSONContent) => createCalloutElement(node),

// Dedicated function — support both new 'tag' attr and legacy 'type' attr
function createCalloutElement(node: JSONContent): ComarkElement {
  const tag = node.attrs?.tag || node.attrs?.type || 'note'
  return createElement(node, tag) as ComarkElement
}
```

## Extracting Helper Functions

When porting a refactor that extracted code into a helper (e.g. `createElementNode`), mirror the same extraction in `comarkToTiptap.ts`. Place the extracted function **before** the `// ─── Utilities` section, alongside other node creation helpers.

The function should:

- Carry a JSDoc explaining internal TipTap requirements (e.g. why text must be wrapped in `<p>`)
- Be called from `comarkNodeToTiptap`, not from the node map
- Follow the same parameter threading pattern above

## JSDoc Comment Style

All section headers inside converter functions use `/** */` blocks, not `//` single-line comments.

```ts
// ❌ Wrong
// Text node

// ✓ Correct
/**
 * Text node
 * ComarkText is a plain string
 */
if (typeof node === 'string') { … }
```

Standard sections in `comarkNodeToTiptap`:

```ts
/** Text node — ComarkText is a plain string */

/** Comment node — ComarkComment is [null, {}, text] */

/** Known node types */

/** Inline vue components — if parent is a paragraph, element should be inline */

/** Block vue components */
```

## Tuple-Building Helpers

When constructing a `ComarkElement` from a TipTap node, reuse the existing `createElement(node, tag)` helper rather than building the tuple by hand. It centralises attribute extraction and child recursion so behavioural changes stay consistent across all node creators.

```ts
// ❌ Wrong — hand-rolled tuple
return [tag, node.attrs ?? {}, ...children]

// ✓ Correct — reuse createElement
return createElement(node, tag)
```

For comments use the well-known sentinel:

```ts
return [null, {}, commentText] as ComarkComment
```

## Frontmatter on the Tree

`ComarkTree` carries `frontmatter`, `nodes`, and `meta`. When building a tree from TipTap, set frontmatter explicitly:

```ts
const tree: ComarkTree = {
  nodes,
  frontmatter: extractedFrontmatter,
  meta: {},
}
```

Never merge frontmatter into the document at a level above the tree — keep it on the tree itself so `tiptapToComark` has a single return value.
