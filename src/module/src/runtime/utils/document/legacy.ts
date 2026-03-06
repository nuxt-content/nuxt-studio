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
import type { ComarkTree, ComarkNode, ComarkElement, ComarkComment } from 'comark/ast'
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
      props: (attrs as Record<string, unknown>) || {},
      children: (children as ComarkNode[]).map(comarkNodeToMDCNode),
    } as MDCElement
  }

  return { type: 'text', value: '' } as MDCText
}

function mdcToComark(root: MDCRoot, data: Record<string, unknown> = {}): ComarkTree {
  return {
    nodes: (root.children || []).map(mdcNodeToComarkNode),
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
    return [
      el.tag!,
      (el.props as Record<string, unknown>) || {},
      ...(el.children || []).map(mdcNodeToComarkNode),
    ] as ComarkElement
  }

  return ''
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
