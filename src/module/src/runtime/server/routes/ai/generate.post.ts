import { streamText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { eventHandler, readBody, createError, useSession, getRequestProtocol } from 'h3'
import { useRuntimeConfig } from '#imports'
import {
  buildAIContext,
  calculateMaxTokens,
  getFixPrompt,
  getImprovePrompt,
  getSimplifyPrompt,
  getTranslatePrompt,
  getContinuePrompt,
} from '../../utils/ai'
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
      statusMessage: 'AI features are not enabled. Please set STUDIO_VERCEL_API_GATEWAY_KEY environment variable.',
    })
  }

  const gateway = createGateway({ apiKey })

  const { prompt, mode, language, selectionLength, fsPath, collectionName } = await readBody<AIGenerateOptions>(event)

  if (!prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prompt is required',
    })
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
  })

  // Generate system prompt based on mode
  let system: string
  switch (mode) {
    case 'fix':
      system = getFixPrompt(context)
      break
    case 'improve':
      system = getImprovePrompt(context)
      break
    case 'simplify':
      system = getSimplifyPrompt(context)
      break
    case 'translate':
      system = getTranslatePrompt(context, language)
      break
    case 'continue':
    default:
      system = getContinuePrompt(context)
      break
  }

  // Calculate maxOutputTokens based on selection length and mode
  const maxOutputTokens = calculateMaxTokens(selectionLength, mode || 'continue')

  return streamText({
    model: gateway.languageModel('anthropic/claude-sonnet-4.5'),
    system,
    prompt,
    maxOutputTokens,
  }).toTextStreamResponse()
})
