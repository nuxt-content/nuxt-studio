import { streamText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { eventHandler, readBody, createError, useSession, getRequestProtocol } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { AIGenerateOptions } from '../../../../../../shared/types/ai'

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

  // Build context instructions for the AI
  const projectContext = aiConfig?.context
  const contextInstructions: string[] = []
  if (projectContext) {
    contextInstructions.push('Project Context:')
    if (projectContext.title) {
      contextInstructions.push(`- Project: ${projectContext.title}`)
    }
    if (projectContext.description) {
      contextInstructions.push(`- Description: ${projectContext.description}`)
    }
    if (projectContext.style) {
      contextInstructions.push(`- Writing style: ${projectContext.style}`)
    }
    if (projectContext.tone) {
      contextInstructions.push(`- Tone: ${projectContext.tone}`)
    }
  }

  const contextBlock = contextInstructions.length > 1
    ? `\n\n${contextInstructions.join('\n')}`
    : ''

  // Calculate maxOutputTokens based on selection length and mode (1 token ≈ 4 characters)
  const estimatedTokens = selectionLength ? Math.ceil(selectionLength / 4) : 100

  let system: string
  let maxOutputTokens: number

  switch (mode) {
    case 'fix':
      system = `You are a writing assistant for content editing. Fix spelling and grammar errors in the given text.${contextBlock}

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
      system = `You are a writing assistant for content editing. Improve the writing quality of the given text.${contextBlock}

Rules:
- Enhance clarity and readability
- Use more professional or engaging language where appropriate
- Keep the core message and meaning
- ${preserveMarkdown}

Only output the improved text, nothing else.`
      maxOutputTokens = Math.ceil(estimatedTokens * 1.5)
      break
    case 'simplify':
      system = `You are a writing assistant for content editing. Simplify the given text to make it easier to understand.${contextBlock}

Rules:
- Use simpler words and shorter sentences
- Keep technical terms that are necessary for the context
- ${preserveMarkdown}

Only output the simplified text, nothing else.`
      maxOutputTokens = estimatedTokens
      break
    case 'translate':
      system = `You are a writing assistant. Translate the given text to ${language || 'English'}.${contextBlock}

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
      system = `You are a writing assistant helping with content editing.${contextBlock}

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
