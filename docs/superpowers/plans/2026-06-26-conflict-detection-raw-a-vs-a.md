# Raw A-vs-A Conflict Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop Studio reporting false "conflicts" caused by content-storage round-trip differences, by making conflict detection compare raw remote text (state A baseline vs A now) instead of comparing raw remote against the rendered stored body (A vs E(B)).

**Architecture:** Capture an immutable raw remote baseline (`baseRemote`: content + git blob SHA) when a draft is created. Conflict detection becomes a pure SHA/text compare against the current remote — zero parsing, zero rendering. The formatting banner keeps owning canonical-drift UX (A vs E(B)) and is untouched. Builds on #338 (`checkAndRefreshConflicts`, `markPublished`, post-commit cache refresh). Self-heal of published overlays switches from render-comparison to the dump content-hash (`n`) changing, with a max-age safety cap.

**Tech Stack:** Vue 3 composables, TypeScript, Vitest. Git providers: GitHub (`blobData.sha`), GitLab (`blob_id`). `@nuxt/content` dump items carry a content hash `n`.

## Global Constraints

- The **formatting banner** (`src/app/src/components/content/editor/ContentEditor.vue:70`, `areContentEqual`) compares A vs E(B) and MUST NOT be modified by this work.
- Conflict **decisions** MUST be parser-free (no `renderMarkdown`, no `isDocumentMatchingContent`). Rendering is allowed only to build the *display* payload of an already-decided conflict.
- Raw text comparison MUST trim trailing whitespace/newlines to avoid newline-only false positives.
- Dev mode has no drafts/conflicts — all new logic is a no-op when `devMode.value` is true (existing guards already cover this).
- Follow existing file conventions; do not restructure unrelated code.

---

### Task 1: Raw A-vs-A `checkConflict` + `baseRemote` type

**Files:**
- Modify: `src/app/src/types/draft.ts` (add `baseRemote`, `baseHash`, `publishedAt`)
- Modify: `src/app/src/utils/draft.ts:6-47` (rewrite `checkConflict`)
- Test: `src/app/test/unit/utils/draft.test.ts` (create)

**Interfaces:**
- Consumes: `DraftItem`, `DraftStatus`, `ContentConflict`, `StudioHost` from `../types`; `fromBase64ToUTF8` from `../utils/string`; `isMediaFile` from `./file`.
- Produces: `checkConflict(host: StudioHost, draftItem: DraftItem<DatabaseItem | MediaItem>): Promise<ContentConflict | undefined>` — now decides via `baseRemote.sha` vs `remoteFile.sha` (content-string fallback when a SHA is empty). `DraftItem.baseRemote?: { content: string, sha: string, encoding?: 'utf-8' | 'base64' }`, `DraftItem.baseHash?: string`, `DraftItem.publishedAt?: number`.

- [ ] **Step 1: Add the new fields to `DraftItem`**

In `src/app/src/types/draft.ts`, immediately after the existing `published?: boolean` field (end of the interface), add:

```ts
  /**
   * Raw remote bytes + git blob SHA this draft was based on (state A baseline).
   * Captured at create() and advanced at markPublished(). Conflict detection
   * compares this against the current remote — pure text/SHA, no parsing.
   */
  baseRemote?: {
    content: string
    sha: string
    encoding?: 'utf-8' | 'base64'
  }

  /**
   * Dump content-hash (`n`) captured at publish time. The self-heal in load()
   * treats the overlay as caught-up once the redeployed dump item's `n` differs.
   */
  baseHash?: string

  /** Publish timestamp (ms). Max-age safety cap for the self-heal overlay. */
  publishedAt?: number
```

- [ ] **Step 2: Write the failing unit tests**

