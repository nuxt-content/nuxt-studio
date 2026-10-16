import type { DatabaseItem, DatabasePageItem, MarkdownParsingOptions } from 'nuxt-studio/app'
import { consola } from 'consola'
import { ContentFileExtension } from '../../types/content'
import { parseMarkdown } from 'comark'
import comarkEmoji from 'comark/plugins/emoji'
import tocPlugin from 'comark/plugins/toc'
import type { MarkdownDocument } from 'comark'
import shiki from 'comark/plugins/shiki'
import { renderMarkdown } from 'comark/render'
import destr from 'destr'
import { CORE_SCHEMA, dump, loadAll, mergeTag, timestampTag } from 'js-yaml'
import { useHostMeta } from '../../composables/useMeta'
import { addPageTypeFields, generateStemFromId, getFileExtension } from './utils'
import { cleanDataKeys } from './schema'
import { comarkTreeFromLegacyDocument, padBlankLinesInComponents, unbindComarkTree } from './legacy'

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
  // `loadAll` because `load` throws on empty files since js-yaml v5.
  const data = loadAll(content, { schema: CORE_SCHEMA.withTags(timestampTag, mergeTag) })[0] || {}
  return documentFromData(id, 'YAML', data)
}

export async function documentFromJSONContent(id: string, content: string): Promise<DatabaseItem> {
  return documentFromData(id, 'JSON', destr(content))
}

function documentFromData(id: string, format: 'YAML' | 'JSON', data: unknown): DatabaseItem {
  let parsed = data as Record<string, unknown>
  if (Array.isArray(data)) {
    logger.warn(`${format} array is not supported in ${id}, moving the array into the \`body\` key`)
    parsed = { body: data }
  }

  // fsPath will be overridden by host
  return {
    id,
    extension: getFileExtension(id),
    stem: generateStemFromId(id),
    meta: {},
    ...parsed,
  } as DatabaseItem
}

export function isComarkTree(body: unknown): body is MarkdownDocument {
  return typeof body === 'object' && body !== null && Array.isArray((body as MarkdownDocument).nodes)
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

  const tree = await parseMarkdown(content, {
    autoClose: false,
    autoUnwrap: true,
    linkify: false,
    plugins: [
      comarkEmoji(),
      shiki({ themes }),
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
  return dump(cleanDataKeys(document), { lineWidth: -1 })
}

export async function contentFromJSONDocument(document: DatabaseItem): Promise<string | null> {
  return JSON.stringify(cleanDataKeys(document), null, 2)
}

export async function contentFromMarkdownDocument(document: DatabaseItem): Promise<string | null> {
  const tree = comarkTreeFromLegacyDocument(document)
  if (!tree) return '\n'
  const body = unbindComarkTree(tree)
  const markdown = await renderMarkdown(body, {
    blockAttributesStyle: 'frontmatter',
  })
  return padBlankLinesInComponents(markdown) + '\n'
}
