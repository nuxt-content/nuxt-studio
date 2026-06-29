/**
 * LEGACY COMPATIBILITY LAYER
 *
 * These utilities exist solely to bridge the gap between the current @nuxt/content
 * storage format (MarkdownRoot / minimark) and the upcoming native ComarkTree format.
 *
 * When @nuxt/content releases native ComarkTree body support:
 *   1. Delete this file
 *   2. Fix TypeScript errors at call sites:
 *      - host.ts      → remove toComarkBody helper + all db.get/list/create calls to it,
 *                       remove markdownRootFromComarkTree usage in db.upsert
 *      - compare.ts   → update toMarkdownRoot helper to compare ComarkTrees directly
 *      - index.ts     → remove re-exports of comarkTreeFromLegacyDocument and markdownRootFromComarkTree
 *      - generate.ts  → remove unbindComarkTree usage in contentFromMarkdownDocument
 */

import type { MarkdownRoot } from '@nuxt/content'
import type { MDCRoot, MDCElement, MDCNode, MDCText, MDCComment } from '@nuxtjs/mdc'
import type { DatabaseItem } from 'nuxt-studio/app'
import type { ComarkTree, ComarkNode, ComarkElement, ComarkComment } from 'comark'
import { compressTree, decompressTree } from '@nuxt/content/runtime'
import { generateFlatToc } from 'comark/plugins/toc'
import { cleanDataKeys } from './schema'
import { isComarkTree } from './generate'

function comarkToMDC(tree: ComarkTree): MDCRoot {
  return {
    type: 'root',
    children: tree.nodes.map(comarkNodeToMDCNode),
  }
}

function comarkNodeToMDCNode(node: ComarkNode): MDCNode {
  if (typeof node === 'string') {
    return { type: 'text', value: node } as MDCText
  }

  if (Array.isArray(node)) {
    const [tag, attrs, ...children] = node as ComarkElement | ComarkComment

    if (tag === null) {
      return { type: 'comment', value: children[0] as string } as MDCComment
    }

    return {
      type: 'element',
      tag: tag as string,
      props: propsComarkToMDC(tag as string, (attrs as Record<string, unknown>) || {}),
      children: (children as ComarkNode[]).map(comarkNodeToMDCNode),
    } as MDCElement
  }

  return { type: 'text', value: '' } as MDCText
}

function mdcToComark(root: MDCRoot, data: Record<string, unknown> = {}): ComarkTree {
  const repaired = repairMdcRoot(root)
  return {
    nodes: normalizeMdcChildren(repaired.children || []).map(mdcNodeToComarkNode),
    frontmatter: data,
    meta: {},
  }
}

function mdcNodeToComarkNode(node: MDCNode): ComarkNode {
  if (node.type === 'text') {
    return (node as MDCText).value
  }

  if (node.type === 'comment') {
    return [null, {}, (node as MDCComment).value] as unknown as ComarkComment
  }

  if (node.type === 'element') {
    const el = node as MDCElement
    const children = normalizeMdcChildren(el.children || [])
    return [
      el.tag!,
      propsMDCToComark(el.tag!, (el.props as Record<string, unknown>) || {}),
      ...children.map(mdcNodeToComarkNode),
    ] as ComarkElement
  }

  return ''
}

/**
 * Detect and compensate for the @nuxtjs/mdc parser artifact, recursively across
 * the whole tree.
 *
 * When a nested MDC container (e.g. `:::tabs-item{Code}`) wraps a fenced code
 * block (```` ```mdc ```` …), the parser sometimes fails to close the container
 * and CAPTURES every subsequent sibling — at the document level — as content
 * inside it. The artifact is a literal `<p>` whose only text is the missed
 * `:::`/`::` close markers. When we find that `<p>`, we know how deep the
 * miscapture was (one close line per ancestor that should also close), strip
 * the `<pre>`'s baked-in indent, and "promote" the captured siblings back up
 * to their rightful position.
 */
function repairMdcRoot(root: MDCRoot): MDCRoot {
  const sentinel: MDCElement = {
    type: 'element',
    tag: '__root_sentinel__',
    props: {},
    children: root.children || [],
  } as MDCElement
  const repaired = repairMdcNode(sentinel)
  // Any leak that bubbled all the way to the root joins the top-level siblings.
  return {
    type: 'root',
    children: [...((repaired.node as MDCElement).children || []), ...repaired.leak],
  }
}

