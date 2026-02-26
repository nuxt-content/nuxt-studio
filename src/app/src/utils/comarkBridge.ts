import type { ComarkTree, ComarkNode, ComarkElement, ComarkComment } from 'comark/ast'
import type { MDCRoot, MDCElement, MDCNode, MDCText, MDCComment } from '@nuxtjs/mdc'

/**
 * Convert a ComarkTree (tuple-based AST) to MDCRoot (HAST-like object AST)
 * Required for @nuxt/content compatibility (compressTree/decompressTree expect MDCRoot)
 */
export function comarkToMDC(tree: ComarkTree): MDCRoot {
  return {
    type: 'root',
    children: tree.nodes.map(comarkNodeToMDCNode),
  }
}

function comarkNodeToMDCNode(node: ComarkNode): MDCNode {
  // ComarkText is a plain string
  if (typeof node === 'string') {
    return { type: 'text', value: node } as MDCText
  }

  if (Array.isArray(node)) {
    const [tag, attrs, ...children] = node as ComarkElement | ComarkComment

    // ComarkComment has null tag: [null, {}, commentText]
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

/**
 * Convert an MDCRoot (HAST-like object AST) to ComarkTree (tuple-based AST)
 * Required to use comark's renderMarkdown/toc/highlight APIs
 */
export function mdcToComark(root: MDCRoot, data: Record<string, unknown> = {}): ComarkTree {
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
