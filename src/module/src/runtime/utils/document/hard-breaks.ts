import type { ComarkElement, ComarkNode, ComarkTree } from 'comark'

const TRAILING_MARKDOWN_HARD_BREAK = / {2}\n$/
const LEADING_LINE_BREAK = /^\n/

/**
 * Keep Markdown hard breaks idempotent when a document is opened and saved again.
 *
 * Parsed Markdown hard breaks can be represented as both text (`"  \n"`) and a
 * structural `br` node in the same paragraph. Rendering both forms creates an
 * extra blank line on every subsequent save, so the save path keeps the `br`
 * node and removes only the adjacent duplicate parser text.
 */
export function normalizeMarkdownHardBreaks(tree: ComarkTree): ComarkTree {
  return {
    ...tree,
    nodes: tree.nodes.map(normalizeHardBreakNode),
  }
}

function normalizeHardBreakNode(node: ComarkNode): ComarkNode {
  if (typeof node === 'string' || !Array.isArray(node)) {
    return node
  }

  const [tag, attrs, ...children] = node
  const normalizedChildren = normalizeHardBreakChildren(children.map(normalizeHardBreakNode))

  return [tag, attrs, ...normalizedChildren] as ComarkNode
}

function normalizeHardBreakChildren(children: ComarkNode[]): ComarkNode[] {
  const normalizedChildren = [...children]

  normalizedChildren.forEach((child, index) => {
    if (isHardBreakNode(child)) {
      removeDuplicateHardBreakTextAround(normalizedChildren, index)
    }
  })

  return normalizedChildren
}

function removeDuplicateHardBreakTextAround(children: ComarkNode[], hardBreakIndex: number): void {
  const previous = children[hardBreakIndex - 1]
  const next = children[hardBreakIndex + 1]

  if (typeof previous === 'string') {
    children[hardBreakIndex - 1] = previous.replace(TRAILING_MARKDOWN_HARD_BREAK, '')
  }

  if (typeof next === 'string') {
    children[hardBreakIndex + 1] = next.replace(LEADING_LINE_BREAK, '')
  }
}

function isHardBreakNode(node: ComarkNode | undefined): node is ComarkElement {
  return Array.isArray(node) && node[0] === 'br'
}
