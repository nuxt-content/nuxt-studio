import { streamText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { eventHandler, createError, useSession, getRequestProtocol, readBody } from 'h3'
import { consola } from 'consola'
import { useRuntimeConfig } from '#imports'
import { queryCollection } from '@nuxt/content/server'
import type { Collections, CollectionInfo } from '@nuxt/content'
import type { DatabasePageItem } from 'nuxt-studio/app'
import {
  detectContentType,
  analyzeArchitecture,
  buildProjectInfoContext,
  buildAnalysisPrompt,
  getAnalyzeSystem,
} from '../../utils/ai/analyze'
import type { ContentSample, CollectionMetadata } from '../../types/ai'
import { ContentType } from '../../types/ai'

const logger = consola.withTag('Nuxt Studio')

/**
 * EXPERIMENTAL:
 * AI-powered content analysis endpoint.
 * Analyzes existing content to generate an optimal context file
 * that helps the AI understand the project's writing style and conventions.
 */
export default eventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  // Read collection info from request body
  const body = await readBody(event).catch(() => ({}))
  const collection = body.collection as CollectionInfo
  if (!collection) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Collection info is required',
    })
  }

  // Validate collection structure
  if (!collection.name || !collection.type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid collection: name and type are required',
    })
  }

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

  // Build project context
  const projectContext = aiConfig?.context
  const projectInfo = buildProjectInfoContext(projectContext)

  // Query actual content from collections for analysis
  const contentSamples: ContentSample[] = []

  const MAX_SAMPLES = 30 // Limit samples to stay within token budget
  const MAX_EXCERPT_LENGTH = 600 // Characters per excerpt

  // Build collection source info
  const sourceInfo = collection.source && collection.source.length > 0
    ? collection.source.map(s => s.include || s.prefix).filter(Boolean).join(', ')
    : 'default'

  const collectionMetadata: CollectionMetadata = {
    name: collection.name,
    type: collection.type || 'page',
    source: sourceInfo,
    totalDocuments: 0,
    contentType: ContentType.GeneralContent,
    architecture: {
      fileTree: '',
      usesNestedFolders: false,
      depth: 0,
      structure: '',
    },
  }

  try {
    const documents = await queryCollection(event, collection.name as keyof Collections)
      .limit(MAX_SAMPLES)
      .where('extension', '=', 'md')
      .all() as Array<DatabasePageItem>

    collectionMetadata.totalDocuments = documents.length

    // Analyze content type and architecture
    if (documents.length > 0) {
      collectionMetadata.contentType = detectContentType(documents)
      collectionMetadata.architecture = analyzeArchitecture(documents)
    }

    // Sample from markdown items only
    for (const document of documents) {
      // Skip if we already have enough samples
      if (contentSamples.length >= MAX_SAMPLES) {
        break
      }

      // Use generateContentFromDocument to get the raw markdown content
      // Lazy load to avoid loading Shiki/MDC at server startup
      let excerpt = ''
      try {
        const { generateContentFromDocument } = await import('../../../utils/document/generate')
        const rawContent = await generateContentFromDocument(document as DatabasePageItem)
        if (rawContent) {
          excerpt = rawContent
        }
      }
      catch (err) {
        logger.warn('Failed to generate content from document:', err)
        // Fallback to description if generation fails
        if (document.description) {
          excerpt = document.description
        }
      }

      // Truncate excerpt to reasonable length
      if (excerpt.length > MAX_EXCERPT_LENGTH) {
        excerpt = excerpt.substring(0, MAX_EXCERPT_LENGTH) + '...'
      }

      if (excerpt) {
        contentSamples.push({
          title: document.title || document.path || 'Untitled',
          description: document.description,
          excerpt,
        })
      }
    }
  }
  catch (error) {
    logger.error('[AI] Error querying collection:', error)
  }

  // Validate that we have content samples
  if (contentSamples.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `No markdown content found in collection "${collection.name}". Cannot analyze empty collection.`,
    })
  }

  // Build the analysis prompt with rich metadata
  const prompt = buildAnalysisPrompt(
    contentSamples,
    collectionMetadata,
    projectInfo,
  )

  // Generate system prompt
  const system = getAnalyzeSystem()

  return streamText({
    model: gateway.languageModel('anthropic/claude-sonnet-4.5'),
    system,
    prompt,
    maxOutputTokens: 2000,
  }).toTextStreamResponse()
})
