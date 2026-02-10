/**
 * Utility functions for AI transform operations
 */

import type { DiffPart } from '../../types/ai'
import { AI_LIMITS } from '../../types/ai'

interface InternalDiffPart extends DiffPart {
  inNew: boolean
}

interface LCSMatch {
  origIdx: number
  updatedIdx: number
}

const MAX_TOKENS = AI_LIMITS.MAX_DIFF_TOKENS

/**
 * Split text into tokens (words + whitespace)
 */
function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter(t => t.length > 0)
}

/**
 * Find Longest Common Subsequence indices between two arrays
 * Uses dynamic programming to identify matching tokens
 */
export function findLCS(arr1: string[], arr2: string[]): LCSMatch[] {
  const m = arr1.length
  const n = arr2.length

  // Build LCS length matrix
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      }
      else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find LCS indices
  const lcs: LCSMatch[] = []
  let i = m
  let j = n

  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift({ origIdx: i - 1, updatedIdx: j - 1 })
      i--
      j--
    }
    else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    }
    else {
      j--
    }
  }

  return lcs
}

/**
 * Build diff parts based on LCS matches
 */
function buildDiffParts(
  originalTokens: string[],
  updatedTokens: string[],
  lcsIndices: LCSMatch[],
): InternalDiffPart[] {
  const parts: InternalDiffPart[] = []
  let origIdx = 0
  let updatedIdx = 0
  let lcsIdx = 0

  while (origIdx < originalTokens.length || updatedIdx < updatedTokens.length) {
    const nextLCS = lcsIndices[lcsIdx]

    // Process removed tokens (in original but not in updated)
    while (nextLCS && origIdx < nextLCS.origIdx) {
      parts.push({ type: 'removed', text: originalTokens[origIdx], inNew: false })
      origIdx++
    }

    // Process added tokens (in updated but not in original)
    while (nextLCS && updatedIdx < nextLCS.updatedIdx) {
      parts.push({ type: 'added', text: updatedTokens[updatedIdx], inNew: true })
      updatedIdx++
    }

    // Process unchanged token
    if (nextLCS) {
      parts.push({ type: 'unchanged', text: updatedTokens[updatedIdx], inNew: true })
      origIdx++
      updatedIdx++
      lcsIdx++
    }
    else {
      // No more LCS matches, everything remaining is added or removed
      if (origIdx < originalTokens.length) {
        parts.push({ type: 'removed', text: originalTokens[origIdx], inNew: false })
        origIdx++
      }
      if (updatedIdx < updatedTokens.length) {
        parts.push({ type: 'added', text: updatedTokens[updatedIdx], inNew: true })
        updatedIdx++
      }
    }
  }

  return parts
}

/**
 * Group consecutive parts with the same type that are in the new text
 */
function groupDiffParts(parts: InternalDiffPart[]): DiffPart[] {
  const grouped: DiffPart[] = []

  for (const part of parts) {
    if (!part.inNew) continue // Skip removed tokens as they're not in the new document

    const lastGroup = grouped[grouped.length - 1]

    if (lastGroup && lastGroup.type === part.type) {
      lastGroup.text += part.text
    }
    else {
      grouped.push({ type: part.type, text: part.text })
    }
  }

  return grouped
}

/**
 * Compute word-based diff using longest common subsequence
 * Returns array of diff parts to be applied to the new text
 */
export function computeWordDiff(original: string, updated: string): DiffPart[] {
  // Split into words, preserving whitespace as separate tokens
  const originalTokens = tokenize(original)
  const updatedTokens = tokenize(updated)

  // For large selections, skip diff highlighting to avoid UI blocking
  if (originalTokens.length > MAX_TOKENS || updatedTokens.length > MAX_TOKENS) {
    // Simple fallback: no highlighting for large texts
    return []
  }

  // Find LCS (Longest Common Subsequence) to identify matching words
  const lcsIndices = findLCS(originalTokens, updatedTokens)

  // Build diff based on LCS
  const parts = buildDiffParts(originalTokens, updatedTokens, lcsIndices)

  // Group consecutive parts with same type that are in the new text
  return groupDiffParts(parts)
}

/**
 * Create a simple "all added" diff for translation mode
 */
export function createAddedDiff(text: string): DiffPart[] {
  return [{ type: 'added', text }]
}

/**
 * Decoration styles for diff highlighting
 */
export const DIFF_STYLES = {
  loading: 'background: rgba(209, 213, 219, 0.5); color: rgba(107, 114, 128, 0.8); border-radius: 0.25rem; padding: 0.125rem 0.25rem;',
  added: 'background: #dbeafe; color: #1e40af; border-radius: 0.25rem; padding: 0.125rem 0.25rem; font-weight: 500;',
} as const
