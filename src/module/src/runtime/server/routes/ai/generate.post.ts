import { streamText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { eventHandler, readBody, createError, useSession, getRequestProtocol } from 'h3'
import { useRuntimeConfig } from '#imports'

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

  const apiKey = config.studio?.ai?.apiKey

  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AI features are not enabled. Please set STUDIO_VERCEL_API_GATEWAY_KEY environment variable.',
    })
  }

  const gateway = createGateway({ apiKey })

  const { prompt, mode, language } = await readBody<{
    prompt: string
    mode?: string
    language?: string
  }>(event)

  if (!prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prompt is required',
    })
  }

  let system: string
  let maxOutputTokens: number

  const preserveMarkdown = 'IMPORTANT: Preserve all markdown formatting (bold, italic, links, etc.) exactly as in the original.'

  switch (mode) {
    case 'fix':
      system = `You are a writing assistant for content editing. Fix spelling and grammar errors in the given text.

Rules:
- Fix typos, grammar, and punctuation
- Wrap inline code (variables, functions, file paths, commands, package names) with single backticks
- Wrap multi-line code blocks with triple backticks and appropriate language identifier
- DO NOT "correct" technical terms, library names, or intentional abbreviations (e.g., "repo", "config", "env")
- ${preserveMarkdown}

Only output the corrected text, nothing else.`
      maxOutputTokens = 500
      break
    case 'simplify':
      system = `You are a writing assistant for content editing. Simplify the given text to make it easier to understand.

Rules:
- Use simpler words and shorter sentences
- Keep technical terms that are necessary (don't replace "API" with "interface", etc.)
- Preserve code snippets exactly as-is
- ${preserveMarkdown}

Only output the simplified text, nothing else.`
      maxOutputTokens = 400
      break
    case 'summarize':
      system = `You are a writing assistant for content editing. Summarize the given text concisely.

Prioritize:
- The main points or key information
- Important technical details
- Actionable items or conclusions

Keep it brief (2-4 sentences max). Only output the summary, nothing else.`
      maxOutputTokens = 200
      break
    case 'translate':
      system = `You are a writing assistant. Translate the given text to ${language || 'English'}.

Rules:
- Translate prose and explanations
- DO NOT translate: code, variable names, function names, file paths, CLI commands, package names, error messages
- Keep technical terms in their commonly-used form
- ${preserveMarkdown}

Only output the translated text, nothing else.`
      maxOutputTokens = 500
      break
    case 'extend':
      system = `You are a writing assistant for content editing. Expand and elaborate on the given text.

Rules:
- Add more detail and context
- Keep the same tone and style
- ${preserveMarkdown}

Only output the extended text, nothing else.`
      maxOutputTokens = 500
      break
    case 'reduce':
      system = `You are a writing assistant for content editing. Make the given text more concise.

Rules:
- Remove unnecessary words and phrases
- Keep the core message intact
- ${preserveMarkdown}

Only output the reduced text, nothing else.`
      maxOutputTokens = 300
      break
    case 'continue':
    default:
      system = `You are a writing assistant helping with content editing.

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
    maxTokens: maxOutputTokens,
  }).toTextStreamResponse()
})
