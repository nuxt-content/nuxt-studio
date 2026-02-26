import type { DatabaseItem, DatabasePageItem, MarkdownParsingOptions } from 'nuxt-studio/app'
import { consola } from 'consola'
import { ContentFileExtension } from '../../types/content'
import { parse } from 'comark'
import comarkEmoji from 'comark/plugins/emoji'
import tocPlugin from 'comark/plugins/toc'
import type { ComarkTree } from 'comark/ast'
import highlight from 'comark/plugins/highlight'
import { renderMarkdown } from 'comark/string'
import destr from 'destr'
import yaml from 'js-yaml'
import { useHostMeta } from '../../composables/useMeta'
import { addPageTypeFields, generateStemFromId, getFileExtension } from './utils'

const logger = consola.withTag('Nuxt Studio')

export async function documentFromContent(id: string, content: string, options: MarkdownParsingOptions = { compress: true }): Promise<DatabaseItem | null> {
  const [_id, _hash] = id.split('#')
  const extension = getFileExtension(id)

  if (extension === ContentFileExtension.Markdown) {
    return await documentFromMarkdownContent(id, content, options)
  }

  if (extension === ContentFileExtension.YAML || extension === ContentFileExtension.YML) {
    return await documentFromYAMLContent(id, content)
  }

  if (extension === ContentFileExtension.JSON) {
    return await documentFromJSONContent(id, content)
  }

  return null
}

export async function documentFromYAMLContent(id: string, content: string): Promise<DatabaseItem> {
  const data = (yaml.load(content) || {}) as Record<string, unknown>

  // Keep array contents under `body` key
  let parsed = data
  if (Array.isArray(data)) {
    logger.warn(`YAML array is not supported in ${id}, moving the array into the \`body\` key`)
    parsed = { body: data }
  }

  const document = {
    id,
    extension: getFileExtension(id),
    stem: generateStemFromId(id),
    meta: {},
    ...parsed,
  } as DatabaseItem

  if (parsed.body) {
    document.body = parsed.body
  }

  return document
}

export async function documentFromJSONContent(id: string, content: string): Promise<DatabaseItem> {
  let parsed: Record<string, unknown> = destr(content)

  // Keep array contents under `body` key
  if (Array.isArray(parsed)) {
    logger.warn(`JSON array is not supported in ${id}, moving the array into the \`body\` key`)
    parsed = {
      body: parsed,
    }
  }

  // fsPath will be overridden by host
  return {
    id,
    extension: ContentFileExtension.JSON,
    stem: generateStemFromId(id),
    meta: {},
    ...parsed,
    body: parsed.body || parsed,
  } as DatabaseItem
}

export function isComarkTree(body: unknown): body is ComarkTree {
  return typeof body === 'object' && body !== null && Array.isArray((body as ComarkTree).nodes)
}

export async function documentFromMarkdownContent(id: string, content: string, options: MarkdownParsingOptions = { compress: true }): Promise<DatabaseItem> {
  const highlightTheme = useHostMeta().highlightTheme.value
  const themes: Record<string, string> = highlightTheme
    ? {
        default: highlightTheme.default || 'github-light',
        dark: highlightTheme.dark || 'github-dark',
        light: highlightTheme.light || 'github-light',
      }
    : { default: 'github-light', dark: 'github-dark' }

  const tree = await parse(content, {
    autoUnwrap: true,
    plugins: [
      comarkEmoji(),
      highlight({ themes }),
      tocPlugin({ depth: 2, searchDepth: 2, title: '', links: [] }),
    ],
  })

  const result: DatabaseItem = {
    id,
    meta: {},
    extension: 'md',
    stem: id.split('/').slice(1).join('/').split('.').slice(0, -1).join('.'),
    body: tree,
    ...tree.frontmatter,
  }

  // Do not need to calculate path meta information for data collections
  if (options.collectionType === 'page') {
    return addPageTypeFields(result)
  }

  return result
}

export async function contentFromDocument(document: DatabaseItem): Promise<string | null> {
  const [id, _hash] = document.id.split('#')
  const extension = getFileExtension(id!)

  if (extension === ContentFileExtension.Markdown) {
    return await contentFromMarkdownDocument(document as DatabasePageItem)
  }

  if (extension === ContentFileExtension.YAML || extension === ContentFileExtension.YML) {
    return await contentFromYAMLDocument(document)
  }

  if (extension === ContentFileExtension.JSON) {
    return await contentFromJSONDocument(document)
  }

  return null
}

export async function contentFromYAMLDocument(document: DatabaseItem): Promise<string | null> {
  return yaml.dump(cleanDataKeys(document), { lineWidth: -1 })
}

export async function contentFromJSONDocument(document: DatabaseItem): Promise<string | null> {
  return JSON.stringify(cleanDataKeys(document), null, 2)
}

export async function contentFromMarkdownDocument(document: DatabaseItem): Promise<string | null> {
  const markdown = renderMarkdown(document.body as unknown as ComarkTree)
  return markdown.replace(/&#x2A;/g, '*')
}

