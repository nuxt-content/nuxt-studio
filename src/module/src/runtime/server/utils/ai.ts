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
  if (!hintOptions || !hintOptions.cursor) {
    return null
  }

  const { cursor } = hintOptions

  let hint: string

  switch (cursor) {
    case 'heading-new':
      hint = '⚠️ CRITICAL: User is STARTING A NEW HEADING. Generate ONLY a short and concise heading. DO NOT write full sentences or paragraphs.'
      break
    case 'heading-continue':
      hint = '⚠️ CRITICAL: User is CONTINUING a heading. The cursor is located at the end of the heading. Generate ONLY the end of the heading to complete it. DO NOT write full sentences or paragraphs.'
      break
    case 'heading-middle':
      hint = '⚠️ CRITICAL: User is IN THE MIDDLE of a heading with text after the cursor. Generate ONLY 1-3 words that fit naturally between the existing text. Keep it brief and coherent with what comes after.'
      break
    case 'paragraph-new':
      hint = '⚠️ CRITICAL: User is STARTING A NEW PARAGRAPH. Generate the opening sentence of the new paragraph. If there is a heading before the paragraph, your sentence idea should match the heading. If you fill that a subheading should be used instead of a paragraph, you can start with a subheading and add a paragraph after it.'
      break
    case 'sentence-new':
      hint = '⚠️ CRITICAL: User is STARTING A NEW SENTENCE within a paragraph. Generate a new sentence that continues the thought of the previous ones. You must not add an heading in first position of your sentence.'
      break
    case 'paragraph-middle':
      hint = '⚠️ CRITICAL: User is IN THE MIDDLE of a paragraph with text after the cursor. Generate ONLY a few words (3-8 words MAXIMUM) that connect naturally with the text that follows. DO NOT write complete sentences or end with punctuation. You must not add headings in your sentence.'
      break
    case 'paragraph-continue':
      hint = '⚠️ CRITICAL: User is CONTINUING within a sentence. The cursor is located at the end of the sentence. Generate a few words to complete the current thought. DO NOT start new sentences. You must not add headings in your sentence.'
      break
    default:
      hint = '⚠️ CRITICAL: Generate ONLY what is needed to continue naturally (ONE sentence MAXIMUM). You must not add headings in your sentence.'
  }

  return `# 🎯 CURSOR POSITION REQUIREMENT (MUST FOLLOW):\n${hint}`
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

  // Add cursor position hints LAST (recency bias - most important for continue mode)
  const hintContext = buildHintContext(hintOptions)
  if (hintContext) {
    contextParts.push(hintContext)
  }

  // Combine all context into single block
  const finalContext = contextParts.length > 0
    ? `\n\n${contextParts.join('\n\n')}`
    : ''

  return finalContext
}

/**
 * Estimate token count from text length
 * (1 token ≈ 4 characters)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
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
export function getFixSystem(context: string): string {
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
export function getImproveSystem(context: string): string {
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
export function getSimplifySystem(context: string): string {
  return `You are a writing assistant for content editing. Simplify the given text to make it easier to understand.${context}

Rules:
- Use simpler words and shorter sentences
- Keep technical terms that are necessary for the context

Only output the simplified text, nothing else.`
}

/**
 * Generate system prompt for "translate" mode
 */
export function getTranslateSystem(context: string, language: string = 'English'): string {
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
export function getContinueSystem(context: string): string {
  return `You are a writing assistant helping with content editing inside a Tiptap editor representing a Markdown document. ${context}

⚠️ CRITICAL RULES (MUST FOLLOW):
- NEVER repeat, continue, or expand any words from the end of the user's text
- Match the tone and style of the existing text
- Do not add frontmatter or other yaml metadata syntax to the output, do not start with --- or ... or anything like that.
- Do not add components syntax to the output.

🚨 MOST IMPORTANT:
- Strictly follow the CURSOR POSITION REQUIREMENT and length guidance specified above.`
}
