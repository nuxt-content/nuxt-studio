import type { ComarkNode, ComarkTree } from 'comark'
import type { DatabaseItem } from 'nuxt-studio/app'
import { ContentFileExtension } from '../../types/content'
import { doObjectsMatch } from '../object'
import { renderMarkdown } from 'comark/render'
import { documentFromContent } from './generate'

/**
 * Sort and normalize every element's attributes alphabetically.
 */
function normalizeAttrsDeep(tree: ComarkTree): ComarkTree {
  return { ...tree, nodes: tree.nodes.map(normalizeNode) }
}

function normalizeNode(node: ComarkNode): ComarkNode {
  if (typeof node === 'string') return node
  if (!Array.isArray(node)) return node

  const [tag, attrs, ...children] = node
  if (tag === null) return node // comment

  const sortedAttrs = attrs && typeof attrs === 'object'
    ? Object.fromEntries(Object.entries(attrs as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
    : attrs

  return [tag, sortedAttrs, ...children.map(normalizeNode)] as ComarkNode
}

export async function isDocumentMatchingContent(content: string, document: DatabaseItem): Promise<boolean> {
  const generatedDocument = await documentFromContent(document.id, content, { compress: true, preserveLinkAttributes: true }) as DatabaseItem

  if (generatedDocument.extension === ContentFileExtension.Markdown) {
    const { body: generatedBody, ...generatedDocumentData } = generatedDocument
    const { body: documentBody, ...documentData } = document

    // Compare body nodes only (not frontmatter — that's compared separately via doObjectsMatch below).
    const generatedNormalized = normalizeAttrsDeep({ ...(generatedBody as ComarkTree), frontmatter: {} })
    const documentNormalized = normalizeAttrsDeep({ ...(documentBody as ComarkTree), frontmatter: {} })
    const generatedBodyStringified = (await renderMarkdown(generatedNormalized)).replace(/\n/g, '')
    const documentBodyStringified = (await renderMarkdown(documentNormalized)).replace(/\n/g, '')
    if (generatedBodyStringified !== documentBodyStringified) {
      return false
    }

    return doObjectsMatch(refineDocumentData(generatedDocumentData), refineDocumentData(documentData))
  }

  return doObjectsMatch(refineDocumentData(generatedDocument), refineDocumentData(document))
}

export async function areDocumentsEqual(document1: Record<string, unknown>, document2: Record<string, unknown>) {
  const { body: body1, meta: meta1, ...documentData1 } = document1
  const { body: body2, meta: meta2, ...documentData2 } = document2

  // Compare body first
  if (document1.extension === ContentFileExtension.Markdown) {
    if (await renderMarkdown(body1 as ComarkTree) !== await renderMarkdown(body2 as ComarkTree)) {
      return false
    }
  }
  else if (typeof body1 === 'object' && typeof body2 === 'object') {
    if (!doObjectsMatch(body1 as Record<string, unknown>, body2 as Record<string, unknown>)) {
      return false
    }
  }
  else {
    // For other file types, we compare the JSON stringified bodies
    if (JSON.stringify(body1) !== JSON.stringify(body2)) {
      return false
    }
  }

  const data1 = refineDocumentData({ ...documentData1, ...(meta1 || {}) })
  const data2 = refineDocumentData({ ...documentData2, ...(meta2 || {}) })
  if (!doObjectsMatch(data1, data2)) {
    return false
  }

  return true
}

function refineDocumentData(doc: Record<string, unknown>) {
  const { meta, ...documentData } = doc
  const refinedDoc = { ...documentData, ...(meta as Record<string, unknown> || {}) }

  if (refinedDoc.seo) {
    const seo = refinedDoc.seo as Record<string, unknown>
    refinedDoc.seo = {
      ...seo,
      title: seo.title || refinedDoc.title,
      description: seo.description || refinedDoc.description,
    }
  }

  // documents with same id are being compared, so it is safe to remove `path` and `__hash__`
  Reflect.deleteProperty(refinedDoc, '__hash__')
  Reflect.deleteProperty(refinedDoc, 'path')

  // default value of navigation is true; D1 may store it as string 'true'
  if (typeof refinedDoc.navigation === 'undefined' || refinedDoc.navigation === 'true') {
    refinedDoc.navigation = true
  }

  for (const key in refinedDoc) {
    const value = refinedDoc[key]
    if (typeof value === 'string' && !Number.isNaN(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      refinedDoc[key] = new Date(value).toISOString().split('T')[0]
    }
  }

  function removeNullAndUndefined(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const key in obj) {
      const value = obj[key]
      if (value === null || value === undefined) continue
      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = removeNullAndUndefined(value as Record<string, unknown>)
      }
      else {
        result[key] = value
      }
    }
    return result
  }

  return removeNullAndUndefined(refinedDoc)
}
