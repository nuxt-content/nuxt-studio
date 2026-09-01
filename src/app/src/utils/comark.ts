import type { Node, ElementNode, CommentNode } from 'comark'

export function isElement(node: Node): node is ElementNode {
  return Array.isArray(node) && node[0] !== null
}

export function isComment(node: Node): node is CommentNode {
  return Array.isArray(node) && node[0] === null
}

export function getTag(node: ElementNode): string {
  return node[0] as string
}

export function getAttrs(node: ElementNode): Record<string, unknown> {
  return (node[1] as Record<string, unknown>) || {}
}

export function getChildren(node: ElementNode): Node[] {
  return node.slice(2) as Node[]
}
