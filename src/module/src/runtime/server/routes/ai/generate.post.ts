import { streamText } from 'ai'
import { eventHandler, readBody, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import {
  buildAIContext,
  calculateMaxTokens,
  getSystem,
} from '../../utils/ai/generate'
import { getAIModel } from '../../utils/ai/provider'
import type { AIGenerateOptions } from 'nuxt-studio/app'
import { requireStudioAuth } from '../../utils/auth'

export default eventHandler(async (event) => {
  await requireStudioAuth(event)

  const config = useRuntimeConfig(event)

  const aiConfig = config.studio?.ai

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
  const experimentalCollectionContext = aiConfig?.experimental?.collectionContext ?? false
  const context = await buildAIContext(event, {
    fsPath,
    collectionName,
    mode,
    projectContext,
    hintOptions,
    experimentalCollectionContext,
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

  // Select model based on mode:
  // - Continue mode: faster/cheaper model
  // - Transform modes: quality model
  const model = await getAIModel(event, { fast: mode === 'continue' })

  // Temperature: continue mode benefits from creativity (0.7), transform modes are more deterministic (0.3)
  const temperature = mode === 'continue' ? 0.7 : 0.3

  return streamText({
    model,
    system,
    prompt: finalPrompt,
    maxOutputTokens,
    temperature,
  }).toTextStreamResponse()
})