Create `src/app/test/unit/utils/draft.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { checkConflict } from '../../../src/utils/draft'
import { DraftStatus } from '../../../src/types'

const host = {
  document: { generate: { contentFromDocument: async () => 'RENDERED' } },
} as unknown as Parameters<typeof checkConflict>[0]

function draft(overrides: Record<string, unknown> = {}) {
  return {
    fsPath: 'content/a.md',
    status: DraftStatus.Updated,
    modified: { id: 'a', body: {} },
    original: { id: 'a', body: {} },
    remoteFile: { content: 'remote text', sha: 's1', encoding: 'utf-8' },
    baseRemote: { content: 'remote text', sha: 's1', encoding: 'utf-8' },
    ...overrides,
  } as unknown as Parameters<typeof checkConflict>[1]
}

describe('checkConflict (raw A-vs-A)', () => {
  it('returns undefined when baseline and remote SHAs match, even if content text differs', async () => {
    const result = await checkConflict(host, draft({
      remoteFile: { content: 'WILDLY different rendering', sha: 's1', encoding: 'utf-8' },
      baseRemote: { content: 'remote text', sha: 's1', encoding: 'utf-8' },
    }))
    expect(result).toBeUndefined()
  })

  it('returns a conflict when the remote SHA moved from the baseline', async () => {
    const result = await checkConflict(host, draft({
      remoteFile: { content: 'edited on remote', sha: 's2', encoding: 'utf-8' },
      baseRemote: { content: 'remote text', sha: 's1', encoding: 'utf-8' },
    }))
    expect(result).toEqual({ remoteContent: 'edited on remote', localContent: 'RENDERED' })
  })

  it('returns undefined when there is no baseline (legacy draft, backfilled later)', async () => {
    const result = await checkConflict(host, draft({ baseRemote: undefined }))
    expect(result).toBeUndefined()
  })

  it('falls back to trimmed content compare when a SHA is empty (post-publish baseline)', async () => {
    const same = await checkConflict(host, draft({
      baseRemote: { content: 'hello\n', sha: '', encoding: 'utf-8' },
      remoteFile: { content: 'hello', sha: '', encoding: 'utf-8' },
    }))
    expect(same).toBeUndefined()

    const moved = await checkConflict(host, draft({
      baseRemote: { content: 'hello', sha: '', encoding: 'utf-8' },
      remoteFile: { content: 'goodbye', sha: '', encoding: 'utf-8' },
    }))
    expect(moved).toEqual({ remoteContent: 'goodbye', localContent: 'RENDERED' })
  })

  it('treats a locally-created file that now exists on remote as a conflict', async () => {
    const result = await checkConflict(host, draft({
      status: DraftStatus.Created,
      baseRemote: undefined,
    }))
    expect(result).toEqual({ remoteContent: 'remote text', localContent: 'RENDERED' })
  })

  it('returns undefined for a Deleted draft', async () => {
    const result = await checkConflict(host, draft({ status: DraftStatus.Deleted }))
    expect(result).toBeUndefined()
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm test -- src/app/test/unit/utils/draft.test.ts`
Expected: FAIL — current `checkConflict` calls `isDocumentMatchingContent` (not on the mock host) and ignores `baseRemote`, so the SHA-match and no-baseline cases fail.

- [ ] **Step 4: Rewrite `checkConflict`**

Replace the entire body of `checkConflict` in `src/app/src/utils/draft.ts` (lines 6-47) with:

```ts
export async function checkConflict(host: StudioHost, draftItem: DraftItem<DatabaseItem | MediaItem>): Promise<ContentConflict | undefined> {
  const generateContentFromDocument = host.document.generate.contentFromDocument

  if (isMediaFile(draftItem.fsPath) || draftItem.fsPath.endsWith('.gitkeep')) {
    return
  }

  if (draftItem.status === DraftStatus.Deleted) {
    return
  }

  // TODO: No remote file found (might have been deleted remotely)
  if (!draftItem.remoteFile || !draftItem.remoteFile.content) {
    return
  }

  const remoteContent = decodeRemote(draftItem.remoteFile)!

  // A locally-created file that now exists on the remote is a genuine collision.
  if (draftItem.status === DraftStatus.Created) {
    return {
      remoteContent,
      localContent: await generateContentFromDocument(draftItem.modified as DatabaseItem) as string,
    }
  }

  // Updated: compare the raw baseline (state A captured at draft creation) against
  // the current remote (state A now). Pure SHA/text — no parsing, no render.
  // Comark formatting drift (A vs E(B)) is handled by the formatting banner, not here.
  const baseline = draftItem.baseRemote
  if (!baseline) {
    // Legacy draft created before baselines existed; load() backfills it.
    return
  }

  const baseSha = baseline.sha
  const currentSha = draftItem.remoteFile.sha
  const remoteMoved = baseSha && currentSha
    ? baseSha !== currentSha
    : (decodeRemote(baseline) ?? '').trim() !== remoteContent.trim()

  if (!remoteMoved) {
    return
  }

  return {
    remoteContent,
    localContent: await generateContentFromDocument(draftItem.original as DatabaseItem) as string,
  }
}

/** Decode a GitFile-like { content, encoding } to raw UTF-8 text. */
function decodeRemote(file?: { content?: string | null, encoding?: string }): string | null {
  if (!file?.content) return null
  return file.encoding === 'base64' ? fromBase64ToUTF8(file.content) : file.content
}
```