interface RepairResult {
  node: MDCNode
  leak: MDCNode[]
  promote: number
}

function repairMdcNode(node: MDCNode): RepairResult {
  if (node.type !== 'element') {
    return { node, leak: [], promote: 0 }
  }
  const el = node as MDCElement

  // Recurse depth-first so deeper artifacts are resolved before we scan our level.
  const recursed = (el.children || []).map(repairMdcNode)

  const newChildren: MDCNode[] = []
  const leakUp: MDCNode[] = []
  let promoteUp = 0

  for (const r of recursed) {
    newChildren.push(r.node)
    if (r.leak.length === 0 && r.promote === 0) continue
    if (r.promote === 0) {
      newChildren.push(...r.leak)
      continue
    }
    // Child wants its leak to escape this level too — one ancestor consumed per hop.
    leakUp.push(...r.leak)
    promoteUp = Math.max(promoteUp, r.promote - 1)
  }

  // Now check whether WE directly own an artifact at this level. Only strip
  // when we're a genuine MDC container — at the document root level (sentinel)
  // a `<p>` that happens to contain colon-only text is just literal content
  // (often the rendered text of a previously-stripped artifact written back
  // to disk), and removing it would silently diverge the render from what's
  // on disk → fake conflict.
  if (isMdcContainer(el)) {
    const artifactIdx = newChildren.findIndex(isClosingMarkerArtifact)
    if (artifactIdx !== -1) {
      const artifact = newChildren[artifactIdx] as MDCElement
      const before = newChildren.slice(0, artifactIdx).map(c => stripWrappingIndentFromPre(c))
      const after = newChildren.slice(artifactIdx + 1)
      const text = (artifact.children?.[0] as MDCText)?.value || ''
      const closeLines = text.split('\n').filter(l => /^:{2,}$/.test(l.trim())).length
      return {
        node: { ...el, children: before } as MDCElement,
        leak: [...after, ...leakUp],
        promote: Math.max(0, closeLines - 1) + promoteUp,
      }
    }
  }

  return {
    node: { ...el, children: newChildren } as MDCElement,
    leak: leakUp,
    promote: promoteUp,
  }
}

/**
 * An element is an MDC container — meaning its colon-only `<p>` children could
 * be parser-artifact closing markers — when its tag is a custom MDC component
 * (any tag not in the standard HTML block/inline sets) OR `template` (the slot
 * marker). The root sentinel and plain HTML elements never own these
 * artifacts; colon-only text at those levels is literal content.
 */
function isMdcContainer(el: MDCElement): boolean {
  const tag = el.tag
  if (!tag) return false
  if (tag === '__root_sentinel__') return false
  if (tag === 'template') return true
  return !HTML_BLOCK_TAGS.has(tag) && !HTML_INLINE_TAGS.has(tag)
}

function isClosingMarkerArtifact(node: MDCNode): boolean {
  if (node.type !== 'element') return false
  const el = node as MDCElement
  if (el.tag !== 'p') return false
  if (!el.children || el.children.length !== 1) return false
  const child = el.children[0]
  if (child?.type !== 'text') return false
  // eslint-disable-next-line
  return /^\s*:{2,}(\s*\n\s*:{2,})*\s*$/.test((child as MDCText).value)
}

function stripWrappingIndentFromPre(node: MDCNode): MDCNode {
  if (node.type !== 'element') return node
  const el = node as MDCElement
  if (el.tag !== 'pre') return node
  const code = el.props?.code
  if (typeof code !== 'string') return node
  const indent = commonLeadingWhitespace(code)
  if (!indent) return node
  const stripped = code.split('\n')
    .map(line => line.startsWith(indent) ? line.slice(indent.length) : line)
    .join('\n')
  return { ...el, props: { ...el.props, code: stripped } } as MDCElement
}

function commonLeadingWhitespace(text: string): string {
  const lines = text.split('\n').filter(l => l.trim().length > 0)
  if (lines.length === 0) return ''
  let common = lines[0]?.match(/^\s*/)?.[0] || ''
  for (let i = 1; i < lines.length && common.length > 0; i++) {
    const lws = lines[i]?.match(/^\s*/)?.[0] || ''
    let j = 0
    while (j < common.length && j < lws.length && common[j] === lws[j]) j++
    common = common.slice(0, j)
  }
  return common
}

