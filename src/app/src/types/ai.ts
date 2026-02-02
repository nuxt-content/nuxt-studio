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
}

export interface AIGenerateOptions {
  prompt: string
  mode?: AIMode
  language?: string
  selectionLength?: number
  fsPath?: string
  collectionName?: string
  hintOptions?: AIHintOptions
}