Note: `decodeRemote` is added below `checkConflict`; the old base64 inline decode and the `isDocumentMatchingContent` / `generateContentFromDocument(original)` trim-compare logic are removed. The line `const isDocumentMatchingContent = host.document.utils.isMatchingContent` is deleted.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test -- src/app/test/unit/utils/draft.test.ts`
Expected: PASS (all 6 tests).

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: no new errors in `draft.ts` / `types/draft.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/app/src/types/draft.ts src/app/src/utils/draft.ts src/app/test/unit/utils/draft.test.ts
git commit -m "fix(draft): make conflict detection compare raw remote A-vs-A"
```

---

### Task 2: Capture `baseRemote` at `create()`

**Files:**
- Modify: `src/app/src/composables/useDraftBase.ts:46-80` (`create()`)
- Test: `src/app/test/integration/conflict-detection.test.ts` (create)

**Interfaces:**
- Consumes: `checkConflict` (Task 1), `DraftItem.baseRemote` (Task 1).
- Produces: a freshly created draft has `baseRemote` populated from the fetched `remoteFile`; an `Updated`/`Pristine` draft over a file whose stored render differs from the remote text shows **no** conflict.

- [ ] **Step 1: Write the failing integration test**

Create `src/app/test/integration/conflict-detection.test.ts`:

```ts
/**
 * Integration tests for raw A-vs-A conflict detection.
 * A freshly opened draft must never report a conflict from formatting/parser
 * drift — only a genuine remote move (different blob SHA) is a conflict.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { DraftStatus } from '../../src/types'
import { generateUniqueDocumentFsPath } from '../utils'
import { mockHost, routeState, cleanAndSetupContext } from '../utils/context'
import { createMockGit, createMockGithubFile } from '../mocks/git'
import { clearMockHost } from '../mocks/host'

describe('raw A-vs-A conflict detection', () => {
  beforeEach(() => {
    routeState.name = 'content'
    clearMockHost()
  })

  it('does not report a conflict on open when remote text differs only by formatting', async () => {
    // Remote file content deliberately does NOT match the round-tripped DB render.
    const remote = createMockGithubFile({ content: '::ol\n1. a\n::\n', sha: 'remote-sha-1' })
    const mockGit = createMockGit(remote)
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, '1. a')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draftItem = context.activeTree.value.draft.list.value.find(d => d.fsPath === fsPath)!
    expect(draftItem.conflict).toBeUndefined()
    expect(draftItem.baseRemote?.sha).toBe('remote-sha-1')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test -- src/app/test/integration/conflict-detection.test.ts`
Expected: FAIL — `draftItem.baseRemote` is `undefined` (not yet captured).

- [ ] **Step 3: Populate `baseRemote` in `create()`**

In `src/app/src/composables/useDraftBase.ts`, change the `draftItem` construction inside `create()` (currently lines 54-59) to:

```ts
    const draftItem: DraftItem<T> = {
      fsPath,
      remoteFile,
      baseRemote: remoteFile
        ? { content: remoteFile.content ?? '', sha: remoteFile.sha, encoding: remoteFile.encoding }
        : undefined,
      status: await getStatus(item, original!),
      modified: item,
    }
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test -- src/app/test/integration/conflict-detection.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/src/composables/useDraftBase.ts src/app/test/integration/conflict-detection.test.ts
git commit -m "fix(draft): capture raw remote baseline at draft creation"
```

---

### Task 3: `checkAndRefreshConflicts` compares against `baseRemote`

**Files:**
- Modify: `src/app/src/composables/useDraftBase.ts:200-226` (`checkAndRefreshConflicts`)
- Test: `src/app/test/integration/conflict-detection.test.ts` (extend)

**Interfaces:**
- Consumes: `checkConflict` (Task 1), `baseRemote` (Task 2).
- Produces: `checkAndRefreshConflicts()` flags a conflict only when the freshly re-fetched remote SHA differs from the draft's `baseRemote.sha`; a formatting-only difference (same SHA) does not flag.

- [ ] **Step 1: Write the failing tests (extend the file from Task 2)**

Append to `src/app/test/integration/conflict-detection.test.ts` inside the same `describe`:

```ts
  it('checkAndRefreshConflicts flags a conflict when the remote SHA moved', async () => {
    const remote = createMockGithubFile({ content: 'base', sha: 'sha-base' })
    const mockGit = createMockGit(remote)
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draft = context.activeTree.value.draft
    const draftItem = draft.list.value.find(d => d.fsPath === fsPath)!
    await draft.update(fsPath, { ...draftItem.modified!, body: { nodes: [['p', {}, 'mine']] as never, frontmatter: {}, meta: {} } })

    // Remote moved (new SHA) after we based our draft on sha-base.
    mockGit.api.fetchFile = (await import('vitest')).vi.fn().mockResolvedValue(
      createMockGithubFile({ content: 'theirs', sha: 'sha-moved' }),
    )

    const hasConflict = await draft.checkAndRefreshConflicts()
    expect(hasConflict).toBe(true)
    expect(draft.list.value.find(d => d.fsPath === fsPath)!.conflict).toBeDefined()
  })

  it('checkAndRefreshConflicts does NOT flag when the remote SHA is unchanged', async () => {
    const remote = createMockGithubFile({ content: 'base', sha: 'sha-base' })
    const mockGit = createMockGit(remote)
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draft = context.activeTree.value.draft
    const draftItem = draft.list.value.find(d => d.fsPath === fsPath)!
    await draft.update(fsPath, { ...draftItem.modified!, body: { nodes: [['p', {}, 'mine']] as never, frontmatter: {}, meta: {} } })

    // Same SHA, but re-fetched content text differs (formatting). Must NOT conflict.
    mockGit.api.fetchFile = (await import('vitest')).vi.fn().mockResolvedValue(
      createMockGithubFile({ content: 'base reformatted', sha: 'sha-base' }),
    )

    const hasConflict = await draft.checkAndRefreshConflicts()
    expect(hasConflict).toBe(false)
  })
```

- [ ] **Step 2: Run to verify the new tests' state**

Run: `pnpm test -- src/app/test/integration/conflict-detection.test.ts`
Expected: the "does NOT flag" test FAILS today (current `checkConflict` would compare against rendered B and may flag); the "flags when SHA moved" test may pass for the wrong reason. Confirm at least one new test fails.

- [ ] **Step 3: Point `checkAndRefreshConflicts` at `baseRemote`**

In `src/app/src/composables/useDraftBase.ts`, replace the loop body of `checkAndRefreshConflicts` (lines 205-222) with:

```ts
    for (const draftItem of nonPristineDrafts) {
      // Re-fetch the remote bypassing the in-memory cache (state A now).
      const freshRemote = await gitProvider.api.fetchFile(
        joinURL(remotePathPrefix, draftItem.fsPath),
        { cached: false },
      )

      // Compare the current remote against the draft's raw baseline (state A then).
      const checkItem = { ...draftItem, remoteFile: freshRemote ?? undefined }
      const conflict = await checkConflict(host, checkItem)

      if (conflict) {
        draftItem.remoteFile = freshRemote ?? draftItem.remoteFile
        draftItem.conflict = conflict
        await storage.setItem(draftItem.fsPath, draftItem as DraftItem<T>)
        hasConflict = true
      }
    }
```

(No structural change is needed — `checkConflict` now does A-vs-A via `checkItem.baseRemote` vs `checkItem.remoteFile`. This step is a no-op confirmation if Task 1 already covers it; verify the comment reflects the new semantics and that `baseRemote` survives the spread.)

- [ ] **Step 4: Run to verify the tests pass**

Run: `pnpm test -- src/app/test/integration/conflict-detection.test.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Commit**

```bash
git add src/app/src/composables/useDraftBase.ts src/app/test/integration/conflict-detection.test.ts
git commit -m "fix(draft): pre-publish conflict check uses raw baseline"
```

---

### Task 4: Advance baseline on publish + hash-based self-heal

**Files:**
- Modify: `src/app/src/composables/useDraftBase.ts` — `markPublished` (244-289), `load()` self-heal (328-363), add a module-scope constant.
- Test: `src/app/test/integration/conflict-detection.test.ts` (extend)

**Interfaces:**
- Consumes: `baseRemote`, `baseHash`, `publishedAt` (Task 1); `hostDb.get`.
- Produces: after `markPublished()`, a published draft has `baseRemote` advanced to the committed content, `baseHash` = the stale dump `n`, and `publishedAt` set. `load()` purges a published Pristine overlay when the dump item's `n` differs from `baseHash`, when the dump item is gone, or when `publishedAt` is older than `PUBLISHED_OVERLAY_MAX_AGE_MS`.

- [ ] **Step 1: Add the max-age constant**

Near the top of `src/app/src/composables/useDraftBase.ts` (after imports, before `export function useDraftBase`), add:

```ts
/** Drop a published overlay after this long even if we never observed the dump change. */
const PUBLISHED_OVERLAY_MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes
```

- [ ] **Step 2: Write the failing tests**

Append to `src/app/test/integration/conflict-detection.test.ts`:

```ts
  it('markPublished advances baseRemote, captures the stale dump hash, and stamps publishedAt', async () => {
    const mockGit = createMockGit(createMockGithubFile({ content: 'base', sha: 'sha-base' }))
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draft = context.activeTree.value.draft
    const draftItem = draft.list.value.find(d => d.fsPath === fsPath)!
    await draft.update(fsPath, { ...draftItem.modified!, body: { nodes: [['p', {}, 'committed']] as never, frontmatter: {}, meta: {} } })

    await draft.markPublished()

    const published = draft.list.value.find(d => d.fsPath === fsPath)!
    expect(published.baseRemote?.content).toBeTruthy()
    expect(published.baseRemote?.sha).toBe('')
    expect(typeof published.publishedAt).toBe('number')
    // baseHash is whatever the dump exposed at publish time (may be undefined if the mock has no `n`)
    expect('baseHash' in published).toBe(true)
  })

  it('load() purges a published overlay once publishedAt exceeds the max age', async () => {
    const mockGit = createMockGit(createMockGithubFile({ content: 'base', sha: 'sha-base' }))
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draft = context.activeTree.value.draft
    const draftItem = draft.list.value.find(d => d.fsPath === fsPath)!
    await draft.update(fsPath, { ...draftItem.modified!, body: { nodes: [['p', {}, 'committed']] as never, frontmatter: {}, meta: {} } })
    await draft.markPublished()

    // Force the overlay to look stale.
    const published = draft.list.value.find(d => d.fsPath === fsPath)!
    published.publishedAt = 1 // far in the past
    await draft.load()

    expect(draft.list.value.find(d => d.fsPath === fsPath)).toBeUndefined()
  })

  it('load() purges a published overlay when the dump content-hash has changed', async () => {
    const { vi } = await import('vitest')
    const mockGit = createMockGit(createMockGithubFile({ content: 'base', sha: 'sha-base' }))
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draft = context.activeTree.value.draft
    const draftItem = draft.list.value.find(d => d.fsPath === fsPath)!
    await draft.update(fsPath, { ...draftItem.modified!, body: { nodes: [['p', {}, 'committed']] as never, frontmatter: {}, meta: {} } })
    await draft.markPublished()

    const published = draft.list.value.find(d => d.fsPath === fsPath)!
    published.baseHash = 'stale-hash'
    published.publishedAt = Date.now()
    // Dump now reports a different hash → deploy caught up.
    vi.spyOn(mockHost.document.db, 'get').mockResolvedValue({ id: fsPath, n: 'fresh-hash' } as never)

    await draft.load()
    expect(draft.list.value.find(d => d.fsPath === fsPath)).toBeUndefined()
  })
