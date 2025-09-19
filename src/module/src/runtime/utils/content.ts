// import type { ParsedContentFile } from '@nuxt/content'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { generateStemFromFsPath } from './collections'
import type { MarkdownRoot, ParsedContentFile } from '@nuxt/content'
import { omit } from './object'

export function removeReservedKeysFromDocument(document: ParsedContentFile) {
  const result = omit(document, ['id', 'stem', 'extension', '__hash__', 'path', 'body', 'meta'])
  // Default value of navigation is true, so we can safely remove it
  if (result.navigation === true) {
    Reflect.deleteProperty(result, 'navigation')
  }

  if (document.seo) {
    const seo = document.seo as Record<string, unknown>
    if (seo.title === document.title) {
      Reflect.deleteProperty(result, 'seo')
    }
    if (seo.description === document.description) {
      Reflect.deleteProperty(result, 'seo')
    }
  }

  // expand meta to the root
  for (const key in (document.meta || {})) {
    if (key !== '__hash__') {
      result[key] = (document.meta as Record<string, unknown>)[key]
    }
  }
  return result
}

export async function generateDocumentFromContent(id: string, fsPath: string, routePath: string, content: string): Promise<ParsedContentFile> {
  const stem = generateStemFromFsPath(fsPath)

  const parsed = await parseMarkdown(content)

  return {
    id,
    stem,
    path: routePath,
    meta: {},
    extension: 'md',
    seo: {
      title: parsed.data.title,
      description: parsed.data.description,
    },
    ...parsed.data,
    excerpt: parsed.excerpt,
    body: {
      ...(parsed.body as MarkdownRoot),
      toc: parsed.toc,
    },
  }
}
