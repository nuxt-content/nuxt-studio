import type { EditorState } from '@tiptap/pm/state'
import type { AIHintOptions } from '../../types/ai'
import { tiptapSliceToMDC } from './tiptapToMdc'
import { stringifyMarkdown } from '@nuxtjs/mdc/runtime'

function isWhitespace(char: string): boolean {
  return /\s/.test(char)
}

/**
 * Detect where a space needs to be added when inserting AI completion
 */
export function detectExtraSpace(state: EditorState, cursorPos: number): 'before' | 'after' | null {
  const charBefore = cursorPos > 0 ? state.doc.textBetween(cursorPos - 1, cursorPos) : ''
  const charAfter = cursorPos < state.doc.content.size ? state.doc.textBetween(cursorPos, cursorPos + 1) : ''

  // If space already exists before or after, no space needed
  if (isWhitespace(charBefore) || isWhitespace(charAfter)) {
    return null
  }

  // If there's text after cursor, prioritize adding space after (forward completion)
  if (charAfter !== '' && !isWhitespace(charAfter)) {
    return 'after'
  }

  // If there's text before cursor (and no text after), add space before
  if (charBefore !== '' && !isWhitespace(charBefore)) {
    return 'before'
  }

  // No text before or after, no space needed
  return null
}

/**
 * Apply extra space to suggestion text based on detected space position
 */
export function applyExtraSpace(text: string, extraSpace: 'before' | 'after' | null): string {
  if (extraSpace === 'before') {
    return ' ' + text
  }
  else if (extraSpace === 'after') {
    return text + ' '
  }

  return text
}

/**
 * Detect if cursor is inside a component and which slot
 */
export function detectComponentContext(state: EditorState, cursorPos: number): { currentComponent?: string, currentSlot?: string } {
  const $pos = state.doc.resolve(cursorPos)

  // Walk up the node tree to find component and slot
  let currentComponent: string | undefined
  let currentSlot: string | undefined

  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth)
    const nodeType = node.type.name

    // Check if this is a component node (in Studio, components are 'element' nodes with a 'tag' attribute)
    if (nodeType === 'element') {
      // Get component name from 'tag' attribute
      currentComponent = node.attrs?.tag
      break
    }

    // Check if this is a slot node
    if (nodeType === 'slot') {
      currentSlot = node.attrs?.name || 'default'
    }
  }

  return { currentComponent, currentSlot }
}

/**
 * Generate AI hint options based on cursor position in the editor
 *
 */
export function generateHintOptions(state: EditorState, cursorPos: number): AIHintOptions {
  // Get context before cursor for analysis
  const textBeforeCursor = state.doc.textBetween(Math.max(0, cursorPos - 100), cursorPos, '\n', '\n')
  const trimmedText = textBeforeCursor.trimEnd()

  // Get current node info
  const $pos = state.doc.resolve(cursorPos)
  const parentNode = $pos.parent
  const nodeType = parentNode.type.name
  const isAtStartOfNode = $pos.parentOffset === 0

  // Check if there's text after cursor in the same node
  const nodeEndPos = $pos.end()
  const textAfterCursor = state.doc.textBetween(cursorPos, nodeEndPos, '\n', '\n')
  const hasTextAfter = textAfterCursor.trim().length > 0

  // Check for previous node (for detecting heading before current position)
  let previousNodeType: string | undefined
  let headingText: string | undefined

  // Look for the previous sibling at the parent level (typically document level)
  // If we're in a paragraph, we need to look at the document's children to find previous heading
  if ($pos.depth > 0) {
    const parentDepth = $pos.depth - 1
    const nodeIndex = $pos.index(parentDepth)

    if (nodeIndex > 0) {
      const parentNode = $pos.node(parentDepth)
      const previousNode = parentNode.child(nodeIndex - 1)
      previousNodeType = previousNode.type.name

      // If previous node is a heading, capture its text
      if (previousNodeType === 'heading') {
        headingText = previousNode.textContent
      }
    }
  }

  // Detect component and slot context
  const { currentComponent, currentSlot } = detectComponentContext(state, cursorPos)

  // Determine cursor context
  let cursor: AIHintOptions['cursor']

  if (nodeType === 'heading') {
    // In a heading
    if (isAtStartOfNode || cursorPos === 0) {
      cursor = 'heading-new'
    }
    else if (hasTextAfter) {
      cursor = 'heading-middle'
    }
    else {
      cursor = 'heading-continue'
    }
  }
  else if (nodeType === 'paragraph') {
    // In a paragraph
    const isNewParagraph = cursorPos === 0
      || textBeforeCursor.match(/\n\n\s*$/) !== null
      || (isAtStartOfNode && textBeforeCursor.endsWith('\n'))

    // Check if after sentence-ending punctuation (with or without space)
    const isAfterSentenceEnd = /[.!?]\s*$/.test(trimmedText)

    if (isNewParagraph) {
      cursor = 'paragraph-new'
    }
    else if (isAfterSentenceEnd) {
      // After "." in same node → sentence-new (takes precedence over paragraph-middle)
      cursor = 'sentence-new'
    }
    else if (hasTextAfter) {
      cursor = 'paragraph-middle'
    }
    else {
      cursor = 'paragraph-continue'
    }
  }
  else {
    // Default to paragraph continue for other node types
    cursor = 'paragraph-continue'
  }

  return {
    cursor,
    previousNodeType,
    headingText,
    currentComponent,
    currentSlot,
  }
}

/**
 * Convert a TipTap editor state slice to markdown string
 */
export async function tiptapSliceToMarkdown(
  state: EditorState,
  from: number,
  to: number,
  maxChars?: number,
): Promise<string> {
  // Convert TipTap slice to MDC AST
  const { body, data } = await tiptapSliceToMDC(state, from, to)

  // Stringify MDC AST to markdown
  const markdown = await stringifyMarkdown(body, data)

  if (!markdown) {
    return ''
  }

  // Trim to max length if specified
  if (maxChars && markdown.length > maxChars) {
    return markdown.slice(-maxChars)
  }

  return markdown
}