/**
 * Standard HTML tags whose children we must NOT touch when normalizing — their
 * content model is already well-defined upstream.
 */
const HTML_BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'details', 'dialog', 'dd', 'div',
  'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2',
  'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'iframe', 'li', 'main', 'nav',
  'ol', 'p', 'pre', 'section', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead',
  'tr', 'ul', 'video', 'template',
])

const HTML_INLINE_TAGS = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn',
  'em', 'i', 'img', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span',
  'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'del', 'ins',
])

function isMdcBlockChild(node: MDCNode): boolean {
  if (node.type !== 'element') return false
  const tag = (node as MDCElement).tag
  return tag !== undefined && HTML_BLOCK_TAGS.has(tag)
}

function isMdcInlineChild(node: MDCNode): boolean {
  if (node.type === 'text') return true
  if (node.type !== 'element') return false
  const tag = (node as MDCElement).tag
  return tag !== undefined && HTML_INLINE_TAGS.has(tag)
}

/**
 * Re-wrap inline children in `<p>` when an MDC component's children mix
 * inline-level and block-level nodes.
 */
function normalizeMdcChildren(children: MDCNode[]): MDCNode[] {
  const hasBlock = children.some(isMdcBlockChild)
  const hasInline = children.some(isMdcInlineChild)
  if (!hasBlock || !hasInline) return children

  const result: MDCNode[] = []
  let inlineBuf: MDCNode[] = []

  const flush = () => {
    if (inlineBuf.length === 0) return
    const hasContent = inlineBuf.some(c =>
      c.type === 'element' || (c.type === 'text' && (c as MDCText).value.trim().length > 0),
    )
    if (hasContent) {
      result.push({
        type: 'element',
        tag: 'p',
        props: {},
        children: inlineBuf,
      } as MDCElement)
    }
    inlineBuf = []
  }

  for (const child of children) {
    if (isMdcInlineChild(child)) {
      inlineBuf.push(child)
    }
    else {
      flush()
      result.push(child)
    }
  }
  flush()

  return result
}

/**
 * Normalize props when crossing the MDC → Comark boundary.
 *
 * - `template` slot elements: MDC encodes the slot name in the prop key
 *   (`v-slot:headline=""`), Comark's template handler expects `{ name: 'headline' }`.
 * - `className` (array form used by @nuxtjs/mdc) → `class` (space-joined string
 *   form used by Comark's attribute stringifier).
 * - `rel`: dropped entirely. @nuxt/content's `rehype-external-links` injects
 *   `rel: ['nofollow']` on external links at SQLite-build time, which is not
 *   user-authored and shouldn't leak into the editor or conflict diffs.
 *   We'll add a proper configurable surface for this later.
 */
function propsMDCToComark(tag: string, props: Record<string, unknown>): Record<string, unknown> {
  const { props: unbound, unbound: unboundKeys } = unbindMDCProps(props)
  let next: Record<string, unknown> = unbound

  if (tag === 'template') {
    const vSlotKey = Object.keys(next).find(k => k.startsWith('v-slot:'))
    if (vSlotKey) {
      const slotName = vSlotKey.slice('v-slot:'.length) || 'default'
      const { [vSlotKey]: _omit, ...rest } = next
      next = { name: slotName, ...rest }
    }
  }

  if ('className' in next) {
    const { className, ...rest } = next
    const classStr = Array.isArray(className) ? (className as unknown[]).join(' ') : String(className ?? '')
    if (classStr) {
      next = { ...rest, class: typeof rest.class === 'string' ? `${rest.class} ${classStr}` : classStr }
    }
    else {
      next = rest
    }
  }

  if ('rel' in next) {
    const { rel: _rel, ...rest } = next
    next = rest
  }

  // Token-list attrs (class, ping, accept, …) come from @nuxtjs/mdc as arrays but
  // as space-joined strings from comark — collapse to match. Skip ':' bindings:
  // those are genuine data arrays comark must render as YAML blocks, not inline.
  for (const key in next) {
    if (unboundKeys.has(key)) continue
    const value = next[key]
    if (Array.isArray(value) && value.every(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
      next[key] = value.join(' ')
    }
  }

  return next
}

/**
 * Unwrap @nuxtjs/mdc's ':key' + JSON-string array/object bindings to plain comark
 * values (`{ ':bar': '["baz"]' }` → `{ bar: ['baz'] }`). Booleans keep the ':' so
 * comarkAttributes emits `key` not `key="true"`. The returned `unbound` set marks
 * rewritten keys so the token-list collapse won't re-mangle genuine data arrays.
 */
function unbindMDCProps(props: Record<string, unknown>): { props: Record<string, unknown>, unbound: Set<string> } {
  const next: Record<string, unknown> = {}
  const unbound = new Set<string>()
  for (const [rawKey, value] of Object.entries(props)) {
    if (rawKey.startsWith(':') && typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (typeof parsed === 'boolean') {
          next[rawKey] = value
        }
        else {
          const key = rawKey.slice(1)
          next[key] = parsed
          unbound.add(key)
        }
      }
      catch {
        next[rawKey] = value
      }
    }
    else {
      next[rawKey] = value
    }
  }
  return { props: next, unbound }
}

