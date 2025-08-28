import type { CollectionInfo, CollectionSource, Draft07, ParsedContentFile } from '@nuxt/content'
import { hash } from 'ohash'
import { pathMetaTransform } from './path-meta'
import type { DatabaseItem } from '../types'
import { minimatch } from 'minimatch'
import { join } from 'pathe'
import { omit } from './object'

export function getOrderedSchemaKeys(schema: Draft07) {
  const shape = Object.values(schema.definitions)[0]?.properties || {}
  const keys = new Set([
    shape.id ? 'id' : undefined,
    shape.title ? 'title' : undefined,
    ...Object.keys(shape).sort(),
  ].filter(Boolean))

  return Array.from(keys) as string[]
}

export function getCollection(collectionName: string, collections: Record<string, CollectionInfo>): CollectionInfo {
  const collection = collections[collectionName as keyof typeof collections]
  if (!collection) {
    throw new Error(`Collection ${collectionName} not found`)
  }
  return collection
}

export function getCollectionSource(id: string, collection: CollectionInfo) {
  const [_, ...rest] = id.split(/[/:]/)
  const path = rest.join('/')

  const matchedSource = collection.source.find((source) => {
    const include = minimatch(path, source.include)
    const exclude = source.exclude?.some(exclude => minimatch(path, exclude))

    return include && !exclude
  })

  return matchedSource
}

export function getContentPath(id: string, collection: CollectionInfo['source'][0]) {
  const [_, ...rest] = id.split(/[/:]/)
  const path = rest.join('/')

  const { fixed } = parseSourceBase(collection)

  return join('content', fixed, path)
}

export function getCollectionInfo(id: string, collections: Record<string, CollectionInfo>) {
  const collection = getCollection(id.split(/[/:]/)[0]!, collections)
  const source = getCollectionSource(id, collection)
  const path = getContentPath(id, source!)

  return {
    collection,
    source,
    path,
  }
}

export function parseSourceBase(source: CollectionSource) {
  const [fixPart, ...rest] = source.include.includes('*') ? source.include.split('*') : ['', source.include]
  return {
    fixed: fixPart || '',
    dynamic: '*' + rest.join('*'),
  }
}

export function withoutReservedKeys(content: ParsedContentFile) {
  const result = omit(content, ['id', 'stem', 'extension', '__hash__', 'path', 'body', 'meta'])
  // Default value of navigation is true, so we can safely remove it
  if (result.navigation === true) {
    Reflect.deleteProperty(result, 'navigation')
  }
  // expand meta to the root
  for (const key in (content.meta || {})) {
    if (key !== '__hash__') {
      result[key] = (content.meta as Record<string, unknown>)[key]
    }
  }
  return result
}

export function createCollectionDocument(collection: CollectionInfo, id: string, item: DatabaseItem) {
  const parsedContent = [
    pathMetaTransform,
  ].reduce((acc, fn) => fn(acc), { ...item, id } as Record<string, unknown>)
  const result = { id } as ParsedContentFile
  const meta = {} as Record<string, unknown>

  const collectionKeys = getOrderedSchemaKeys(collection.schema as unknown as Draft07)
  for (const key of Object.keys(parsedContent)) {
    if (collectionKeys.includes(key)) {
      result[key] = parsedContent[key]
    }
    else {
      meta[key] = parsedContent[key]
    }
  }

  result.meta = meta

  // Storing `content` into `rawbody` field
  // TODO: handle rawbody
  // if (collectionKeys.includes('rawbody')) {
  //   result.rawbody = result.rawbody ?? file.body
  // }

  if (collectionKeys.includes('seo')) {
    const seo = result.seo = (result.seo || {}) as Record<string, unknown>
    seo.title = seo.title || result.title
    seo.description = seo.description || result.description
  }

  return result
}

function computeValuesBasedOnCollectionSchema(collection: CollectionInfo, data: Record<string, unknown>) {
  const fields: string[] = []
  const values: Array<string | number | boolean> = []
  const properties = (collection.schema.definitions![collection.name] as any).properties
  const sortedKeys = getOrderedSchemaKeys(collection.schema)

  sortedKeys.forEach((key) => {
    const value = (properties)[key]
    const type = collection.fields[key]
    const defaultValue = value?.default !== undefined ? value.default : 'NULL'
    const valueToInsert = typeof data[key] !== 'undefined' ? data[key] : defaultValue

    fields.push(key)

    if (type === 'json') {
      values.push(`'${JSON.stringify(valueToInsert).replace(/'/g, '\'\'')}'`)
    }
    else if (type === 'string' || ['string', 'enum'].includes(value.type)) {
      if (['data', 'datetime'].includes(value.format)) {
        values.push(valueToInsert !== 'NULL' ? `'${new Date(valueToInsert).toISOString()}'` : defaultValue)
      }
      else {
        values.push(`'${String(valueToInsert).replace(/\n/g, '\\n').replace(/'/g, '\'\'')}'`)
      }
    }
    else if (type === 'boolean') {
      values.push(valueToInsert !== 'NULL' ? !!valueToInsert : valueToInsert)
    }
    else {
      values.push(valueToInsert)
    }
  })

  // add the hash in local dev database
  values.push(`'${hash(values)}'`)

  return values
}

export function generateRecordInsert(collection: CollectionInfo, data: Record<string, unknown>) {
  const values = computeValuesBasedOnCollectionSchema(collection, data)

  let index = 0

  return `INSERT INTO ${collection.tableName} VALUES (${'?, '.repeat(values.length).slice(0, -2)})`
    .replace(/\?/g, () => values[index++] as string)
}

export function generateRecordUpsert(collection: CollectionInfo, id: string, data: Record<string, unknown>) {
  id = id.replace(/:/g, '/')
  const deleteQuery = generateRecordDeletion(collection, id)

  const insertQuery = generateRecordInsert(collection, data)

  return [deleteQuery, insertQuery]
}

export function generateRecordDeletion(collection: CollectionInfo, id: string) {
  return `DELETE FROM ${collection.tableName} WHERE id = '${id}';`
}
