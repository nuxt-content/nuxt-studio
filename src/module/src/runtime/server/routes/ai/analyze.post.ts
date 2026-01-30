import { streamText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { eventHandler, createError, useSession, getRequestProtocol, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { queryCollection } from '@nuxt/content/server'
import type { Collections, CollectionInfo } from '@nuxt/content'
import { generateContentFromDocument } from '../../../utils/document/generate'
import type { DatabasePageItem } from 'nuxt-studio/app'

/**
 * Detect content type based on patterns in titles, paths, and structure
 */
function detectContentType(items: DatabasePageItem[]): string {
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
 * Build a file tree structure for visualization
 */
function buildFileTree(items: DatabasePageItem[]): string {
  const paths = items.map(item => item.path || item.fsPath || '').filter(Boolean)
  if (paths.length === 0) return 'No files found'

  // Build tree structure
  interface TreeNode {
    name: string
    children: Map<string, TreeNode>
    isFile: boolean
  }

  const root: TreeNode = { name: '', children: new Map(), isFile: false }

  // Build tree
  for (const path of paths) {
    const parts = path.split('/').filter(Boolean)
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] || ''
      const isFile = i === parts.length - 1

      if (part && !current.children.has(part)) {
        current.children.set(part, { name: part, children: new Map(), isFile })
      }

      const next = current.children.get(part)
      if (!next) continue
      current = next
    }
  }

  // Convert tree to string representation
  function renderTree(node: TreeNode, prefix = ''): string[] {
    const lines: string[] = []

    const entries = Array.from(node.children.entries())
      .sort(([, a], [, b]) => {
        // Directories first, then files
        if (a.isFile !== b.isFile) return a.isFile ? 1 : -1
        return a.name.localeCompare(b.name)
      })

    entries.forEach(([name, child], index) => {
      const isLastChild = index === entries.length - 1
      const connector = isLastChild ? '└── ' : '├── '
      const icon = child.isFile ? '📄 ' : '📁 '

      lines.push(`${prefix}${connector}${icon}${name}`)

      if (!child.isFile && child.children.size > 0) {
        const childPrefix = prefix + (isLastChild ? '    ' : '│   ')
        lines.push(...renderTree(child, childPrefix))
      }
    })

    return lines
  }

  return renderTree(root, '').join('\n')
}

/**
 * Analyze folder structure and architecture
 */
function analyzeArchitecture(items: DatabasePageItem[]): { usesNestedFolders: boolean, depth: number, structure: string, fileTree: string } {
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

  const fileTree = buildFileTree(items)

  return { usesNestedFolders, depth: maxDepth, structure, fileTree }
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

  const MAX_SAMPLES = 30 // Limit samples to stay within token budget
  const MAX_EXCERPT_LENGTH = 600 // Characters per excerpt

  const collectionMetadata = {
    totalDocuments: 0,
    contentType: 'general content',
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
      let excerpt = ''
      try {
        const rawContent = await generateContentFromDocument(document as DatabasePageItem)
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
          title: document.title || document.path || 'Untitled',
          description: document.description,
          excerpt,
        })
      }
    }
  }
  catch { /* Continue with empty samples, will generate a template-based guide */ }

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

File Structure:
\`\`\`
${collectionMetadata.architecture.fileTree}
\`\`\`
`.trim()

    // We have actual content samples - analyze them
    const samplesText = contentSamples
      .map((sample, idx) => {
        const header = `### Sample ${idx + 1}: ${sample.title}`
        const desc = sample.description ? `${sample.description}\n\n` : ''
        return `${header}\n${desc}${sample.excerpt}`
      })
      .join('\n\n---\n\n')

    prompt = `Analyze this ${collectionMetadata.contentType} collection to create an efficient AI writing guide.

${projectInfo ? `Project Context:\n${projectInfo}\n` : ''}
Collection Metadata:
${metadataText}

Content Samples (${contentSamples.length} of ${collectionMetadata.totalDocuments} markdown files):

${samplesText}

Generate a concise CONTEXT.md guide with this EXACT structure:

## 1. Quick Rules (REQUIRED FIRST SECTION)
Extract 3-7 critical non-negotiable patterns observed in samples:
- Most impactful formatting rules
- Core voice/tone characteristics
- Essential structural requirements

## 2. Collection Architecture
Include the file tree structure above to show how content is organized.
Explain the folder organization pattern and how it relates to content hierarchy.

## 3. Writing Style (concise)
- Tone characteristics (2-3 bullet points)
- Technical depth level
- How examples are used

## 4. Formatting Conventions (use lists, not prose)

## 5. Content Structure
- Document opening pattern
- Typical section flow
- Link strategy
- How file location affects content style

## 6. Target Audience (1-2 sentences max)

## 7. Key Principles (3-5 actionable rules)

FOCUS ON:
- Patterns ACTUALLY OBSERVED in these ${collectionMetadata.totalDocuments} samples
- What makes this ${collectionMetadata.contentType} unique
- Actionable, specific guidance (not generic advice)

ELIMINATE:
- Redundant explanations
- Generic advice that applies to all content
- Multiple examples of the same pattern
- Long prose when a list/table works better
- Code examples with backticks (describe patterns in plain text)`
  }
  else {
    // No content samples available - generate template
    prompt = `Create a concise writing style guide for a Nuxt Content project.

${projectInfo ? `Project Context:\n${projectInfo}\n` : ''}
Generate a CONTEXT.md template optimized for AI consumption.

Use this EXACT structure:

## 1. Quick Rules (REQUIRED FIRST)
List 5-7 essential patterns:
- Core formatting rules
- Voice/tone essentials
- Key structural requirements

## 2. Writing Style
- Tone (e.g., technical but approachable)
- Voice characteristics
- Example usage

## 3. Formatting Conventions (table format)
| Element | Format |
|---------|---------|
| Inline code | \`code\` |
| Bold | **term** |

## 4. Content Structure
- Heading hierarchy
- Opening/closing patterns
- Tutorial vs reference structure

## 5. Target Audience (1 sentence)

## 6. Key Principles (3-5 rules)

Keep concise. Prefer lists/tables over prose. Be actionable and specific.`
  }

  const system = `You are a writing consultant specializing in AI writing style guides.

Create a practical, actionable context file optimized for AI consumption that will guide content generation for a Nuxt Content project.

CRITICAL STRUCTURE REQUIREMENTS:
1. START with a "# Quick Rules" section (3-7 bullet points) - the most essential non-negotiable patterns
2. Follow with detailed sections
3. Be concise and avoid redundancy - prefer tables/lists over prose
4. Focus on OBSERVED patterns from actual samples, not generic advice

Output ONLY the markdown content. Start directly with "# Quick Rules".
Target length: 800-1200 words (20-30% shorter than typical guides).

AVOID:
- Redundant examples of the same pattern
- Obvious advice that applies to all content
- Long prose explanations when a list would work
- Repeating the same formatting rules in multiple sections
- Code examples with backticks (describe patterns in plain text)`

  return streamText({
    model: gateway.languageModel('anthropic/claude-sonnet-4.5'),
    system,
    prompt,
    maxOutputTokens: 2000,
  }).toTextStreamResponse()
})
