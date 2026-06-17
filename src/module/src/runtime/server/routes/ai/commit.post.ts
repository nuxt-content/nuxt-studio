import { streamText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { eventHandler, readBody, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getCommitSystem } from '../../utils/ai/generate'
import { requireStudioAuth } from '../../utils/auth'

export default eventHandler(async (event) => {
  await requireStudioAuth(event)

  const config = useRuntimeConfig(event)

  const apiKey = config.studio?.ai?.apiKey
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AI features are not enabled. Please set AI_GATEWAY_API_KEY environment variable.',
    })
  }

  const { changes } = await readBody<{ changes: string }>(event)

  if (!changes) {
    throw createError({
      statusCode: 400,
      statusMessage: 'changes is required',
    })
  }

  const messagePrefix = config.public.studio?.git?.commit?.messagePrefix || undefined

  const gateway = createGateway({ apiKey })

  return streamText({
    model: gateway.languageModel('anthropic/claude-haiku-4.5'),
    system: getCommitSystem(messagePrefix),
    prompt: changes,
    maxOutputTokens: 60,
    temperature: 0.3,
  }).toTextStreamResponse()
})
