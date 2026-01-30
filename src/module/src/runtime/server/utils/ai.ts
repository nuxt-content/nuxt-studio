import type { H3Event } from 'h3'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'
import type { DatabasePageItem, AIHintOptions } from 'nuxt-studio/app'
import type { ModuleOptions } from '../../../module'

/**
 * Build file location context
 */
export function buildLocationContext(fsPath?: string, collectionName?: string): string | null {
  if (!fsPath) {
    return null
  }

  const locationParts: string[] = []
  if (collectionName) {
    locationParts.push(`- Collection: ${collectionName}`)
  }
  locationParts.push(`- File: ${fsPath}`)

  return locationParts.length > 0
    ? `# File Location:\n${locationParts.join('\n')}`
    : null
}

/**
 * Build project metadata context
 */
export function buildMetadataContext(projectContext?: NonNullable<ModuleOptions['ai']>['context']): string | null {
  if (!projectContext) {
    return null
  }

  const metadata: string[] = []
  if (projectContext.title) {
    metadata.push(`- Project: ${projectContext.title}`)
  }
  if (projectContext.description) {
    metadata.push(`- Description: ${projectContext.description}`)
  }
  if (projectContext.style) {
    metadata.push(`- Writing style: ${projectContext.style}`)
  }
  if (projectContext.tone) {
    metadata.push(`- Tone: ${projectContext.tone}`)
  }

  return metadata.length > 0
    ? `# Project Context:\n${metadata.join('\n')}`
    : null
}

/**
 * Build cursor position hint context
 */
export function buildHintContext(hintOptions?: AIHintOptions): string | null {
  if (!hintOptions) {
    return null
  }

  const { isNewLine, isInHeading, isAtEndOfNode } = hintOptions

  let hint: string
  if (isNewLine) {
    hint = 'The previous line is COMPLETE and FINISHED. Do NOT continue or expand it. Generate the FIRST words of a NEW paragraph that comes AFTER (1 sentence max)'
  }
  else if (isInHeading && !isAtEndOfNode) {
    hint = 'Cursor is in the middle of a heading - complete with 2-4 words max'
  }
  else if (isInHeading && isAtEndOfNode) {
    hint = 'Cursor is at the end of a heading - complete with 2-4 words max'
  }
  else {
    hint = 'Cursor is continuing the current line/paragraph (1 sentence max)'
  }

  const result = `# Cursor Position:\n- ${hint}`

  return result
}

/**
 * Load collection-specific writing guidelines from context file
 */
export async function buildCollectionSummaryContext(
  event: H3Event,
  collectionName?: string,
  projectContext?: NonNullable<ModuleOptions['ai']>['context'],
): Promise<string | null> {
  if (!collectionName || !projectContext) return null

  const studioCollectionName = projectContext.collection?.name
  const contextFolder = projectContext.collection?.folder

  if (!studioCollectionName || !contextFolder) return null

  try {
    const contextFilePath = `${contextFolder}/${collectionName}.md`
    const stem = `${contextFolder}/${collectionName}`

    const contextFile = await queryCollection(event, studioCollectionName as keyof Collections)
      .where('stem', '=', stem)
      .first() as DatabasePageItem | null

    if (!contextFile) {
      return null
    }

    if (contextFile?.rawbody && typeof contextFile.rawbody === 'string') {
      // Limit to ~4K tokens (~16K chars) to stay within token budget
      const MAX_CONTEXT_LENGTH = 16000
      const analyzedContext = contextFile.rawbody.substring(0, MAX_CONTEXT_LENGTH)

      return `Writing Guidelines (from ${contextFilePath}):\n${analyzedContext}`
    }
  }
  catch (error) {
    console.error('[AI] Error loading collection summary:', error)
  }

  return null
}

/**
 * Build complete AI context from file location, project metadata, and writing guidelines
 */
export async function buildAIContext(
  event: H3Event,
  options: {
    fsPath?: string
    collectionName?: string
    mode?: string
    projectContext?: NonNullable<ModuleOptions['ai']>['context']
    hintOptions?: AIHintOptions
  },
): Promise<string> {
  const { fsPath, collectionName, mode, projectContext, hintOptions } = options
  const contextParts: string[] = []

  // Add cursor position hints
  const hintContext = buildHintContext(hintOptions)
  if (hintContext) {
    contextParts.push(hintContext)
  }

  // Add file location context
  const locationContext = buildLocationContext(fsPath, collectionName)
  if (locationContext) {
    contextParts.push(locationContext)
  }

  // Add project metadata
  const metadataContext = buildMetadataContext(projectContext)
  if (metadataContext) {
    contextParts.push(metadataContext)
  }

  // Load collection summary (only for specific modes)
  if (['improve', 'continue', 'simplify'].includes(mode as string)) {
    const collectionContext = await buildCollectionSummaryContext(event, collectionName, projectContext)
    if (collectionContext) {
      contextParts.push(collectionContext)
    }
  }

  // Combine all context into single block
  const finalContext = contextParts.length > 0
    ? `\n\n${contextParts.join('\n\n')}`
    : ''

  return finalContext
}

/**
 * Calculate max output tokens based on selection length and mode
 * (1 token ≈ 4 characters)
 */
export function calculateMaxTokens(selectionLength: number = 100, mode: string): number {
  const estimatedTokens = Math.ceil(selectionLength / 4)

  switch (mode) {
    case 'fix':
    case 'improve':
    case 'translate':
      return Math.ceil(estimatedTokens * 1.5)
    case 'simplify':
      return estimatedTokens
    case 'continue':
    default:
      return 40
  }
}

/**
 * Generate system prompt for "fix" mode
 */
export function getFixPrompt(context: string): string {
  return `You are a writing assistant for content editing. Fix spelling and grammar errors in the given text.${context}

Rules:
- Fix typos, grammar, and punctuation
- Wrap inline code (variables, functions, file paths, commands, package names) with single backticks
- Wrap multi-line code blocks with triple backticks and appropriate language identifier
- DO NOT "correct" technical terms, library names, or intentional abbreviations (e.g., "repo", "config", "env")

Only output the corrected text, nothing else.`
}

/**
 * Generate system prompt for "improve" mode
 */
export function getImprovePrompt(context: string): string {
  return `You are a writing assistant for content editing. Improve the writing quality of the given text.${context}

Rules:
- Enhance clarity and readability
- Use more professional or engaging language where appropriate
- Keep the core message and meaning

Only output the improved text, nothing else.`
}

/**
 * Generate system prompt for "simplify" mode
 */
export function getSimplifyPrompt(context: string): string {
  return `You are a writing assistant for content editing. Simplify the given text to make it easier to understand.${context}

Rules:
- Use simpler words and shorter sentences
- Keep technical terms that are necessary for the context

Only output the simplified text, nothing else.`
}

/**
 * Generate system prompt for "translate" mode
 */
export function getTranslatePrompt(context: string, language: string = 'English'): string {
  return `You are a writing assistant. Translate the given text to ${language}.${context}

Rules:
- Translate prose and explanations
- DO NOT translate: code, variable names, function names, file paths, CLI commands, package names, error messages
- Keep technical terms in their commonly-used form

Only output the translated text, nothing else.`
}

/**
 * Generate system prompt for "continue" mode
 */
export function getContinuePrompt(context: string): string {
  return `You are a writing assistant helping with content editing.${context}

CRITICAL RULES:
- Output ONLY the NEW text that comes AFTER the user's input
- NEVER repeat, continue, or expand any words from the end of the user's text
- Follow the length guidance specified in the Cursor Position hint above
- Match the tone and style of the existing text`
}
