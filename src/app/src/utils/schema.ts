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
  allOf?: Draft07DefinitionProperty[]
  anyOf?: Draft07DefinitionProperty[]
  oneOf?: Draft07DefinitionProperty[]
}

interface InitialDataOptions {
  fallbackData?: Record<string, unknown>
  title?: string
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

  return objectDefinitions.reduce((merged, definition) => {
    return merged ? mergeDefinitions(merged, definition) : definition
  }) as Draft07DefinitionProperty | undefined
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

function pickPreferredVariant(definitions: Draft07DefinitionProperty[]) {
  return definitions.find(definition => definition.default !== undefined)
    || definitions.find(isObjectDefinition)
    || definitions[0]
}

function resolveDefinition(definition?: Draft07DefinitionProperty): Draft07DefinitionProperty | undefined {
  if (!definition) {
    return undefined
  }

  // $ref resolution skipped — only inline schemas used for starter generation
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

function buildInitialObject(definition: Draft07DefinitionProperty, options: InitialDataOptions = {}) {
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
    })
    if (value !== undefined) {
      initialData[key] = value
    }
  })

  return initialData
}

function buildInitialValue(
  definition?: Draft07DefinitionProperty,
  context: { key?: string, required?: boolean, title?: string } = {},
): unknown {
  const resolvedDefinition = resolveDefinition(definition)
  if (!resolvedDefinition || isHiddenDefinition(resolvedDefinition)) {
    return undefined
  }

  if (resolvedDefinition.default !== undefined) {
    return structuredClone(resolvedDefinition.default)
  }

  if (context.required && resolvedDefinition.enum?.length) {
    return structuredClone(resolvedDefinition.enum[0])
  }

  if (isObjectDefinition(resolvedDefinition)) {
    const initialData = buildInitialObject(resolvedDefinition, { title: context.title })
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
  const resolvedRootDefinition = resolveDefinition(rootDefinition)

  if (!resolvedRootDefinition || !isObjectDefinition(resolvedRootDefinition)) {
    return {}
  }

  return buildInitialObject(resolvedRootDefinition, options)
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

