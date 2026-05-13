---
name: migrate-mdc-to-comark
description: Port a legacy MDC-based PR onto the new comark-based `main`. Use when a contributor's PR was opened against the old `@nuxtjs/mdc` API (any commit before `feat(mdc): comark migration #355`) and now needs to be rebased / merged with the current Nuxt Studio main branch, which uses `comark` everywhere.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Migrating a Legacy MDC PR to Comark

Since commit `5464103e feat(mdc): comark migration (#355)` (merged 2026-05-13), Nuxt Studio's `main` branch no longer uses `@nuxtjs/mdc`. The entire conversion layer, document utilities, and TipTap bridges were rewritten on top of [`comark`](https://github.com/nuxt-content/comark).

Any PR opened against `main` **before** this commit will conflict on merge. Do **not** simply resolve the conflicts mechanically — most legacy API calls have semantic equivalents in comark that must be re-implemented.

This skill is the reverse of the previous "merge-main-on-comark" skill: the comark branch is now `main`, and legacy PRs need to be ported forward.

## 1. Identify whether the PR is legacy

Run these checks at the root of the PR branch:

```bash
# Legacy imports — any match means the PR predates the comark migration
grep -rE "from '@nuxtjs/mdc'|from 'remark-mdc'|from 'unist-util-visit'|from '@nuxt/content/runtime'" src/

# Legacy function names
grep -rE "generateDocumentFromContent|generateDocumentFromMarkdownContent|generateDocumentFromYAMLContent|generateDocumentFromJSONContent|generateContentFromDocument|generateContentFromMarkdownDocument|generateContentFromYAMLDocument|generateContentFromJSONDocument|mdcToTiptap|tiptapToMDC|compressTree|decompressTree|parseMarkdown|stringifyMarkdown|parseFrontMatter|stringifyFrontMatter|remarkEmojiPlugin" src/

# Legacy file references (these files were deleted on main)
ls src/app/src/utils/tiptap/mdcToTiptap.ts src/app/src/utils/tiptap/tiptapToMdc.ts 2>/dev/null
```

If anything matches, the PR is legacy.

## 2. Conceptual Mapping: Legacy MDC → Comark

### Types

