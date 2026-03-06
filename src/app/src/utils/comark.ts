import type { ComarkNode, ComarkElement, ComarkComment } from 'comark/ast'

export function isElement(node: ComarkNode): node is ComarkElement {
  return Array.isArray(node) && node[0] !== null
}

export function isComment(node: ComarkNode): node is ComarkComment {
  return Array.isArray(node) && node[0] === null
}

export function getTag(node: ComarkElement): string {
  return node[0] as string
}

export function getAttrs(node: ComarkElement): Record<string, unknown> {
  return (node[1] as Record<string, unknown>) || {}
}

export function getChildren(node: ComarkElement): ComarkNode[] {
  return node.slice(2) as ComarkNode[]
}
