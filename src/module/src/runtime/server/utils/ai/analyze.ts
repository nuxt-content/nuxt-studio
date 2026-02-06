/**
 * AI analysis utilities for content collection analysis and style guide generation
 */

import type { DatabasePageItem } from 'nuxt-studio/app'
import type { ModuleOptions } from '../../../../module'
import { ContentType } from '../../types/ai'
import type { ContentSample, CollectionMetadata, CollectionArchitecture } from '../../types/ai'

/**
 * Detect content type based on patterns in titles, paths, and structure
 */
export function detectContentType(items: DatabasePageItem[]): ContentType {
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
  if (maxScore === 0) return ContentType.GeneralContent
  if (blogScore === maxScore) return ContentType.Blog
  if (docsScore === maxScore) return ContentType.Documentation
  return ContentType.MarketingPages
}

/**
 * Build a file tree structure for visualization
 */
export function buildFileTree(items: DatabasePageItem[]): string {
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
export function analyzeArchitecture(items: DatabasePageItem[]): CollectionArchitecture {
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
 * Build project information context for analysis
 */
export function buildProjectInfoContext(projectContext?: NonNullable<ModuleOptions['ai']>['context']): string {
  if (!projectContext) return ''

  let projectInfo = ''
  if (projectContext.title) {
    projectInfo += `Project: ${projectContext.title}\n`
  }
  if (projectContext.description) {
    projectInfo += `Description: ${projectContext.description}\n`
  }
  if (projectContext.style) {
    projectInfo += `Preferred Style: ${projectContext.style}\n`
  }
  if (projectContext.tone) {
    projectInfo += `Preferred Tone: ${projectContext.tone}\n`
  }
  return projectInfo
}

/**
 * Build analysis prompt based on content samples and collection metadata
 * Note: Assumes contentSamples always has content. Caller should validate before calling.
 */
export function buildAnalysisPrompt(
  contentSamples: ContentSample[],
  collectionMetadata: CollectionMetadata,
  projectInfo: string,
): string {
  const promptParts: string[] = []

  // 1. Project context (if available)
  if (projectInfo) {
    promptParts.push(`Project Context:\n${projectInfo}`)
  }

  // 2. Collection metadata
  const collectionInfo = `Collection Metadata:
Collection: ${collectionMetadata.name}
Type: ${collectionMetadata.type}
Source: ${collectionMetadata.source}
Total Documents: ${collectionMetadata.totalDocuments}
Content Type: ${collectionMetadata.contentType}
Architecture: ${collectionMetadata.architecture.structure}
Nested Folders: ${collectionMetadata.architecture.usesNestedFolders ? 'Yes' : 'No'}
Folder Depth: ${collectionMetadata.architecture.depth} level${collectionMetadata.architecture.depth === 1 ? '' : 's'}

File Structure:
\`\`\`
${collectionMetadata.architecture.fileTree}
\`\`\``.trim()

  promptParts.push(collectionInfo)

  // 3. Content samples
  const samplesText = contentSamples
    .map((sample, idx) => {
      const header = `### Sample ${idx + 1}: ${sample.title}`
      const desc = sample.description ? `${sample.description}\n\n` : ''
      return `${header}\n${desc}${sample.excerpt}`
    })
    .join('\n\n---\n\n')

  promptParts.push(`Content Samples (${contentSamples.length} of ${collectionMetadata.totalDocuments} markdown files):\n\n${samplesText}`)

  // 4. Instructions
  const instructions = `Analyze this ${collectionMetadata.contentType} collection to create an efficient AI writing guide.

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

  promptParts.push(instructions)

  return promptParts.join('\n\n')
}

/**
 * Generate system prompt for "analyze" mode
 */
export function getAnalyzeSystem(): string {
  return `You are a writing consultant specializing in AI writing style guides.

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
}