/**
 * Strip @nuxtjs/mdc ':key' JSON-binding artifacts from array/object attrs in a
 * comark-shaped body read straight from the dump (no MDC→Comark bridge). Without
 * this, comark renders such a prop as an inline `{:bar="[...]"}` literal instead of
 * a YAML block, producing a permanent phantom conflict. Scalar bindings are left
 * alone — comark round-trips those itself; stripping the colon would drop them.
 */
export function unbindComarkTree(tree: ComarkTree): ComarkTree {
  return { ...tree, nodes: tree.nodes.map(unbindComarkNode) }
}

function unbindComarkNode(node: ComarkNode): ComarkNode {
  if (!Array.isArray(node)) return node
  const [tag, attrs, ...children] = node as ComarkElement | ComarkComment
  if (tag === null) return node // comments carry no bindable attrs
  return [
    tag,
    unbindMDCBlockProps((attrs as Record<string, unknown>) || {}),
    ...(children as ComarkNode[]).map(unbindComarkNode),
  ] as ComarkElement
}

function unbindMDCBlockProps(props: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const [rawKey, value] of Object.entries(props)) {
    if (rawKey.startsWith(':') && typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (parsed !== null && typeof parsed === 'object') {
          next[rawKey.slice(1)] = parsed
          continue
        }
      }
      catch {
        // not JSON — leave untouched
      }
    }
    next[rawKey] = value
  }
  return next
}

/**
 * Reverse of `propsMDCToComark`. Used when writing a Comark body back to the
 * legacy MarkdownRoot format consumed by @nuxt/content.
 */
function propsComarkToMDC(tag: string, attrs: Record<string, unknown>): Record<string, unknown> {
  let next: Record<string, unknown> = attrs

  if (tag === 'template' && typeof next.name === 'string') {
    const { name, ...rest } = next
    next = { ...rest, [`v-slot:${name as string}`]: '' }
  }

  if (typeof next.class === 'string') {
    const { class: classStr, ...rest } = next
    const classes = (classStr as string).split(/\s+/).filter(Boolean)
    if (classes.length) {
      next = { ...rest, className: classes }
    }
    else {
      next = rest
    }
  }

  return next
}

/**
 * Convert a legacy stored document's body (MarkdownRoot/minimark) to a ComarkTree.
 * Used at DB read boundaries (db.get, db.list, db.create) to transparently upgrade
 * legacy documents to the new format before they reach the app.
 */
export function comarkTreeFromLegacyDocument(document: DatabaseItem): ComarkTree | null {
  if (!document.body) return null
  if (isComarkTree(document.body)) return document.body as unknown as ComarkTree
  const body: MDCRoot = (document.body as { type: string }).type === 'minimark'
    ? decompressTree(document.body as never)
    : (document.body as MDCRoot)
  return mdcToComark(body, cleanDataKeys(document) as Record<string, unknown>)
}

/**
 * Convert a ComarkTree body back to the legacy compressed MarkdownRoot format for DB storage.
 * Used at the DB write boundary (db.upsert) to store documents in the current @nuxt/content format.
 */
export function markdownRootFromComarkTree(tree: ComarkTree): MarkdownRoot {
  const mdcBody = comarkToMDC(tree)
  const compressedBody = compressTree(mdcBody)
  const toc = generateFlatToc(tree, { title: '', depth: 2, searchDepth: 2, links: [] })
  return { ...compressedBody, toc } as MarkdownRoot
}
