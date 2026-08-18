import { createGateway } from '@ai-sdk/gateway'
import { createError } from 'h3'
import type { H3Event } from 'h3'
import type { LanguageModel } from 'ai'
import { useRuntimeConfig } from '#imports'

export type AIProviderName = 'auto' | 'gateway' | 'gemini' | 'groq'

export type AIProviderConfig = {
  provider: AIProviderName
  apiKey: string
  geminiApiKey: string
  geminiModel: string
  geminiFastModel: string
  groqApiKey: string
  groqModel: string
  groqFastModel: string
}

function getConfig(event: H3Event): AIProviderConfig {
  const config = useRuntimeConfig(event).studio?.ai as unknown as AIProviderConfig | undefined
  if (!config) {
    throw createError({ statusCode: 503, statusMessage: 'AI features are not configured.' })
  }
  return config
}

/**
 * Resolves the effective provider name from the configured preference and
 * the available API keys.
 *
 * - `groq` requires a Groq API key (free tier via GroqCloud, works in all regions).
 * - `gemini` requires a Gemini API key.
 * - `gateway` requires the Vercel AI Gateway API key.
 * - `auto` uses Groq when a Groq key is present, then Gemini, then the gateway.
 */
function resolveProvider(config: AIProviderConfig): 'groq' | 'gemini' | 'gateway' {
  if (config.provider === 'groq') {
    if (!config.groqApiKey) {
      throw createError({ statusCode: 503, statusMessage: 'AI features are not enabled. Please set GROQ_API_KEY.' })
    }
    return 'groq'
  }
  if (config.provider === 'gemini') {
    if (!config.geminiApiKey) {
      throw createError({ statusCode: 503, statusMessage: 'AI features are not enabled. Please set GEMINI_API_KEY or NUXT_STUDIO_AI_GEMINI_API_KEY.' })
    }
    return 'gemini'
  }
  if (config.provider === 'gateway') {
    if (!config.apiKey) {
      throw createError({ statusCode: 503, statusMessage: 'AI features are not enabled. Please set NUXT_STUDIO_AI_API_KEY.' })
    }
    return 'gateway'
  }
  if (config.groqApiKey) {
    return 'groq'
  }
  if (config.geminiApiKey) {
    return 'gemini'
  }
  if (config.apiKey) {
    return 'gateway'
  }
  throw createError({ statusCode: 503, statusMessage: 'AI features are not enabled. Please set GROQ_API_KEY, NUXT_STUDIO_AI_API_KEY, or GEMINI_API_KEY.' })
}

/**
 * Returns a Vercel AI SDK language model for the configured provider.
 *
 * @param event - Current H3 event (used to read server runtime config).
 * @param [opts] - Model options.
 * @param [opts.fast] - When `true`, selects a cheaper/faster model for quick
 *   completions (e.g. continue mode); otherwise the quality model is used.
 */
export async function getAIModel(event: H3Event, opts: { fast?: boolean } = {}): Promise<LanguageModel> {
  const config = getConfig(event)
  const provider = resolveProvider(config)

  if (provider === 'groq') {
    // @ai-sdk/groq is loaded lazily so that projects not using Groq do not bundle it.
    const { createGroq } = await import('@ai-sdk/groq')
    const groqProvider = createGroq({ apiKey: config.groqApiKey })
    const modelId = opts.fast ? config.groqFastModel : config.groqModel
    return groqProvider(modelId)
  }

  if (provider === 'gemini') {
    // @ai-sdk/google is loaded lazily so that projects not using Gemini do not bundle it.
    const { createGoogleGenerativeAI } = await import('@ai-sdk/google')
    const googleProvider = createGoogleGenerativeAI({ apiKey: config.geminiApiKey })
    const modelId = opts.fast ? config.geminiFastModel : config.geminiModel
    return googleProvider(modelId)
  }

  const gateway = createGateway({ apiKey: config.apiKey })
  const modelId = opts.fast
    ? 'anthropic/claude-haiku-4.5'
    : 'anthropic/claude-sonnet-4.5'
  return gateway.languageModel(modelId)
}
