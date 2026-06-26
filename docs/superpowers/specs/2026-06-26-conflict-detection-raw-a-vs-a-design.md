# Conflict detection: raw A-vs-A

**Date:** 2026-06-26
**Status:** Approved (design) — pending implementation plan
**Scope:** Eliminate false "conflict" reports caused by content-storage round-trip differences, by reworking conflict detection to compare raw remote text against a stored raw baseline. Diagnosis of the divergence surface is included. A canonicalization CLI is **deferred** (spec'd as a later phase, not built here).

---

## 1. Problem

Users frequently see Studio report a **conflict** ("GitHub and the website differ") when the two are semantically identical. The conflict UI fires when there is no genuine remote change — only a difference in how content was parsed/stored versus how it renders back.

## 2. Diagnosis — where the false conflicts come from

### 2.1 Root cause (architectural)

`CLAUDE.md` states conflict detection **must** compare raw **A vs A** (remote-at-baseline vs remote-now) *before any parsing*. The actual code does **A vs E(B)**:

- `checkConflict` (`src/app/src/utils/draft.ts:34`) takes the raw remote file (state **A**) and calls `isDocumentMatchingContent(remoteContent, original)`.
- `isDocumentMatchingContent` (`src/module/src/runtime/utils/document/compare.ts:30`) parses **A** with comark, renders the **stored body B** back to markdown, normalizes both, and compares. This is **A vs E(B)**.

So *any* difference between how content was parsed/stored and how it renders back is reported as a conflict. There is no stored raw baseline, and (pre-#338) no genuine remote re-fetch — `remoteFile` was fetched once with `cached: true` at `create()` (`src/app/src/composables/useDraftBase.ts:52`). The mechanism cannot distinguish "remote changed" from "our storage round-trips differently."

### 2.2 The four divergence buckets

These only *matter* because of 2.1. Under a correct A-vs-A check, none surface as conflicts.

1. **Parser divergence (mdc vs comark).** State B is built by `@nuxtjs/mdc` at `@nuxt/content` build time, then bridged to ComarkTree in `src/module/src/runtime/utils/document/legacy.ts`. The remote side (A) is parsed by **comark**. Two parsers of the same text. `legacy.ts` carries a *growing* reconciliation patch list, each entry being a divergence that would otherwise be a false conflict:
   - `className` (array) → `class` (space-joined string) — `legacy.ts:348`
   - `rel: ['nofollow']` injected by `rehype-external-links`, silently dropped — `legacy.ts:359`
   - `:key` JSON-encoded prop unwrapping — `legacy.ts:317`
   - `v-slot:x=""` → `{ name: 'x' }` — `legacy.ts:339`
   - token-list arrays → space-joined strings — `legacy.ts:367`
   - inline/block re-wrapping in `<p>` (`normalizeMdcChildren`) — `legacy.ts:262`
   - unclosed-container artifact repair (`repairMdcRoot`) — `legacy.ts:99`
   - `::ol`/`::ul` redundant list-wrapper flattening (`flattenTreeLists`, currently uncommitted) — `src/module/src/runtime/utils/document/generate.ts:183`
2. **Frontmatter/data divergence.** `areDocumentsEqual` (`compare.ts:55`) hand-normalizes `seo` defaults, `navigation` (incl. string `'true'`), date→ISO, null/undefined stripping, `meta` vs top-level fields. Same whack-a-mole on the data side.
3. **Comark canonical normalization (expected & correct).** Attribute reordering (held back by the `@nuxtjs/mdc` patch + `buildAttrs`), colon depth, inline-prop style, emoji→unicode, the `&#x2A;`→`*` escape (`generate.ts:165`), `:br` mapping. These **should** drive the formatting banner — not conflicts.
4. **Build-injected content.** `rehype-external-links` adds `rel="nofollow"` into B that was never in A.

### 2.3 What #338 already fixed (and what it didn't)

Commit `1d1d54f` (#338, "self-healing published overlay") fixed two adjacent problems:

- **Missing genuine remote re-fetch.** `checkAndRefreshConflicts()` re-fetches remote HEAD with `cached: false` before committing and aborts on concurrent edits (`useDraftBase.ts`). Closes the "silently overwrite concurrent edits" gap *at publish time*.
- **Post-publish deploy-lag desync.** `markPublished()` keeps committed content visible as a self-healing overlay until the SQLite dump redeploys.
- Providers refresh their in-memory `gitFiles` cache post-commit.

**It did not fix the root cause:** `checkAndRefreshConflicts` still calls the same `checkConflict` (A-vs-E(B)), so parser/normalization divergence still surfaces as a false conflict — now also at publish time. The `load()` self-heal uses `isMatchingContent` (A-vs-E(B)), so an overlay with formatting drift can theoretically *never* decide it has caught up. The most common complaint — a conflict the instant a file is opened — is unchanged, because `create()` runs `checkConflict(A, B)` at creation.

Net: #338 added the hard plumbing (uncached re-fetch, post-commit cache refresh, baseline advancement), which makes the A-vs-A rework **small and surgical**.

## 3. Design — raw A-vs-A on the #338 base

### 3.1 Principle

Two questions, two mechanisms, never conflated:

| Question | Mechanism | States | Where |
|----------|-----------|--------|-------|
| Did the remote bytes move since we based our draft on them? (**conflict**) | raw text / SHA compare, **zero parsing** | A_baseline vs A_now | `checkConflict`, `checkAndRefreshConflicts` |
| Does the author's text differ from comark's canonical form? (**formatting drift**) | A vs E(B), banner only | unchanged | `ContentEditor.vue:70` (`areContentEqual`) |

The formatting banner is **already** correctly A-vs-E(B) and independent of `checkConflict`; this rework does not touch it. `compare.ts`/`legacy.ts` normalization stays as-is — still needed for the banner — but stops being load-bearing for conflicts.

### 3.2 Data model (`src/app/src/types/draft.ts`)

Add an immutable baseline captured at draft creation:

```ts
/** Raw remote bytes + blob SHA this draft was based on. The conflict baseline (state A). */
baseRemote?: { content: string, sha: string, encoding?: 'utf-8' | 'base64' }
```

Kept separate from `remoteFile` (which may be refreshed) so the A-vs-A compare is unambiguous and survives refresh.

### 3.3 `checkConflict` rewrite (`src/app/src/utils/draft.ts`)

Parser-free:

- `Deleted` / media / `.gitkeep` → skip (unchanged).
- `Created`: conflict iff a file now exists remotely at the path (existence collision). Diff display may still use `remoteContent` vs `E(D)`, but the **decision** is existence, not render equality.
- `Updated`: **conflict iff `baseRemote.sha !== freshRemote.sha`**, with a trimmed, base64-normalized **content-string fallback** when a SHA is absent (e.g. post-publish synthetic baseline). No `isDocumentMatchingContent`, no `renderMarkdown`.
- Returned `{ remoteContent, localContent }` for the conflict editor is retained; `localContent` may remain `E(B)`/`E(D)` purely for display.

### 3.4 `create()` (`src/app/src/composables/useDraftBase.ts`)

Capture `baseRemote` from the fetched `remoteFile`. A freshly created `Updated` draft has `baseRemote.sha === remoteFile.sha` ⇒ **conflict is structurally impossible at creation** — eliminating the "conflict the instant I open a file" complaint by construction.

### 3.5 `checkAndRefreshConflicts` (#338)

Already re-fetches fresh remote with `cached: false`. Change: compare fresh remote **against `baseRemote`** (raw SHA/content), not via `checkConflict`-against-B. Keep abort-on-conflict + persist behavior.

### 3.6 `load()` self-heal (#338)

Decision (approved): **store the committed SHA and compare SHAs.** `markPublished` records the commit/blob SHA; `load()` considers a Pristine overlay caught-up when the redeployed file's SHA matches. Fully parser-free, consistent with the A-vs-A principle.

> **Open risk (R1):** this requires the deployed content (SQLite dump / `hostDb.get`) to expose a per-file SHA. If it does **not**, fall back to the *tolerant* render-based catch-up: keep `isMatchingContent` but add a max-age / redeploy-count cap so a formatting-drift overlay cannot get stuck forever. The implementation plan must verify SHA availability first and pick the path accordingly.

### 3.7 Post-publish baseline (`markPublished`)

Set `baseRemote` to the committed content + new commit/blob SHA (GitHub already returns `commitSha`; GitLab equivalent) so the next edit's baseline is correct. Where only content is available, leave `sha` empty and rely on the content fallback.

### 3.8 Migration (approved: backfill + heal)

On `load()`, for pre-existing drafts lacking `baseRemote`:
- Backfill `baseRemote` from the current `remoteFile`.
- Clear any stale `conflict` so users' currently-stuck false conflicts disappear on next load.

This is a one-time heal of historical false conflicts.

## 4. Out of scope (this spec)

- **Canonicalization CLI** — deferred to a future phase. Sketch retained for later: a tool that runs content through Studio's exact `documentFromContent → contentFromDocument` pipeline and rewrites files to comark-canonical form (`--check` for CI, `--write` to apply). It would kill bucket 3 (formatting banner) and the A-vs-E(B) class, but **cannot** fully eliminate bucket 1 until `@nuxt/content` is comark-native (the documented retirement of `legacy.ts`). With A-vs-A detection in place, the CLI becomes a convenience, not the load-bearing fix. Note: the pipeline depends on project config (highlight themes via `useHostMeta`), so a `nuxi` command (full Nuxt context) is the likely form.
- Changes to `legacy.ts`/`compare.ts` normalization rules — left intact for the banner.

## 5. Testing

- **Unit (`checkConflict`):** returns `undefined` when `baseRemote.sha === freshRemote.sha` regardless of formatting differences; returns a conflict on SHA mismatch; content-fallback path when SHA absent.
- **Integration (`src/app/test/integration/publish-sync.test.ts`):** a draft over a file with known formatting drift (`::ol` wrapper, reordered attrs, dropped `rel`) shows **no conflict**; a genuine concurrent remote edit **does**; the self-heal converges via SHA.
- **Regression:** the formatting banner still fires on the same drift cases — proving the two mechanisms are cleanly separated.
- **Migration:** a pre-existing draft with a stale `conflict` and no `baseRemote` has its conflict cleared and `baseRemote` backfilled on `load()`.

## 6. Open risks

- **R1 (self-heal SHA):** see §3.6 — verify per-file SHA availability in the deployed dump; tolerant fallback if absent.
- **R2 (SHA semantics across providers):** GitHub blob SHA vs GitLab — confirm both providers return a stable per-file identity at fetch and at commit. If a provider lacks it, that provider uses the content-string fallback.
- **R3 (line-ending / trailing newline):** raw compare must trim trailing whitespace/newlines (the existing fallback at `draft.ts:39` already trims) to avoid newline-only false positives, while still catching genuine edits.

## 7. Deliverables

1. This diagnosis + design doc (the "identify the gaps" output).
2. Detection rework (§3.2–3.8).
3. Test coverage (§5).
4. CLI: deferred (§4).
