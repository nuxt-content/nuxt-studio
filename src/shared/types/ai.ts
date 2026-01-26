/**
 * Shared AI types used across frontend and backend
 */

export type AIMode
  = 'continue'
    | 'fix'
    | 'improve'
    | 'simplify'
    | 'translate'

export interface AIGenerateRequest {
  prompt: string
  mode?: AIMode
  language?: string
  selectionLength?: number
}

export interface AIGenerateOptions extends AIGenerateRequest {}