```

- [ ] **Step 3: Run to verify failures**

Run: `pnpm test -- src/app/test/integration/conflict-detection.test.ts`
Expected: the three new tests FAIL — `baseRemote`/`baseHash`/`publishedAt` are not set by `markPublished`, and the self-heal still uses `isMatchingContent`.

- [ ] **Step 4: Update `markPublished`**

In `markPublished`, replace the "Updated / Created" baseline-advance block (currently lines 262-285) with:

```ts
      // Updated / Created: advance the baseline to what was committed.
      const committedContent = generateContentFromDocument
        ? await generateContentFromDocument(draftItem.modified as DatabaseItem) as string
        : null

      draftItem.original = draftItem.modified
      draftItem.remoteFile = committedContent !== null
        ? {
            name: draftItem.fsPath.split('/').pop() || draftItem.fsPath,
            path: draftItem.fsPath,
            sha: '',
            size: committedContent.length,
            url: '',
            content: committedContent,
            encoding: 'utf-8' as const,
            provider: draftItem.remoteFile?.provider || 'github' as const,
          }
        : draftItem.remoteFile
      // New raw baseline = the committed content (no git SHA available yet → content fallback).
      draftItem.baseRemote = committedContent !== null
        ? { content: committedContent, sha: '', encoding: 'utf-8' }
        : draftItem.baseRemote
      // Capture the stale dump hash so load() can detect when the redeploy lands.
      draftItem.baseHash = ((await hostDb.get(draftItem.fsPath)) as { n?: string } | undefined)?.n
      draftItem.publishedAt = Date.now()
      delete draftItem.conflict
      draftItem.formattingApplied = false
      draftItem.published = true
      draftItem.status = DraftStatus.Pristine

      await storage.setItem(draftItem.fsPath, draftItem as DraftItem<T>)
