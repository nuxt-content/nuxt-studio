import { streamText } from 'ai'
import { eventHandler, readBody, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getCommitSystem } from '../../utils/ai/generate'
import { getAIModel } from '../../utils/ai/provider'
import { requireStudioAuth } from '../../utils/auth'

export default eventHandler(async (event) => {
  await requireStudioAuth(event)

  const config = useRuntimeConfig(event)

  const { changes } = await readBody<{ changes: string }>(event)

  if (!changes) {
    throw createError({
      statusCode: 400,
      statusMessage: 'changes is required',
    })
  }

  const messagePrefix = config.public.studio?.git?.commit?.messagePrefix || undefined

  return streamText({
    model: await getAIModel(event, { fast: true }),
    system: getCommitSystem(messagePrefix),
    prompt: changes,
    maxOutputTokens: 60,
    temperature: 0.3,
  }).toTextStreamResponse()
})
