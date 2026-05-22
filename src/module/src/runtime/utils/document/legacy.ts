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
  return {
    nodes: normalizeMdcChildren(root.children || []).map(mdcNodeToComarkNode),
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
  let next: Record<string, unknown> = props

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

  // Token-list attrs (class, ping, accept, …) come out of @nuxtjs/mdc as
  // arrays but as space-joined strings from comark's parser. Collapse any
  // remaining arrays of primitives so the bridged body matches comark's shape.
  for (const key in next) {
    const value = next[key]
    if (Array.isArray(value) && value.every(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
      next[key] = value.join(' ')
    }
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
