import { streamText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { eventHandler, createError, useSession, getRequestProtocol, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { queryCollection } from '@nuxt/content/server'
import type { Collections, CollectionInfo } from '@nuxt/content'
import { generateContentFromDocument } from '../../../utils/document/generate'

/**
 * Detect content type based on patterns in titles, paths, and structure
 */
function detectContentType(items: any[]): string {
  let blogScore = 0
  let docsScore = 0
  let marketingScore = 0

  // Keywords that indicate different content types
  const blogKeywords = ['post', 'article', 'blog', 'news', 'update', 'release']
  const docsKeywords = ['guide', 'tutorial', 'reference', 'api', 'getting-started', 'installation', 'configuration']
  const marketingKeywords = ['feature', 'pricing', 'about', 'contact', 'landing', 'home', 'product']

  for (const item of items) {
    const title = (item.title || '').toLowerCase()
    const path = (item.path || '').toLowerCase()
    const description = (item.description || '').toLowerCase()
    const combined = `${title} ${path} ${description}`

    // Check for date patterns in path (typical for blogs)
    if (/\/\d{4}\/\d{2}\/\d{2}\/|\/\d{4}-\d{2}-\d{2}-/.test(path)) {
      blogScore += 3
    }

    // Check keywords
    blogKeywords.forEach((keyword) => {
      if (combined.includes(keyword)) blogScore++
    })
    docsKeywords.forEach((keyword) => {
      if (combined.includes(keyword)) docsScore++
    })
    marketingKeywords.forEach((keyword) => {
      if (combined.includes(keyword)) marketingScore++
    })

    // Date fields suggest blog posts
    if (item.date || item.publishedAt || item.createdAt) {
      blogScore += 2
    }

    // Author fields suggest blog posts
    if (item.author || item.authors) {
      blogScore++
    }

    // Tags/categories suggest blog
    if (item.tags || item.category) {
      blogScore++
    }
  }

  // Determine type based on scores
  const maxScore = Math.max(blogScore, docsScore, marketingScore)
  if (maxScore === 0) return 'general content'
  if (blogScore === maxScore) return 'blog'
  if (docsScore === maxScore) return 'documentation'
  return 'marketing pages'
}

/**
 * Analyze folder structure and architecture
 */
function analyzeArchitecture(items: any[]): { usesNestedFolders: boolean, depth: number, structure: string } {
  const paths = items.map(item => item.path || '').filter(Boolean)

  let maxDepth = 0
  const folders = new Set<string>()

  for (const path of paths) {
    const parts = path.split('/').filter(Boolean)
    maxDepth = Math.max(maxDepth, parts.length)

    // Collect folder paths
    for (let i = 1; i < parts.length; i++) {
      folders.add(parts.slice(0, i).join('/'))
    }
  }

  const usesNestedFolders = maxDepth > 2
  const folderCount = folders.size

  let structure = ''
  if (maxDepth === 1) {
    structure = 'Flat structure (all files in root)'
  }
  else if (maxDepth === 2) {
    structure = `Single-level folders (${folderCount} folders)`
  }
  else {
    structure = `Nested hierarchy (${folderCount} folders, max depth: ${maxDepth} levels)`
  }

  return { usesNestedFolders, depth: maxDepth, structure }
}

/**
 * AI-powered content analysis endpoint.
 * Analyzes existing content to generate an optimal CONTEXT.md file
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
      statusMessage: 'AI features are not enabled. Please set STUDIO_VERCEL_API_GATEWAY_KEY environment variable.',
    })
  }

  const gateway = createGateway({ apiKey })

  // Build project context
  const projectContext = aiConfig?.context
  let projectInfo = ''
  if (projectContext?.title) {
    projectInfo += `Project: ${projectContext.title}\n`
  }
  if (projectContext?.description) {
    projectInfo += `Description: ${projectContext.description}\n`
  }
  if (projectContext?.style) {
    projectInfo += `Preferred Style: ${projectContext.style}\n`
  }
  if (projectContext?.tone) {
    projectInfo += `Preferred Tone: ${projectContext.tone}\n`
  }

  // Query actual content from collections for analysis
  const contentSamples: Array<{
    title: string
    description?: string
    excerpt: string
  }> = []

  const MAX_SAMPLES = 15 // Limit samples to stay within token budget
  const MAX_EXCERPT_LENGTH = 600 // Characters per excerpt

  const collectionMetadata = {
    totalDocuments: 0,
    contentType: 'general content',
    architecture: {
      usesNestedFolders: false,
      depth: 0,
      structure: '',
    },
  }

  try {
    const documents = await queryCollection(event, collection.name as keyof Collections)
      .limit(MAX_SAMPLES)
      .where('extension', '=', 'md')
      .all()

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
      let excerpt = ''
      try {
        const rawContent = await generateContentFromDocument(document)
        if (rawContent) {
          excerpt = rawContent
        }
      }
      catch (err) {
        console.warn('Failed to generate content from document:', err)
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
          title: document.title || document.path,
          description: document.description,
          excerpt,
        })
      }
    }
  }
  catch (error) {
    console.error('Error querying content for analysis:', error)
    // Continue with empty samples - will generate template-based guide
  }

  // Build the analysis prompt with rich metadata
  let prompt: string

  if (contentSamples.length > 0) {
    // Build collection metadata summary with CollectionInfo
    const sourceInfo = collection.source && collection.source.length > 0
      ? collection.source.map(s => s.include || s.prefix).filter(Boolean).join(', ')
      : 'default'

    const metadataText = `
Collection: ${collection.name}
Type: ${collection.type || 'page'}
Source: ${sourceInfo}
Total Documents: ${collectionMetadata.totalDocuments}
Content Type: ${collectionMetadata.contentType}
Architecture: ${collectionMetadata.architecture.structure}
Nested Folders: ${collectionMetadata.architecture.usesNestedFolders ? 'Yes' : 'No'}
Folder Depth: ${collectionMetadata.architecture.depth} level${collectionMetadata.architecture.depth === 1 ? '' : 's'}
`.trim()

    // We have actual content samples - analyze them
    const samplesText = contentSamples
      .map((sample, idx) => {
        const header = `### Sample ${idx + 1}: ${sample.title}`
        const desc = sample.description ? `${sample.description}\n\n` : ''
        return `${header}\n${desc}${sample.excerpt}`
      })
      .join('\n\n---\n\n')

    prompt = `You are analyzing a ${collectionMetadata.contentType} collection to create a comprehensive writing style guide.

${projectInfo ? `Project Information:\n${projectInfo}\n` : ''}
Collection Metadata:
${metadataText}

Below are ${contentSamples.length} content samples (out of ${collectionMetadata.totalDocuments} total markdown files):

${samplesText}

Based on these actual content samples and collection metadata, generate a CONTEXT.md file that captures:

1. **Collection Overview**: What type of content is this? (${collectionMetadata.contentType})
   - Purpose and scope
   - Organization structure (${collectionMetadata.architecture.structure})

2. **Writing Style**: The actual tone, voice, and approach observed in the samples
   - How technical vs. conversational is the writing?
   - Are examples used frequently? How are they presented?
   - What makes this content unique?

3. **Formatting Conventions**: Patterns you observe:
   - How are code snippets, technical terms, and commands formatted?
   - Use of bold, italic, lists, callouts
   - Heading structure and organization
   - Frontmatter patterns (if any)

4. **Content Structure**: Common patterns:
   - How are topics introduced and explained?
   - Length and depth of explanations
   - Use of examples, diagrams, or references
   - Navigation patterns (based on folder structure)

5. **Target Audience**: Based on complexity and terminology, who is this for?

6. **Key Principles**: 3-5 concrete guidelines for maintaining consistency

Focus on OBSERVED PATTERNS from the ${collectionMetadata.totalDocuments} markdown samples, not generic advice.
Be specific about what makes this ${collectionMetadata.contentType} effective.`
  }
  else {
    // No content samples available - generate template
    prompt = `You are creating a writing style guide for a documentation/content project.

${projectInfo ? `Project Information:\n${projectInfo}\n` : ''}Generate a comprehensive CONTEXT.md file that serves as a writing guide for AI-assisted content generation.

The file should include:

1. **Project Overview**: Brief description of the project and its purpose
2. **Writing Style**: The tone, voice, and approach to use (e.g., technical but approachable, formal documentation, conversational blog style)
3. **Formatting Conventions**: Guidelines for:
   - How to format inline code, code blocks, and technical terms
   - When to use bold, italic, or other emphasis
   - How to structure lists, tables, and callouts
4. **Content Structure**: Patterns for organizing content:
   - Heading hierarchy and conventions
   - Introduction and conclusion patterns
   - How to structure tutorials vs reference docs
5. **Target Audience**: Who reads this content and their technical level
6. **Key Principles**: Core guidelines to maintain consistency and quality`
  }

  const system = `You are a technical writing consultant specializing in documentation style guides.

Create a practical, actionable CONTEXT.md file that will guide AI-assisted content generation.
Focus on specific, concrete guidelines rather than generic advice.

Output ONLY the markdown content for the CONTEXT.md file. Do not include any preamble or explanation.
Start directly with a markdown heading like "# Writing Guide" or "# Content Style Guide".

Format your response as a well-structured markdown document.
Keep it concise but actionable (~1000-1500 words).`

  return streamText({
    model: gateway.languageModel('anthropic/claude-sonnet-4.5'),
    system,
    prompt,
    maxOutputTokens: 2500,
  }).toTextStreamResponse()
})