```

- [ ] **Step 5: Replace the `load()` self-heal Pristine branch**

In `load()`, replace the published-Pristine branch (currently lines 338-361, from `else if (item.status === DraftStatus.Pristine) {` through its closing brace before `return item`) with:

```ts
          else if (item.status === DraftStatus.Pristine) {
            const dbItem = await hostDb.get(item.fsPath)
            // DB item gone entirely — the deploy likely removed it; treat as caught up.
            if (!dbItem) {
              await storage.removeItem(key)
              return null
            }
            const currentHash = (dbItem as { n?: string }).n
            const hashChanged = !!item.baseHash && !!currentHash && currentHash !== item.baseHash
            const expired = !!item.publishedAt && (Date.now() - item.publishedAt) > PUBLISHED_OVERLAY_MAX_AGE_MS
            if (hashChanged || expired) {
              await storage.removeItem(key)
              return null
            }
            // Deploy not yet complete: keep the overlay alive (modified already holds
            // the committed content; fall through to the upsert below).
          }
```

This removes the `isMatchingContent` import usage in `load()`. Leave the `Deleted` branch (lines 330-337) unchanged.

- [ ] **Step 6: Run to verify the tests pass**

Run: `pnpm test -- src/app/test/integration/conflict-detection.test.ts`
Expected: PASS.

- [ ] **Step 7: Run the #338 regression suite**

Run: `pnpm test -- src/app/test/integration/publish-sync.test.ts`
Expected: PASS. If a test relied on `isMatchingContent`-based catch-up, update it to drive `n`-change or `publishedAt` per the new self-heal (adjust the test, not the source).

- [ ] **Step 8: Commit**

```bash
git add src/app/src/composables/useDraftBase.ts src/app/test/integration/conflict-detection.test.ts
git commit -m "fix(draft): advance baseline on publish and self-heal via dump hash"
```

---

### Task 5: Migrate existing drafts (backfill + clear stale conflicts)

**Files:**
- Modify: `src/app/src/composables/useDraftBase.ts:365-369` (`load()` non-published branch)
- Test: `src/app/test/integration/conflict-detection.test.ts` (extend)

**Interfaces:**
- Consumes: `baseRemote` (Task 1), `load()`.
- Produces: on `load()`, a non-published draft lacking `baseRemote` gets it backfilled from `remoteFile`, and any pre-existing `conflict` produced by the old A-vs-E(B) logic is cleared.

- [ ] **Step 1: Write the failing test**

Append to `src/app/test/integration/conflict-detection.test.ts`:

```ts
  it('backfills baseRemote and clears stale conflicts for pre-existing drafts on load', async () => {
    const mockGit = createMockGit(createMockGithubFile({ content: 'base', sha: 'sha-base' }))
    const context = await cleanAndSetupContext(mockHost, mockGit)
    const fsPath = generateUniqueDocumentFsPath('article')

    await mockHost.document.db.create(fsPath, 'base')
    await context.activeTree.value.draft.load()
    await context.activeTree.value.selectItemByFsPath(fsPath)

    const draft = context.activeTree.value.draft
    const draftItem = draft.list.value.find(d => d.fsPath === fsPath)!
    await draft.update(fsPath, { ...draftItem.modified!, body: { nodes: [['p', {}, 'mine']] as never, frontmatter: {}, meta: {} } })

    // Simulate a draft persisted by the OLD code: no baseRemote, a stale false conflict.
    const stale = draft.list.value.find(d => d.fsPath === fsPath)!
    delete stale.baseRemote
    stale.conflict = { remoteContent: 'x', localContent: 'y' }
    await context.activeTree.value.draft.load()

    const healed = draft.list.value.find(d => d.fsPath === fsPath)!
    expect(healed.baseRemote?.sha).toBe('sha-base')
    expect(healed.conflict).toBeUndefined()
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test -- src/app/test/integration/conflict-detection.test.ts`
Expected: FAIL — `load()` does not backfill `baseRemote` and leaves the stale `conflict`.

- [ ] **Step 3: Add the backfill to the non-published branch of `load()`**

In `load()`, replace the tail of the map callback (currently lines 365-369):

```ts
        if (item.status === DraftStatus.Pristine) {
          await storage.removeItem(key)
          return null
        }
        return item
```

with:

```ts
        if (item.status === DraftStatus.Pristine) {
          await storage.removeItem(key)
          return null
        }

        // Migration: drafts persisted before raw-baseline detection lack `baseRemote`.
        // Backfill it from the remote we have and drop any conflict the old
        // A-vs-E(B) comparison produced — under raw A-vs-A it is a false positive.
        if (!item.baseRemote && item.remoteFile) {
          item.baseRemote = {
            content: item.remoteFile.content ?? '',
            sha: item.remoteFile.sha,
            encoding: item.remoteFile.encoding,
          }
          if (item.conflict) delete item.conflict
          await storage.setItem(key, item as DraftItem<T>)
        }

        return item
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test -- src/app/test/integration/conflict-detection.test.ts`
Expected: PASS.

- [ ] **Step 5: Full verify**

Run: `pnpm verify`
Expected: lint, build, typecheck, and the full test suite pass. Address any fallout in `publish-sync.test.ts` or type errors from the removed `isMatchingContent` usage.

- [ ] **Step 6: Commit**

```bash
git add src/app/src/composables/useDraftBase.ts src/app/test/integration/conflict-detection.test.ts
git commit -m "fix(draft): backfill baseline and clear stale conflicts on load"
```

---

## Self-Review

**Spec coverage:**
- §3.2 data model → Task 1 Step 1 (`baseRemote`, `baseHash`, `publishedAt`). ✓
- §3.3 `checkConflict` rewrite → Task 1. ✓
- §3.4 `create()` captures baseline → Task 2. ✓
- §3.5 `checkAndRefreshConflicts` vs baseline → Task 3. ✓
- §3.6 self-heal via dump hash + max-age cap → Task 4 (Steps 5, max-age const Step 1). ✓
- §3.7 post-publish baseline → Task 4 Step 4. ✓
- §3.8 migration backfill + clear stale conflicts → Task 5. ✓
- §5 testing: unit `checkConflict` (Task 1), formatting-drift-no-conflict + genuine-edit-conflict (Tasks 2–3), self-heal (Task 4), migration (Task 5), regression `publish-sync.test.ts` (Task 4 Step 7) and banner-still-fires (covered: the banner code is untouched per Global Constraints; no test change needed, but `pnpm verify` exercises it). ✓
- §4 CLI deferred → no tasks, intentional. ✓

**Placeholder scan:** No TBD/TODO-style placeholders; every code step shows complete code. (The pre-existing `// TODO: No remote file found` comment in `checkConflict` is retained verbatim from the current source, not a plan placeholder.)

**Type consistency:** `baseRemote: { content: string, sha: string, encoding?: 'utf-8' | 'base64' }`, `baseHash?: string`, `publishedAt?: number`, and `PUBLISHED_OVERLAY_MAX_AGE_MS` are used identically across Tasks 1–5. `checkConflict` signature unchanged. `dbItem.n` accessed via `{ n?: string }` cast in both Task 4 and the mock.

**Known follow-up (not blocking):** `markPublished` stores `sha: ''` for the committed baseline (no git blob SHA available at commit time without an extra fetch). The content-fallback in `checkConflict` (Task 1) covers this. A later enhancement could thread the committed blob SHA from `commitFiles` into `baseRemote.sha`; out of scope here.
