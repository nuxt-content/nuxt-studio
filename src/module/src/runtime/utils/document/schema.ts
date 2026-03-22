import type { CollectionInfo, CollectionItemBase, Draft07DefinitionProperty } from '@nuxt/content'
import type { DatabaseItem, DatabasePageItem } from 'nuxt-studio/app'
import { getOrderedSchemaKeys } from '../collection'
import { omit, pick } from '../object'
import { addPageTypeFields } from './utils'

export const reservedKeys = ['id', 'fsPath', 'stem', 'extension', '__hash__', 'path', 'body', 'meta', 'rawbody']

type CompositeDefinition = Draft07DefinitionProperty & {
  allOf?: Draft07DefinitionProperty[]
  anyOf?: Draft07DefinitionProperty[]
  oneOf?: Draft07DefinitionProperty[]
}

export function applyCollectionSchema(id: string, collectionInfo: CollectionInfo, document: CollectionItemBase) {
  let parsedContent = { ...document, id }
  if (collectionInfo.type === 'page') {
    parsedContent = addPageTypeFields(parsedContent)
  }

  const result = { id } as DatabaseItem
  const meta = parsedContent.meta

  const collectionKeys = getOrderedSchemaKeys(collectionInfo.schema)
  for (const key of Object.keys(parsedContent)) {
    if (collectionKeys.includes(key)) {
      result[key] = parsedContent[key as keyof typeof parsedContent]
    }
    else {
      meta[key] = parsedContent[key as keyof typeof parsedContent]
    }
  }

  // Clean fsPath from meta to avoid storing it in the database
  if (meta.fsPath) {
    Reflect.deleteProperty(meta, 'fsPath')
  }

  result.meta = meta

  // Storing `content` into `rawbody` field
  // TODO: handle rawbody
  // if (collectionKeys.includes('rawbody')) {
  //   result.rawbody = result.rawbody ?? file.body
  // }

  if (collectionKeys.includes('seo')) {
    const seo = result.seo = (result.seo || {}) as DatabasePageItem['seo']
    seo.title = seo.title || result.title as string
    seo.description = seo.description || result.description as string
  }

  return result
}

export function pickReservedKeysFromDocument(document: DatabaseItem): DatabaseItem {
  return pick(document, reservedKeys) as DatabaseItem
}

function isObjectDefinition(definition?: Draft07DefinitionProperty): definition is Draft07DefinitionProperty & { properties: Record<string, Draft07DefinitionProperty> } {
  return Boolean(definition && (definition.type === 'object' || definition.properties))
}

function mergeDefinitions(
  left: Draft07DefinitionProperty,
  right: Draft07DefinitionProperty,
): Draft07DefinitionProperty {
  if (isObjectDefinition(left) && isObjectDefinition(right)) {
    return {
      ...left,
      ...right,
      type: 'object',
      properties: Object.fromEntries(
        Array.from(new Set([
          ...Object.keys(left.properties),
          ...Object.keys(right.properties),
        ])).map((key) => {
          const leftProperty = left.properties[key]
          const rightProperty = right.properties[key]

          return [key, leftProperty && rightProperty ? mergeDefinitions(leftProperty, rightProperty) : (rightProperty || leftProperty)!]
        }),
      ),
      required: Array.from(new Set([
        ...(left.required || []),
        ...(right.required || []),
      ])),
    } as Draft07DefinitionProperty
  }

  return {
    ...left,
    ...right,
  } as Draft07DefinitionProperty
}

function mergeObjectDefinitions(definitions: Draft07DefinitionProperty[]) {
  const objectDefinitions = definitions.filter(isObjectDefinition)

  if (objectDefinitions.length === 0) {
    return undefined
  }

  return objectDefinitions.reduce((merged, definition) => {
    return merged ? mergeDefinitions(merged, definition) : definition
  }) as Draft07DefinitionProperty | undefined
}

function resolveDefinition(definition?: Draft07DefinitionProperty): Draft07DefinitionProperty | undefined {
  if (!definition) {
    return undefined
  }

  const compositeDefinition = definition as CompositeDefinition
  if (compositeDefinition.allOf?.length) {
    return mergeObjectDefinitions(compositeDefinition.allOf) || compositeDefinition.allOf[0]
  }

  if (compositeDefinition.anyOf?.length) {
    return compositeDefinition.anyOf[0]
  }

  if (compositeDefinition.oneOf?.length) {
    return compositeDefinition.oneOf[0]
  }

  return definition
}

function shouldPreserveEmptyArray(path: string[], collection?: Pick<CollectionInfo, 'name' | 'schema'>) {
  if (!collection?.schema) {
    return false
  }

  let currentDefinition = resolveDefinition(collection.schema.definitions?.[collection.name] as Draft07DefinitionProperty | undefined)
  let required = false

  for (const segment of path) {
    if (!currentDefinition || !isObjectDefinition(currentDefinition)) {
      return false
    }

    required = Boolean(currentDefinition.required?.includes(segment))
    currentDefinition = resolveDefinition(currentDefinition.properties[segment])
  }

  return required && currentDefinition?.type === 'array'
}

function cleanupEmptyValues(
  value: unknown,
  path: string[],
  collection?: Pick<CollectionInfo, 'name' | 'schema'>,
): unknown {
  if (Array.isArray(value)) {
    return value.length === 0 && !shouldPreserveEmptyArray(path, collection)
      ? undefined
      : value
  }

  if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, childValue]) => {
      const cleanedValue = cleanupEmptyValues(childValue, [...path, key], collection)

      if (cleanedValue === undefined || cleanedValue === null) {
        Reflect.deleteProperty(value as Record<string, unknown>, key)
      }
      else {
        ;(value as Record<string, unknown>)[key] = cleanedValue
      }
    })
  }

  return value
}

export function cleanDataKeys(document: DatabaseItem, collection?: Pick<CollectionInfo, 'name' | 'schema'>): DatabaseItem {
  const result = omit(document, reservedKeys)
  // Default value of navigation is true, so we can safely remove it
  if (result.navigation === true) {
    Reflect.deleteProperty(result, 'navigation')
  }

  if (document.seo) {
    const seo = document.seo as Record<string, unknown>
    if (
      (!seo.title || seo.title === document.title)
      && (!seo.description || seo.description === document.description)
    ) {
      Reflect.deleteProperty(result, 'seo')
    }
  }

  if (!document.title) {
    Reflect.deleteProperty(result, 'title')
  }

  if (!document.description) {
    Reflect.deleteProperty(result, 'description')
  }

  // expand meta to the root
  for (const key in (document.meta || {})) {
    if (!reservedKeys.includes(key)) {
      result[key] = (document.meta as Record<string, unknown>)[key]
    }
  }

  return cleanupEmptyValues(result, [], collection) as DatabaseItem
}
