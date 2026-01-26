/**
 * Shared AI types used across frontend and backend
 */

export type AIMode
  = | 'continue'
    | 'fix'
    | 'improve'
    | 'simplify'
    | 'summarize'
    | 'translate'
    | 'extend'
    | 'reduce'

export interface AIGenerateRequest {
  prompt: string
  mode?: AIMode
  language?: string
}

export interface AIGenerateOptions extends AIGenerateRequest {}
