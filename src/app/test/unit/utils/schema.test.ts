import type { Draft07 } from '@nuxt/content'
import { describe, expect, test } from 'vitest'
import { ContentFileExtension } from '../../../src/types'
import { generateInitialContentForCollection, generateInitialContentForPath, generateInitialDataFromSchema } from '../../../src/utils/schema'

describe('generateInitialDataFromSchema', () => {
  test('uses defaults and scaffolds required nested objects and arrays', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          required: ['slug', 'authors', 'seo'],
          properties: {
            title: {
              type: 'string',
              default: 'Untitled',
            },
            slug: {
              type: 'string',
            },
            authors: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            seo: {
              type: 'object',
              required: ['image'],
              properties: {
                image: {
                  type: 'object',
                  required: ['src'],
                  properties: {
                    src: {
                      type: 'string',
                      default: '/cover.png',
                    },
                    alt: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    expect(generateInitialDataFromSchema('posts', schema)).toStrictEqual({
      title: 'Untitled',
      authors: [],
      seo: {
        image: {
          src: '/cover.png',
        },
      },
    })
  })

  test('skips hidden and reserved keys', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          required: ['title', 'body', 'meta', 'secret'],
          properties: {
            title: {
              type: 'string',
              default: 'Visible',
            },
            body: {
              type: 'object',
              default: { value: 'hidden reserved key' },
            },
            meta: {
              type: 'object',
              default: { draft: true },
            },
            secret: {
              type: 'string',
              default: 'hidden',
              $content: {
                editor: {
                  hidden: true,
                },
              },
            },
          },
        },
      },
    }

    expect(generateInitialDataFromSchema('posts', schema)).toStrictEqual({
      title: 'Visible',
    })
  })

  test('prefers object branches for anyOf and oneOf definitions', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          required: ['settings', 'card'],
          properties: {
            settings: {
              anyOf: [
                { type: 'boolean' },
                {
                  type: 'object',
                  required: ['icon'],
                  properties: {
                    icon: {
                      type: 'string',
                      default: 'i-lucide-star',
                    },
                  },
                },
              ],
            },
            card: {
              oneOf: [
                { type: 'string' },
                {
                  type: 'object',
                  required: ['theme'],
                  properties: {
                    theme: {
                      type: 'string',
                      default: 'default',
                    },
                  },
                },
              ],
            },
          },
        },
      },
    }

    expect(generateInitialDataFromSchema('posts', schema)).toStrictEqual({
      settings: {
        icon: 'i-lucide-star',
      },
      card: {
        theme: 'default',
      },
    })
  })

  test('prefers explicit defaults over object branches in variants', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          required: ['navigation'],
          properties: {
            navigation: {
              anyOf: [
                {
                  type: 'boolean',
                  default: true,
                },
                {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: {
                      type: 'string',
                      default: 'Docs',
                    },
                  },
                },
              ],
            },
          },
        },
      },
    }

    expect(generateInitialDataFromSchema('posts', schema)).toStrictEqual({
      navigation: true,
    })
  })

  test('uses enum values and caller title injection when required', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/authors',
      definitions: {
        authors: {
          type: 'object',
          required: ['name', 'role', 'theme'],
          properties: {
            name: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['maintainer', 'author'],
            },
            theme: {
              anyOf: [
                {
                  type: 'string',
                  enum: ['system', 'light'],
                },
                {
                  type: 'object',
                  default: {
                    mode: 'dark',
                  },
                },
              ],
            },
          },
        },
      },
    }

    expect(generateInitialDataFromSchema('authors', schema, {
      title: 'Ada',
    })).toStrictEqual({
      name: 'Ada',
      role: 'maintainer',
      theme: {
        mode: 'dark',
      },
    })
  })

  test('omits required scalar fields without defaults, enums, or title injection', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/authors',
      definitions: {
        authors: {
          type: 'object',
          required: ['username', 'birthDate', 'featured', 'priority'],
          properties: {
            username: {
              type: 'string',
            },
            birthDate: {
              type: 'string',
              format: 'date',
            },
            featured: {
              type: 'boolean',
            },
            priority: {
              type: 'integer',
            },
          },
        },
      },
    }

    expect(generateInitialDataFromSchema('authors', schema)).toStrictEqual({
    })
  })

  test('merges object branches for allOf definitions', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          required: ['seo'],
          properties: {
            seo: {
              allOf: [
                {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: {
                      type: 'string',
                      default: 'SEO title',
                    },
                  },
                },
                {
                  type: 'object',
                  required: ['image'],
                  properties: {
                    image: {
                      type: 'object',
                      required: ['src'],
                      properties: {
                        src: {
                          type: 'string',
                          default: '/social.png',
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    }

    expect(generateInitialDataFromSchema('posts', schema)).toStrictEqual({
      seo: {
        title: 'SEO title',
        image: {
          src: '/social.png',
        },
      },
    })
  })

  test('skips referenced subschemas because only inline definitions are supported', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          required: ['author'],
          properties: {
            author: {
              $ref: '#/definitions/author',
            },
          },
        },
        author: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              default: 'Ada',
            },
          },
        },
      },
    }

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

  test('serializes schema-derived yaml and json content', () => {
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
  })

  test('looks up the collection by path and falls back when none exists', () => {
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

  test('prefers explicit fallback data over schema defaults', () => {
    expect(generateInitialContentForCollection(
      ContentFileExtension.YAML,
      '',
      collection,
      { fallbackData: { title: 'Folder title' } },
    )).toBe('title: Folder title\nauthors: []\n')
  })
})
