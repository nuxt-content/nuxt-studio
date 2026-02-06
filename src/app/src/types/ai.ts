/**
 * Shared AI types used across frontend and backend
 */

export type AIMode
  = 'continue'
    | 'fix'
    | 'improve'
    | 'simplify'
    | 'translate'

export type CursorContext
  = | 'heading-new' // Starting a new heading/title
    | 'heading-continue' // Continuing within a heading (at end)
    | 'heading-middle' // Continuing within a heading (with text after)
    | 'paragraph-new' // Starting a new paragraph
    | 'paragraph-continue' // Continuing within a paragraph (mid-sentence, at end)
    | 'paragraph-middle' // Continuing within a paragraph (with text after)
    | 'sentence-new' // Starting a new sentence in paragraph (after punctuation)

export interface AIHintOptions {
  cursor: CursorContext
  previousNodeType?: string
  headingText?: string
  currentComponent?: string
  currentSlot?: string
}

export interface AIGenerateOptions {
  prompt?: string // For transform modes (fix, improve, simplify, translate)
  previousContext?: string // Text before cursor position (required for continue mode)
  nextContext?: string // Text after cursor position (for continue mode)
  mode?: AIMode
  language?: string
  selectionLength?: number
  fsPath?: string
  collectionName?: string
  hintOptions?: AIHintOptions
}

/**
 * Diff part for AI transform highlighting
 */
export interface DiffPart {
  type: 'added' | 'removed' | 'unchanged'
  text: string
}

/**
 * Callbacks for AI transform accept/decline actions
 */
export interface AITransformCallbacks {
  onAccept: () => void
  onDecline: () => void
}

/**
 * AI feature limits and constraints
 */
export const AI_LIMITS = {
  /** Maximum selection length for AI transforms (in characters) */
  MAX_SELECTION_LENGTH: 1000,
  /** Maximum tokens for diff computation (LCS is O(n*m)) */
  MAX_DIFF_TOKENS: 500,
  /** Maximum context length for collection guidelines (in characters) */
  MAX_CONTEXT_LENGTH: 16000,
  /** Context sent before cursor for continue mode (in characters) */
  CONTINUE_PREVIOUS_CONTEXT: 400,
  /** Context sent after cursor for continue mode (in characters) */
  CONTINUE_NEXT_CONTEXT: 200,
} as const
