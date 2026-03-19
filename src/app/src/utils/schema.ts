import type { CollectionInfo, Draft07, Draft07DefinitionProperty } from '@nuxt/content'
import { ContentFileExtension } from '../types'
import { jsonToYaml } from './data'

const reservedKeys = new Set([
  'id',
  'stem',
  'extension',
  'path',
  'meta',
  'body',
  'fsPath',
  'rawbody',
  '__hash__',
])

type CompositeDefinition = Draft07DefinitionProperty & {
  $ref?: string
  allOf?: Draft07DefinitionProperty[]
  anyOf?: Draft07DefinitionProperty[]
  oneOf?: Draft07DefinitionProperty[]
}

interface InitialDataOptions {
  fallbackData?: Record<string, unknown>
  title?: string
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

function mergeDefinitions(
  first: Draft07DefinitionProperty,
  second: Draft07DefinitionProperty,
  schema?: Draft07,
  seenRefs: Set<string> = new Set(),
): Draft07DefinitionProperty {
  const resolvedFirst = resolveDefinition(first, schema, seenRefs)
  const resolvedSecond = resolveDefinition(second, schema, seenRefs)

  if (!resolvedFirst) {
    return resolvedSecond!
  }

  if (!resolvedSecond) {
    return resolvedFirst
  }

  if (isObjectDefinition(resolvedFirst) && isObjectDefinition(resolvedSecond)) {
    return mergeObjectDefinitions([resolvedFirst, resolvedSecond], schema, seenRefs)!
  }

  return {
    ...resolvedFirst,
    ...resolvedSecond,
  }
}

function mergeObjectDefinitions(
  definitions: Draft07DefinitionProperty[],
  schema?: Draft07,
  seenRefs: Set<string> = new Set(),
) {
  const objectDefinitions = definitions
    .map(definition => resolveDefinition(definition, schema, seenRefs))
    .filter(isObjectDefinition)

  if (objectDefinitions.length === 0) {
    return undefined
  }

  const mergedRequired = new Set<string>()
  const mergedProperties: Record<string, Draft07DefinitionProperty> = {}

  objectDefinitions.forEach((definition) => {
    Object.entries(definition.properties).forEach(([key, property]) => {
      const existingProperty = mergedProperties[key]
      mergedProperties[key] = existingProperty
        ? mergeDefinitions(existingProperty, property, schema, seenRefs)
        : property
    })

    definition.required?.forEach(key => mergedRequired.add(key))
  })

  return {
    ...objectDefinitions.reduce((acc, definition) => ({ ...acc, ...definition }), {}),
    type: 'object',
    properties: mergedProperties,
    required: Array.from(mergedRequired),
  } as Draft07DefinitionProperty
}

function pickPreferredVariant(
  definitions: Draft07DefinitionProperty[],
  schema?: Draft07,
  seenRefs: Set<string> = new Set(),
) {
  const resolvedDefinitions = definitions
    .map(definition => resolveDefinition(definition, schema, seenRefs))
    .filter((definition): definition is Draft07DefinitionProperty => Boolean(definition))

  return resolvedDefinitions.find(definition => definition.default !== undefined)
    || resolvedDefinitions.find(isObjectDefinition)
    || resolvedDefinitions[0]
}

function resolveDefinition(
  definition?: Draft07DefinitionProperty,
  schema?: Draft07,
  seenRefs: Set<string> = new Set(),
): Draft07DefinitionProperty | undefined {
  if (!definition) {
    return undefined
  }

  const compositeDefinition = definition as CompositeDefinition
  if (compositeDefinition.$ref) {
    const ref = compositeDefinition.$ref
    const referencedKey = ref.startsWith('#/definitions/') ? ref.slice('#/definitions/'.length) : ''
    const referencedDefinition = referencedKey
      ? schema?.definitions?.[referencedKey] as Draft07DefinitionProperty | undefined
      : undefined

    if (referencedDefinition && !seenRefs.has(ref)) {
      const nextSeenRefs = new Set(seenRefs)
      nextSeenRefs.add(ref)

      const { $ref: _, ...localDefinition } = compositeDefinition
      const resolvedReferenced = resolveDefinition(referencedDefinition, schema, nextSeenRefs)

      if (!resolvedReferenced) {
        return undefined
      }

      if (Object.keys(localDefinition).length === 0) {
        return resolvedReferenced
      }

      return mergeDefinitions(
        resolvedReferenced,
        localDefinition as Draft07DefinitionProperty,
        schema,
        nextSeenRefs,
      )
    }
  }

  if (compositeDefinition.allOf?.length) {
    return mergeObjectDefinitions(compositeDefinition.allOf, schema, seenRefs)
      || pickPreferredVariant(compositeDefinition.allOf, schema, seenRefs)
  }

  if (compositeDefinition.anyOf?.length) {
    return pickPreferredVariant(compositeDefinition.anyOf, schema, seenRefs)
  }

  if (compositeDefinition.oneOf?.length) {
    return pickPreferredVariant(compositeDefinition.oneOf, schema, seenRefs)
  }

  return definition
}

function buildInitialObject(definition: Draft07DefinitionProperty, schema?: Draft07, options: InitialDataOptions = {}) {
  if (!isObjectDefinition(definition)) {
    return {}
  }

  const requiredKeys = new Set(definition.required || [])
  const initialData: Record<string, unknown> = {}

  Object.entries(definition.properties).forEach(([key, property]) => {
    if (reservedKeys.has(key) || isHiddenDefinition(property)) {
      return
    }

    const value = buildInitialValue(property, {
      key,
      required: requiredKeys.has(key),
      title: options.title,
    }, schema)
    if (value !== undefined) {
      initialData[key] = value
    }
  })

  return initialData
}

function buildInitialValue(
  definition?: Draft07DefinitionProperty,
  context: { key?: string, required?: boolean, title?: string } = {},
  schema?: Draft07,
): unknown {
  const resolvedDefinition = resolveDefinition(definition, schema)
  if (!resolvedDefinition || isHiddenDefinition(resolvedDefinition)) {
    return undefined
  }

  if (resolvedDefinition.default !== undefined) {
    return cloneValue(resolvedDefinition.default)
  }

  if (context.required && resolvedDefinition.enum?.length) {
    return cloneValue(resolvedDefinition.enum[0])
  }

  if (isObjectDefinition(resolvedDefinition)) {
    const initialData = buildInitialObject(resolvedDefinition, schema, { title: context.title })
    if (Object.keys(initialData).length > 0 || context.required) {
      return initialData
    }

    return undefined
  }

  if (resolvedDefinition.type === 'array') {
    return context.required ? [] : undefined
  }

  if (
    context.required
    && context.title
    && resolvedDefinition.type === 'string'
    && ['title', 'name'].includes(context.key || '')
  ) {
    return context.title
  }

  return undefined
}

export function generateInitialDataFromSchema(collectionName: string, schema?: Draft07, options: InitialDataOptions = {}) {
  const rootDefinition = schema?.definitions?.[collectionName] as Draft07DefinitionProperty | undefined
  const resolvedRootDefinition = resolveDefinition(rootDefinition, schema)

  if (!resolvedRootDefinition || !isObjectDefinition(resolvedRootDefinition)) {
    return {}
  }

  return buildInitialObject(resolvedRootDefinition, schema, options)
}

function serializeInitialData(extension: string, bodyContent: string, initialData: Record<string, unknown>) {
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

  return serializeInitialData(extension, bodyContent, initialData)
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
