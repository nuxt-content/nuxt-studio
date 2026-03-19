import type { Draft07, Draft07DefinitionProperty } from '@nuxt/content'
import { describe, expect, test } from 'vitest'
import { ContentFileExtension } from '../../../src/types'
import { generateInitialContentForCollection, generateInitialContentForPath, generateInitialDataFromSchema } from '../../../src/utils/schema'

function defineObject(
  properties: Record<string, Draft07DefinitionProperty>,
  required: string[] = [],
): Draft07DefinitionProperty {
  return {
    type: 'object',
    properties,
    required,
  }
}

function defineSchema(
  collection: string,
  definition: Draft07DefinitionProperty,
  extraDefinitions: Record<string, Draft07DefinitionProperty> = {},
): Draft07 {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $ref: `#/definitions/${collection}`,
    definitions: {
      [collection]: definition,
      ...extraDefinitions,
    },
  }
}

describe('generateInitialDataFromSchema', () => {
  test('builds starter data from inline defaults, required containers, enums, and title injection', () => {
    const schema = defineSchema('posts', defineObject({
      title: { type: 'string', default: 'Untitled' },
      name: { type: 'string' },
      role: { type: 'string', enum: ['maintainer', 'author'] },
      authors: { type: 'array', items: { type: 'string' } },
      seo: defineObject({
        image: defineObject({
          src: { type: 'string', default: '/cover.png' },
          alt: { type: 'string' },
        }, ['src']),
      }, ['image']),
      body: { type: 'object', default: { value: 'hidden reserved key' } },
      secret: {
        type: 'string',
        default: 'hidden',
        $content: { editor: { hidden: true } },
      },
    }, ['name', 'role', 'authors', 'seo', 'body', 'secret']))

    expect(generateInitialDataFromSchema('posts', schema, { title: 'Ada' })).toStrictEqual({
      title: 'Untitled',
      name: 'Ada',
      role: 'maintainer',
      authors: [],
      seo: {
        image: {
          src: '/cover.png',
        },
      },
    })
  })

  test('handles inline allOf, anyOf, and oneOf with the simple selection rules', () => {
    const schema = defineSchema('posts', {
      allOf: [
        defineObject({
          navigation: {
            anyOf: [
              { type: 'boolean', default: true },
              defineObject({
                title: { type: 'string', default: 'Docs' },
              }, ['title']),
            ],
          },
        }, ['navigation']),
        defineObject({
          card: {
            oneOf: [
              { type: 'string' },
              defineObject({
                theme: { type: 'string', default: 'default' },
              }, ['theme']),
            ],
          },
          seo: {
            allOf: [
              defineObject({
                title: { type: 'string', default: 'SEO title' },
              }, ['title']),
              defineObject({
                image: defineObject({
                  src: { type: 'string', default: '/social.png' },
                }, ['src']),
              }, ['image']),
            ],
          },
        }, ['card']),
      ],
    })

    expect(generateInitialDataFromSchema('posts', schema)).toStrictEqual({
      navigation: true,
      card: {
        theme: 'default',
      },
      seo: {
        title: 'SEO title',
        image: {
          src: '/social.png',
        },
      },
    })
  })

  test('omits unsupported required scalars and referenced subschemas', () => {
    const schema = defineSchema('posts', defineObject({
      username: { type: 'string' },
      birthDate: { type: 'string', format: 'date' },
      featured: { type: 'boolean' },
      priority: { type: 'integer' },
      author: { $ref: '#/definitions/author' },
    }, ['username', 'birthDate', 'featured', 'priority', 'author']), {
      author: defineObject({
        name: { type: 'string', default: 'Ada' },
      }, ['name']),
    })

    expect(generateInitialDataFromSchema('posts', schema)).toStrictEqual({})
  })

  test('returns an empty object when the collection schema is missing', () => {
    expect(generateInitialDataFromSchema('posts', undefined)).toStrictEqual({})
  })
})

describe('generateInitialContentForCollection', () => {
  const collection = {
    name: 'posts',
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              default: 'Untitled',
            },
            authors: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          required: ['authors'],
        },
      },
    } satisfies Draft07,
  }

  test('serializes schema-derived markdown frontmatter', () => {
    expect(generateInitialContentForCollection(
      ContentFileExtension.Markdown,
      '# Untitled',
      collection,
    )).toBe('---\ntitle: Untitled\nauthors: []\n---\n\n# Untitled')
  })

  test('serializes yaml/json content and falls back when no collection exists', () => {
    expect(generateInitialContentForCollection(
      ContentFileExtension.YAML,
      '# ignored',
      collection,
    )).toBe('title: Untitled\nauthors: []\n')

    expect(generateInitialContentForCollection(
      ContentFileExtension.JSON,
      '# ignored',
      collection,
    )).toBe('{\n  "title": "Untitled",\n  "authors": []\n}')

    const collectionByPath = (fsPath: string) => fsPath.endsWith('.md') ? collection : undefined

    expect(generateInitialContentForPath(
      'docs/hello.md',
      ContentFileExtension.Markdown,
      '# Untitled',
      collectionByPath,
    )).toBe('---\ntitle: Untitled\nauthors: []\n---\n\n# Untitled')

    expect(generateInitialContentForPath(
      'docs/hello.yml',
      ContentFileExtension.YAML,
      '',
      collectionByPath,
      { fallbackData: { title: 'Folder title' } },
    )).toBe('title: Folder title\n')
  })
})
