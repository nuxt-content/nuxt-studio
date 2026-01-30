import type { EditorState } from '@tiptap/pm/state'
import type { AIHintOptions } from '../../types/ai'
import { tiptapSliceToMDC } from './tiptapToMdc'
import { stringifyMarkdown } from '@nuxtjs/mdc/runtime'

/**
 * Generate AI hint options based on cursor position in the editor
 */
export function generateHintOptions(state: EditorState, cursorPos: number): AIHintOptions {
  // Check if cursor is at the start of a new line
  const textBeforeCursor = state.doc.textBetween(Math.max(0, cursorPos - 10), cursorPos, '\n')
  const isNewLine = textBeforeCursor.endsWith('\n') || cursorPos === 0

  // Get the current node info
  const $pos = state.doc.resolve(cursorPos)
  const parentNode = $pos.parent
  const isInHeading = parentNode.type.name === 'heading'
  const isAtEndOfNode = cursorPos === $pos.end()

  return {
    isNewLine,
    isInHeading,
    isAtEndOfNode,
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