| Legacy (pre-#355) | Comark (current main) |
|---|---|
| `MDCRoot`, `MarkdownRoot` from `@nuxt/content` | `ComarkTree` from `comark` |
| `MDCNode`, `MDCElement`, `MDCText`, `MDCComment` from `@nuxtjs/mdc` | `ComarkNode`, `ComarkElement`, `ComarkComment` from `comark` |
| MDC element: `{ type: 'element', tag: 'note', props: {…}, children: [...] }` | Tuple: `['note', attrs, ...children]` |
| MDC text: `{ type: 'text', value: 'hello' }` | Plain string: `'hello'` |
| MDC comment: `{ type: 'comment', value: 'txt' }` | Tuple: `[null, {}, 'txt']` |

### Functions (document utilities)

Located in `src/module/src/runtime/utils/document/generate.ts`:

| Legacy | Comark |
|---|---|
| `generateDocumentFromContent(id, content, opts)` | `documentFromContent(id, content, opts)` |
| `generateDocumentFromMarkdownContent(...)` | `documentFromMarkdownContent(...)` |
| `generateDocumentFromYAMLContent(...)` | `documentFromYAMLContent(...)` |
| `generateDocumentFromJSONContent(...)` | `documentFromJSONContent(...)` |
| `generateContentFromDocument(doc)` | `contentFromDocument(doc)` |
| `generateContentFromMarkdownDocument(doc)` | `contentFromMarkdownDocument(doc)` |
| `generateContentFromYAMLDocument(doc)` | `contentFromYAMLDocument(doc)` |
| `generateContentFromJSONDocument(doc)` | `contentFromJSONDocument(doc)` |

The shape `generate-X-from-Y` was reversed to `Y-from-X` for symmetry.

### TipTap bridges

Located in `src/app/src/utils/tiptap/`:

| Legacy file (deleted on main) | Comark replacement |
|---|---|
| `mdcToTiptap.ts` | `comarkToTiptap.ts` |
| `tiptapToMdc.ts` | `tiptapToComark.ts` |
| `mdcToTiptap(body, frontmatterData, opts)` | `comarkToTiptap(tree, opts)` — options collapsed to a single object; frontmatter is part of the tree |
| `tiptapToMDC(json, opts) → { body, data }` | `tiptapToComark(json, opts) → ComarkTree` — returns one tree with `frontmatter` embedded |

### Parser / stringifier

| Legacy | Comark |
|---|---|
| `import { parseMarkdown } from '@nuxtjs/mdc/runtime/parser/index'` | `import { parse } from 'comark'` |
| `import { stringifyMarkdown } from '@nuxtjs/mdc/runtime'` | `import { renderMarkdown } from 'comark/render'` |
| `parseFrontMatter` / `stringifyFrontMatter` from `remark-mdc` | `js-yaml` (`yaml.load` / `yaml.dump`) for pure YAML/JSON files; for Markdown, frontmatter is now embedded in `ComarkTree.frontmatter` |
| `compressTree` / `decompressTree` from `@nuxt/content/runtime` | No longer used in app code — see §4 "Legacy bridge" |
| `visit` from `unist-util-visit` | Walk the tuple tree manually using the helpers from `src/app/src/utils/comark.ts` |

### Plugin / option shape

```ts
// Legacy
parseMarkdown(content, {
  contentHeading: …,
  highlight: { theme },
  remark: {
    plugins: {
      'emoji': { instance: remarkEmojiPlugin },
      'remark-mdc': { options: { autoUnwrap: true } },
    },
  },
})

// Comark
import { parse } from 'comark'
import comarkEmoji from 'comark/plugins/emoji'
import highlight from 'comark/plugins/highlight'
import tocPlugin from 'comark/plugins/toc'

parse(content, {
  autoClose: false,
  autoUnwrap: true,
  plugins: [
    comarkEmoji(),
    highlight({ themes: { default, dark, light } }),
    tocPlugin({ depth: 2, searchDepth: 2, title: '', links: [] }),
  ],
})
```

For rendering back to markdown:

```ts
// Legacy
const markdown = await stringifyMarkdown(body, data, {
  frontMatter: { options: { lineWidth: 0 } },
  plugins: { remarkMDC: { options: { autoUnwrap: true } } },
})

// Comark
const markdown = await renderMarkdown(tree, {
  blockAttributesStyle: 'frontmatter',
  components: { br: () => ':br' },
})
```

### Dependencies (`package.json`)

Removed from runtime deps: `@nuxtjs/mdc`, `remark-mdc` (moved to devDeps), `unist-util-visit`.

Added: `comark` (pulled from `pkg.pr.new` while it stabilises). `js-yaml` is now used directly for YAML.

`minimark` is also a devDep only — do not import it in runtime code.

If the PR adds any of the removed runtime deps, drop them; if it uses one, swap to the comark equivalent.

## 3. Comark AST helpers

When walking or building a `ComarkTree`, use the helpers in [`src/app/src/utils/comark.ts`](../../../Library/Mobile%20Documents/com~apple~CloudDocs/Documents/nuxt/modules/studio/src/app/src/utils/comark.ts):

```ts
import { isElement, isComment, getTag, getAttrs, getChildren } from '../../utils/comark'

// Element check
if (isElement(node)) {
  const tag = getTag(node)         // 'note', 'a', 'paragraph', …
  const attrs = getAttrs(node)     // Record<string, unknown>
  const children = getChildren(node)
}

// Comment check
if (isComment(node)) {
  // node === [null, {}, 'comment text']
}

// Text is just a string — no helper needed
if (typeof node === 'string') { … }
```

**Do not** reimplement these checks with raw array indexing in PR code; reuse the helpers.

Common `visit`-style replacement:

```ts
// Legacy
visit(document.body, (node) => node.type === 'element' && node.tag === 'a', (node) => {
  Reflect.deleteProperty(node.props, 'rel')
})

// Comark — manual recursion
function walk(node: ComarkNode) {
  if (isElement(node)) {
    if (getTag(node) === 'a') delete (node[1] as Record<string, unknown>).rel
    for (const child of getChildren(node)) walk(child)
  }
}
tree.nodes.forEach(walk)
```

## 4. Legacy bridge — when MDC types still appear

The DB layer in `@nuxt/content` still stores `MarkdownRoot` (compressed minimark). Studio bridges this at the DB boundaries with two helpers in [`src/module/src/runtime/utils/document/legacy.ts`](../../../Library/Mobile%20Documents/com~apple~CloudDocs/Documents/nuxt/modules/studio/src/module/src/runtime/utils/document/legacy.ts):

- `comarkTreeFromLegacyDocument(document)` — used in `host.ts` at `db.get`, `db.list`, `db.create` to upgrade legacy bodies on read.
- `markdownRootFromComarkTree(tree)` — used in `host.ts` at `db.upsert` to downgrade back for storage.

If the PR touches `host.ts` or DB-adjacent code, the body type at that boundary may still be `MarkdownRoot`. Use `isComarkTree(body)` (exported from `document/index.ts`) to branch:

```ts
const body = document.body
const stored = isComarkTree(body)
  ? markdownRootFromComarkTree(body)
  : body  // already MarkdownRoot
```

This bridge is **temporary**. The header comment of `legacy.ts` lists the cleanup steps for when `@nuxt/content` ships native `ComarkTree` storage — do not extend it.

## 5. Editor component pattern

`ContentEditorTipTap.vue` now flows through a single tree. Compare:

```ts
// Legacy: two separate values (body + data) and manual compression / toc
const frontmatterJson = cleanDataKeys(document.value!)
const newTiptapJSON = mdcToTiptap(
  document.value?.body as unknown as MDCRoot,
  frontmatterJson,
  { hasNuxtUI: hasNuxtUI.value },
)

const { body, data } = await tiptapToMDC(cleanedTiptap, { highlightTheme })
const compressedBody = compressTree(body)
const toc = generateToc(body, { searchDepth: 2, depth: 2 } as Toc)
const updatedDocument = {
  ...document.value!,
  ...data,
  body: { ...compressedBody, toc },
}
```

```ts
// Comark: one tree carries frontmatter + nodes + toc
const comarkTree = document.value!.body
if (!comarkTree) return
const newTiptapJSON = comarkToTiptap(comarkTree, { hasNuxtUI: hasNuxtUI.value })

const comarkTree = await tiptapToComark(cleanedTiptap, { highlightTheme })
const updatedDocument = {
  ...document.value!,
  ...comarkTree.frontmatter,
  body: comarkTree,
}
```

Key points:

- Frontmatter is **inside** the `ComarkTree`. There is no separate `data` return value.
- No manual `compressTree`, no manual `generateToc` — the tree carries everything.
- `host.document.utils.areEqual` and `host.document.generate.contentFromDocument` are now async (the comark renderer is async).

## 6. Git Conflict Resolution

### DU conflicts (Deleted by Us, Updated by Them)

Files deleted on `main` but modified in the PR. The most common are:

- `src/app/src/utils/tiptap/mdcToTiptap.ts`
- `src/app/src/utils/tiptap/tiptapToMdc.ts`
- `src/app/test/unit/utils/tiptap/mdcToTiptap.test.ts`

**Resolution**: accept the deletion (`git rm <file>`). Port the PR's intent into the comark equivalents (`comarkToTiptap.ts`, `tiptapToComark.ts`, `comarkToTiptap.test.ts`).

### UU conflicts (Both Modified)

Common files: `ContentEditorTipTap.vue`, `ContentEditorTipTapDebug.vue`, `useStudio.ts`, `useDraftBase.ts`, `useDraftDocuments.ts`, `host.ts`, `compare.ts`, `generate.ts`, `index.ts` (document utils), `actions.test.ts`, `tiptap.test.ts`.

**Resolution**: keep `HEAD` (main / comark) as the base. Cherry-pick the **semantic intent** of incoming changes — translate any legacy MDC API calls to comark equivalents using the mapping in §2.

## 7. References

- **[porting-guide.md](references/porting-guide.md)** — Code patterns inside `comarkToTiptap.ts` / `tiptapToComark.ts` (option threading, adding new node types, helper extraction, JSDoc style).
- **[test-migration.md](references/test-migration.md)** — How to rewrite tests that used the MDC API.

## 8. Related Skills

- **[[mdc-to-comark]]** — Project-wide migration from `@nuxtjs/mdc` to comark in arbitrary Nuxt projects (this skill is the Studio-specific PR-port flavour).
- **[[comark]]** — Reference for the comark syntax, AST and renderers.
- **[[nuxt-content-comark]]** — Migrating an entire Nuxt Content project's storage to `ComarkTree`.

## 9. Checklist for Each Legacy PR Port

- [ ] Detect legacy imports / functions with the greps in §1
- [ ] Map every legacy function call to its comark equivalent (§2)
- [ ] DU conflicts: `git rm` the deleted files; reimplement intent in `comarkToTiptap.ts` / `tiptapToComark.ts`
- [ ] UU conflicts: keep HEAD as base, translate incoming MDC calls to comark
- [ ] Replace `parseMarkdown` / `stringifyMarkdown` with `parse` / `renderMarkdown` and update the plugin shape
- [ ] Replace `visit(...)` walks with manual tuple walks using `isElement` / `getChildren` / `getAttrs`
- [ ] Drop manual `compressTree` / `generateToc` / `decompressTree` calls in app code — `ComarkTree` carries this natively
- [ ] Move frontmatter merging to `...comarkTree.frontmatter`
- [ ] Treat `areEqual` and `contentFromDocument` as async at every call site
- [ ] Remove `@nuxtjs/mdc`, `remark-mdc` (runtime), `unist-util-visit`, `minimark` (runtime) from added deps
- [ ] If touching DB boundaries: use `isComarkTree` + `comarkTreeFromLegacyDocument` / `markdownRootFromComarkTree`
- [ ] Rewrite tests using comark helpers and tuple-based expected values (see [test-migration.md](references/test-migration.md))
- [ ] Run `pnpm typecheck && pnpm lint && pnpm test` to verify
