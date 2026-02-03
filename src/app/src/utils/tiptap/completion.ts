import type { EditorState } from '@tiptap/pm/state'
import type { AIHintOptions } from '../../types/ai'
import { tiptapSliceToMDC } from './tiptapToMdc'
import { stringifyMarkdown } from '@nuxtjs/mdc/runtime'

/**
 * Detect where a space needs to be added when inserting AI completion
 */
export function detectExtraSpace(state: EditorState, cursorPos: number): 'before' | 'after' | null {
  const charBefore = cursorPos > 0 ? state.doc.textBetween(cursorPos - 1, cursorPos) : ''
  const charAfter = cursorPos < state.doc.content.size ? state.doc.textBetween(cursorPos, cursorPos + 1) : ''

  // If space already exists before or after, no space needed
  if (charBefore === ' ' || charAfter === ' ') {
    return null
  }

  // If there's text after cursor, prioritize adding space after (forward completion)
  if (charAfter !== '' && charAfter !== ' ') {
    return 'after'
  }

  // If there's text before cursor (and no text after), add space before
  if (charBefore !== '' && charBefore !== ' ') {
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

  // Look for the previous sibling or traverse up to find a heading
  const nodeIndex = $pos.index($pos.depth)
  if (nodeIndex > 0) {
    const previousNode = $pos.parent.child(nodeIndex - 1)
    previousNodeType = previousNode.type.name

    // If previous node is a heading, capture its text
    if (previousNodeType === 'heading') {
      headingText = previousNode.textContent
    }
  }

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
