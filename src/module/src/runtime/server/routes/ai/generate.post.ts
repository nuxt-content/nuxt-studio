import { streamText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { eventHandler, readBody, createError, useSession, getRequestProtocol } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { AIGenerateOptions } from '../../../../../../shared/types/ai'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'

export default eventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  // Authentication check - skip in dev mode
  if (!config.public.studio.dev) {
    const session = await useSession(event, {
      name: 'studio-session',
      password: config.studio?.auth?.sessionSecret,
      cookie: {
        secure: getRequestProtocol(event) === 'https',
        path: '/',
      },
    })

    if (!session.data || Object.keys(session.data).length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized. Please log in to use AI features.',
      })
    }
  }

  const aiConfig = config.studio?.ai
  const apiKey = aiConfig?.apiKey
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AI features are not enabled. Please set STUDIO_VERCEL_API_GATEWAY_KEY environment variable.',
    })
  }

  const gateway = createGateway({ apiKey })

  const { prompt, mode, language, selectionLength } = await readBody<AIGenerateOptions>(event)

  if (!prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prompt is required',
    })
  }

  // Shared rules context
  const preserveMarkdown = 'IMPORTANT: Preserve all markdown formatting (bold, italic, links, etc.) exactly as in the original.'

  // Build complete context for AI
  const projectContext = aiConfig?.context
  const contextParts: string[] = []

  // Add project metadata
  if (projectContext) {
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

    if (metadata.length > 0) {
      contextParts.push(`Project Context:\n${metadata.join('\n')}`)
    }

    // Load content context
    if (['improve', 'continue', 'simplify'].includes(mode as string)) {
      const collectionName = projectContext.collectionName as string || 'studio'
      const contentPath = projectContext.contentPath as string || '.studio/CONTEXT.md'

      try {
        const contextFile = await queryCollection(event, collectionName as keyof Collections)
          .where('path', '=', contentPath.replace(/\.md$/, ''))
          .first()

        if (contextFile?.rawbody) {
        // Limit to ~4K tokens (~16K chars) to stay within token budget
          const MAX_CONTEXT_LENGTH = 16000
          const analyzedContext = contextFile.rawbody.substring(0, MAX_CONTEXT_LENGTH)

          contextParts.push(`Writing Guidelines:\n${analyzedContext}`)
        }
      }
      catch (error) {
        console.error('Analyzed context not found or not readable:', error)
      }
    }
  }

  // Combine all context into single block
  const context = contextParts.length > 0
    ? `\n\n${contextParts.join('\n\n')}`
    : ''

  // Calculate maxOutputTokens based on selection length and mode (1 token ≈ 4 characters)
  const estimatedTokens = selectionLength ? Math.ceil(selectionLength / 4) : 100

  let system: string
  let maxOutputTokens: number

  switch (mode) {
    case 'fix':
      system = `You are a writing assistant for content editing. Fix spelling and grammar errors in the given text.${context}

Rules:
- Fix typos, grammar, and punctuation
- Wrap inline code (variables, functions, file paths, commands, package names) with single backticks
- Wrap multi-line code blocks with triple backticks and appropriate language identifier
- DO NOT "correct" technical terms, library names, or intentional abbreviations (e.g., "repo", "config", "env")
- ${preserveMarkdown}

Only output the corrected text, nothing else.`
      maxOutputTokens = Math.ceil(estimatedTokens * 1.5)
      break
    case 'improve':
      system = `You are a writing assistant for content editing. Improve the writing quality of the given text.${context}

Rules:
- Enhance clarity and readability
- Use more professional or engaging language where appropriate
- Keep the core message and meaning
- ${preserveMarkdown}

Only output the improved text, nothing else.`
      maxOutputTokens = Math.ceil(estimatedTokens * 1.5)
      break
    case 'simplify':
      system = `You are a writing assistant for content editing. Simplify the given text to make it easier to understand.${context}

Rules:
- Use simpler words and shorter sentences
- Keep technical terms that are necessary for the context
- ${preserveMarkdown}

Only output the simplified text, nothing else.`
      maxOutputTokens = estimatedTokens
      break
    case 'translate':
      system = `You are a writing assistant. Translate the given text to ${language || 'English'}.${context}

Rules:
- Translate prose and explanations
- DO NOT translate: code, variable names, function names, file paths, CLI commands, package names, error messages
- Keep technical terms in their commonly-used form
- ${preserveMarkdown}

Only output the translated text, nothing else.`
      maxOutputTokens = Math.ceil(estimatedTokens * 1.5)
      break
    case 'continue':
    default:
      system = `You are a writing assistant helping with content editing.${context}

CRITICAL RULES:
- Output ONLY the NEW text that comes AFTER the user's input
- NEVER repeat any words from the end of the user's text
- Keep completions short (1 sentence max)
- Match the tone and style of the existing text
- ${preserveMarkdown}`
      maxOutputTokens = 40
      break
  }

  return streamText({
    model: gateway.languageModel('anthropic/claude-sonnet-4.5'),
    system,
    prompt,
    maxOutputTokens,
  }).toTextStreamResponse()
})
