import type { CollectionInfo, Draft07, Draft07DefinitionProperty } from '@nuxt/content'
import { ContentFileExtension } from '../types'
import { jsonToYaml } from './data'

export const INITIAL_CONTENT_RESERVED_KEYS = [
  'id',
  'stem',
  'extension',
  'path',
  'meta',
  'body',
  'fsPath',
  'rawbody',
  '__hash__',
]

type CompositeDefinition = Draft07DefinitionProperty & {
  allOf?: Draft07DefinitionProperty[]
  anyOf?: Draft07DefinitionProperty[]
  oneOf?: Draft07DefinitionProperty[]
}

const reservedKeys = new Set(INITIAL_CONTENT_RESERVED_KEYS)

interface InitialDataOptions {
  fallbackData?: Record<string, unknown>
  title?: string
  now?: Date
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => cloneValue(item)) as T
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)]),
    ) as T
  }

  return value
}

function isObjectDefinition(definition?: Draft07DefinitionProperty): definition is Draft07DefinitionProperty & { properties: Record<string, Draft07DefinitionProperty> } {
  return Boolean(definition && (definition.type === 'object' || definition.properties))
}

function isHiddenDefinition(definition?: Draft07DefinitionProperty) {
  return Boolean(definition?.$content?.editor?.hidden)
}

function mergeObjectDefinitions(definitions: Draft07DefinitionProperty[]) {
  const objectDefinitions = definitions.filter(isObjectDefinition)
  if (objectDefinitions.length === 0) {
    return undefined
  }

  const mergedRequired = new Set<string>()
  const mergedProperties: Record<string, Draft07DefinitionProperty> = {}

  objectDefinitions.forEach((definition) => {
    Object.assign(mergedProperties, definition.properties)
    definition.required?.forEach(key => mergedRequired.add(key))
  })

  return {
    type: 'object',
    properties: mergedProperties,
    required: Array.from(mergedRequired),
  } as Draft07DefinitionProperty
}

function pickPreferredDefinition(definition?: Draft07DefinitionProperty): Draft07DefinitionProperty | undefined {
  if (!definition) {
    return undefined
  }

  const compositeDefinition = definition as CompositeDefinition
  if (compositeDefinition.allOf?.length) {
    return mergeObjectDefinitions(compositeDefinition.allOf) || pickPreferredVariant(compositeDefinition.allOf)
  }

  if (compositeDefinition.anyOf?.length) {
    return pickPreferredVariant(compositeDefinition.anyOf)
  }

  if (compositeDefinition.oneOf?.length) {
    return pickPreferredVariant(compositeDefinition.oneOf)
  }

  return definition
}

function pickPreferredVariant(definitions: Draft07DefinitionProperty[]) {
  return definitions.find(definition => definition.default !== undefined)
    || definitions.find(isObjectDefinition)
    || definitions.find(definition => definition.type !== 'boolean')
    || definitions[0]
}

function generateObjectFromDefinition(definition: Draft07DefinitionProperty, options: InitialDataOptions = {}) {
  if (!isObjectDefinition(definition)) {
    return {}
  }

  const requiredKeys = new Set(definition.required || [])
  const initialData: Record<string, unknown> = {}

  Object.entries(definition.properties).forEach(([key, property]) => {
    if (reservedKeys.has(key) || isHiddenDefinition(property)) {
      return
    }

    const value = generateValueFromDefinition(property, requiredKeys.has(key), key, options)
    if (value !== undefined) {
      initialData[key] = value
    }
  })

  return initialData
}

function generateScalarFallbackValue(definition: Draft07DefinitionProperty, key: string, options: InitialDataOptions = {}) {
  if (definition.enum?.length) {
    return cloneValue(definition.enum[0])
  }

  const now = options.now || new Date()

  if (definition.type === 'string') {
    if (definition.format === 'date') {
      return now.toISOString().split('T')[0]
    }

    if (definition.format === 'date-time' || definition.format === 'datetime') {
      return now.toISOString()
    }

    if ((key === 'title' || key === 'name') && options.title) {
      return options.title
    }

    return ''
  }

  if (definition.type === 'number' || definition.type === 'integer') {
    return 0
  }

  if (definition.type === 'boolean') {
    return false
  }

  return undefined
}

function generateValueFromDefinition(definition?: Draft07DefinitionProperty, isRequired = false, key = '', options: InitialDataOptions = {}): unknown {
  const resolvedDefinition = pickPreferredDefinition(definition)
  if (!resolvedDefinition || isHiddenDefinition(resolvedDefinition)) {
    return undefined
  }

  if (resolvedDefinition.default !== undefined) {
    return cloneValue(resolvedDefinition.default)
  }

  if (isObjectDefinition(resolvedDefinition)) {
    const initialData = generateObjectFromDefinition(resolvedDefinition, options)
    if (Object.keys(initialData).length > 0 || isRequired) {
      return initialData
    }

    return undefined
  }

  if (resolvedDefinition.type === 'array') {
    return isRequired ? [] : undefined
  }

  if (isRequired) {
    return generateScalarFallbackValue(resolvedDefinition, key, options)
  }

  return undefined
}

export function generateInitialDataFromSchema(collectionName: string, schema?: Draft07, options: InitialDataOptions = {}) {
  const rootDefinition = schema?.definitions?.[collectionName] as Draft07DefinitionProperty | undefined
  const resolvedRootDefinition = pickPreferredDefinition(rootDefinition)

  if (!resolvedRootDefinition || !isObjectDefinition(resolvedRootDefinition)) {
    return {}
  }

  return generateObjectFromDefinition(resolvedRootDefinition, options)
}

export function generateInitialContentForCollection(
  extension: string,
  bodyContent: string,
  collection?: Pick<CollectionInfo, 'name' | 'schema'>,
  options: InitialDataOptions = {},
) {
  const fallbackData = options.fallbackData || {}
  const initialData = collection?.schema
    ? {
        ...generateInitialDataFromSchema(collection.name, collection.schema, options),
        ...fallbackData,
      }
    : fallbackData

  switch (extension) {
    case ContentFileExtension.JSON:
      return JSON.stringify(initialData, null, 2)
    case ContentFileExtension.YAML:
    case ContentFileExtension.YML:
      return jsonToYaml(initialData)
    case ContentFileExtension.Markdown:
    default: {
      const frontmatter = jsonToYaml(initialData)

      return frontmatter
        ? `---\n${frontmatter}---\n\n${bodyContent}`
        : bodyContent
    }
  }
}

export function generateInitialContentForPath(
  fsPath: string,
  extension: string,
  bodyContent: string,
  getCollectionByFsPath: (fsPath: string) => Pick<CollectionInfo, 'name' | 'schema'> | undefined,
  options: InitialDataOptions = {},
) {
  return generateInitialContentForCollection(
    extension,
    bodyContent,
    getCollectionByFsPath(fsPath),
    options,
  )
}
