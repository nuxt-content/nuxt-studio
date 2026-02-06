import { streamText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { eventHandler, readBody, createError, useSession, getRequestProtocol } from 'h3'
import { useRuntimeConfig } from '#imports'
import {
  buildAIContext,
  calculateMaxTokens,
  getSystem,
} from '../../utils/ai/generate'
import type { AIGenerateOptions } from 'nuxt-studio/app'

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
      statusMessage: 'AI features are not enabled. Please set AI_GATEWAY_API_KEY environment variable.',
    })
  }

  const gateway = createGateway({ apiKey })

  const { prompt, previousContext, nextContext, mode, language, selectionLength, fsPath, collectionName, hintOptions } = await readBody<AIGenerateOptions>(event)

  // For continue mode, require previousContext. For other modes, use prompt.
  if (mode === 'continue') {
    if (!previousContext) {
      throw createError({
        statusCode: 400,
        statusMessage: 'previousContext is required for continue mode',
      })
    }
  }
  else {
    if (!prompt) {
      throw createError({
        statusCode: 400,
        statusMessage: 'prompt is required for transform modes',
      })
    }
  }

  if (!fsPath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File path is required',
    })
  }

  if (!collectionName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Collection name is required',
    })
  }

  // Build complete context for AI
  const projectContext = aiConfig?.context
  const context = await buildAIContext(event, {
    fsPath,
    collectionName,
    mode,
    projectContext,
    hintOptions,
  })

  // Generate system prompt based on mode
  const system = getSystem(mode || 'continue', context, language)

  // Build the actual prompt based on mode
  let finalPrompt: string
  if (mode === 'continue') {
    // For continue mode, format with clear before/after sections
    finalPrompt = previousContext!
    if (nextContext) {
      finalPrompt = `${previousContext}[CURSOR]${nextContext}`
    }
  }
  else {
    // For transform modes, use the prompt field
    finalPrompt = prompt!
  }

  // Calculate maxOutputTokens based on selection length, mode, and cursor context
  const maxOutputTokens = calculateMaxTokens(selectionLength, mode || 'continue', hintOptions)

  return streamText({
    model: gateway.languageModel('anthropic/claude-sonnet-4.5'),
    system,
    prompt: finalPrompt,
    maxOutputTokens,
  }).toTextStreamResponse()
})
