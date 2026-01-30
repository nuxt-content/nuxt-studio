/**
 * Shared AI types used across frontend and backend
 */

export type AIMode
  = 'continue'
    | 'fix'
    | 'improve'
    | 'simplify'
    | 'translate'

export interface AIHintOptions {
  isNewLine?: boolean
  isInHeading?: boolean
  isAtEndOfNode?: boolean
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
