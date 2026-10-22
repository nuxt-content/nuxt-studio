import type { FormItem, FormTree } from '../../../src/types/form'
import type { Draft07 } from '@nuxt/content'
import { expect, test, describe } from 'vitest'
import { buildFormTreeFromSchema, applyValueById, applyValuesToFormTree, getUpdatedTreeItem, isMissingRequiredValue } from '../../../src/utils/form'
import { farnabazFormTree, larbishFormTree } from '../../mocks/form'
import { postsSchema } from '../../mocks/schema'

describe('buildFormTreeFromSchema', () => {
  test('handle array of objects with items', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  slug: {
                    type: 'string',
                  },
                  username: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                  },
                  to: {
                    type: 'string',
                  },
                  avatar: {
                    type: 'object',
                    properties: {
                      src: {
                        type: 'string',
                        $content: {
                          editor: {
                            input: 'media',
                          },
                        },
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
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('posts', schema)).toStrictEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          array: {
            id: '#posts/array',
            type: 'array',
            title: 'Array',
            arrayItemForm: {
              id: '#array/items',
              type: 'object',
              title: 'Items',
              children: {
                slug: {
                  id: '#array/items/slug',
                  type: 'string',
                  title: 'Slug',
                },
                username: {
                  id: '#array/items/username',
                  type: 'string',
                  title: 'Username',
                },
                name: {
                  id: '#array/items/name',
                  type: 'string',
                  title: 'Name',
                },
                to: {
                  id: '#array/items/to',
                  type: 'string',
                  title: 'To',
                },
                avatar: {
                  id: '#array/items/avatar',
                  type: 'object',
                  title: 'Avatar',
                  children: {
                    src: {
                      id: '#array/items/avatar/src',
                      type: 'media',
                      title: 'Src',
                    },
                    alt: {
                      id: '#array/items/avatar/alt',
                      type: 'string',
                      title: 'Alt',
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  })

  test('handle array of objects with items bis', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/pricing',
      definitions: {
        pricing: {
          type: 'object',
          additionalProperties: false,
          required: [],
          properties: {
            plans: {
              type: 'object',
              properties: {
                solo: {
                  type: 'object',
                  properties: {
                    features: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    expect(buildFormTreeFromSchema('pricing', schema)).toStrictEqual({ pricing: {
      id: '#pricing',
      title: 'Pricing',
      type: 'object',
      children: {
        plans: {
          id: '#pricing/plans',
          title: 'Plans',
          type: 'object',
          children: {
            solo: {
              id: '#pricing/plans/solo',
              title: 'Solo',
              type: 'object',
              children: {
                features: {
                  id: '#pricing/plans/solo/features',
                  title: 'Features',
                  type: 'array',
                  arrayItemForm: {
                    id: '#features/items',
                    title: 'Items',
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
    })
  })

  test('handle type creation for editor types (media, icon...) ', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            media: {
              type: 'string',
              $content: {
                editor: {
                  input: 'media',
                },
              },
            },
            icon: {
              type: 'string',
              $content: {
                editor: {
                  input: 'icon',
                },
              },
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('posts', schema)).toStrictEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          media: {
            id: '#posts/media',
            type: 'media',
            title: 'Media',
          },
          icon: {
            id: '#posts/icon',
            type: 'icon',
            title: 'Icon',
          },
        },
      },
    })
  })

  test('handle iconLibraries from editor options for icon input', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/authors',
      definitions: {
        authors: {
          type: 'object',
          properties: {
            icon: {
              type: 'string',
              $content: {
                editor: {
                  input: 'icon',
                  iconLibraries: ['lucide', 'simple-icons'],
                },
              },
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('authors', schema)).toStrictEqual({
      authors: {
        id: '#authors',
        type: 'object',
        title: 'Authors',
        children: {
          icon: {
            id: '#authors/icon',
            type: 'icon',
            title: 'Icon',
            options: ['lucide', 'simple-icons'],
          },
        },
      },
    })
  })

  test('hide field if set in editor metas', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            string: {
              type: 'string',
            },
            hidden: {
              type: 'string',
              $content: {
                editor: {
                  hidden: true,
                },
              },
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('posts', schema)).toStrictEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          string: {
            id: '#posts/string',
            type: 'string',
            title: 'String',
          },
        },
      },
    })
  })

  test('handle select type creation', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            select: {
              type: 'string',
              enum: ['value1', 'value2'],
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('posts', schema)).toStrictEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          select: {
            id: '#posts/select',
            type: 'string',
            title: 'Select',
            options: ['value1', 'value2'],
          },
        },
      },
    })
  })

  test('do not handle content internal fields', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            contentId: {
              type: 'string',
            },
            weight: {
              type: 'string',
            },
            stem: {
              type: 'string',
            },
            extension: {
              type: 'string',
              enum: [
                'md',
                'yaml',
                'json',
                'csv',
                'xml',
              ],
            },
            meta: {
              type: 'object',
              additionalProperties: {},
            },
            path: {
              type: 'string',
            },
            body: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                },
                children: {},
                toc: {},
              },
              required: [
                'type',
              ],
              additionalProperties: false,
            },
            string: {
              type: 'string',
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('posts', schema)).toStrictEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          string: {
            id: '#posts/string',
            type: 'string',
            title: 'String',
          },
        },
      },
    })
  })

  test('handle two level deep object with `allOff` property', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            seo: {
              allOf: [
                {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                    },
                    description: {
                      type: 'string',
                    },
                  },
                },
                {
                  type: 'object',
                  additionalProperties: {},
                },
              ],
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('posts', schema)).toStrictEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          seo: {
            id: '#posts/seo',
            type: 'object',
            title: 'Seo',
            children: {
              title: {
                id: '#posts/seo/title',
                type: 'string',
                title: 'Title',
              },
              description: {
                id: '#posts/seo/description',
                type: 'string',
                title: 'Description',
              },
            },
          },
        },
      },
    })
  })

  test('handle two level deep object with `anyOf` property and prioritize string type', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            navigation: {
              anyOf: [
                {
                  type: 'string',
                  enum: ['value1', 'value2'],
                },
                {
                  type: 'boolean',
                },
              ],
              default: false,
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('posts', schema)).toStrictEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          navigation: {
            id: '#posts/navigation',
            type: 'string',
            toggleable: true,
            title: 'Navigation',
            options: ['value1', 'value2'],
          },
        },
      },
    })
  })

  test('handle two level deep object with `anyOf` property and prioritize object type', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            navigation: {
              anyOf: [
                {
                  type: 'boolean',
                },
                {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                    },
                    description: {
                      type: 'string',
                    },
                    icon: {
                      type: 'string',
                    },
                  },
                  required: [
                    'title',
                    'description',
                    'icon',
                  ],
                  additionalProperties: false,
                },
              ],
              default: true,
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('posts', schema)).toStrictEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          navigation: {
            id: '#posts/navigation',
            type: 'object',
            title: 'Navigation',
            toggleable: true,
            children: {
              title: {
                id: '#posts/navigation/title',
                type: 'string',
                title: 'Title',
              },
              description: {
                id: '#posts/navigation/description',
                type: 'string',
                title: 'Description',
              },
              icon: {
                id: '#posts/navigation/icon',
                type: 'string',
                title: 'Icon',
              },
            },
          },
        },
      },
    })
  })

  test('handle three level deep object', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            hero: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                },
                description: {
                  type: 'string',
                },
                image: {
                  type: 'object',
                  properties: {
                    dark: {
                      type: 'string',
                    },
                    light: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('posts', schema)).toStrictEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          hero: {
            id: '#posts/hero',
            type: 'object',
            title: 'Hero',
            children: {
              title: {
                id: '#posts/hero/title',
                type: 'string',
                title: 'Title',
              },
              description: {
                id: '#posts/hero/description',
                type: 'string',
                title: 'Description',
              },
              image: {
                id: '#posts/hero/image',
                type: 'object',
                title: 'Image',
                children: {
                  dark: {
                    id: '#posts/hero/image/dark',
                    type: 'string',
                    title: 'Dark',
                  },
                  light: {
                    id: '#posts/hero/image/light',
                    type: 'string',
                    title: 'Light',
                  },
                },
              },
            },
          },
        },
      },
    })
  })

  test('handle date and datetime types', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            date: {
              type: 'date',
            },
            datetime: {
              type: 'datetime',
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('posts', schema)).toStrictEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          date: {
            id: '#posts/date',
            type: 'date',
            title: 'Date',
          },
          datetime: {
            id: '#posts/datetime',
            type: 'datetime',
            title: 'Datetime',
          },
        },
      },
    })
  })

  test('handle textarea type', () => {
    const schema: Draft07 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/posts',
      definitions: {
        posts: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              $content: {
                editor: {
                  input: 'textarea',
                },
              },
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    }

    expect(buildFormTreeFromSchema('posts', schema)).toStrictEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          description: {
            id: '#posts/description',
            type: 'textarea', // Verifies your new type is correctly assigned
            title: 'Description',
          },
        },
      },
    })
  })
})

describe('applyValuesToFormTree', () => {
  test('ensure all exsisting props values are applied (from schema)', () => {
    const data = {
      title: 'Exploring the Culinary Wonders of Asia',
      description: 'Embark on a tantalizing expedition through the diverse and enchanting flavors of Asia ',
      image: { src: 'https://picsum.photos/id/490/640/360' },
      authors: ['alexia-wong'],
      badge: { label: 'Cooking' },
    }

    const form = buildFormTreeFromSchema('posts', postsSchema)

    expect(applyValuesToFormTree(form, { posts: data })).toEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          title: {
            id: '#posts/title',
            type: 'string',
            title: 'Title',
            value: 'Exploring the Culinary Wonders of Asia',
          },
          description: {
            id: '#posts/description',
            type: 'string',
            title: 'Description',
            value: 'Embark on a tantalizing expedition through the diverse and enchanting flavors of Asia ',
          },
          image: {
            id: '#posts/image',
            required: true,
            type: 'object',
            title: 'Image',
            children: {
              src: {
                id: '#posts/image/src',
                required: true,
                type: 'string',
                title: 'Src',
                value: 'https://picsum.photos/id/490/640/360',
              },
              alt: {
                id: '#posts/image/alt',
                required: true,
                type: 'string',
                title: 'Alt',
                value: '',
              },
            },
          },
          authors: {
            id: '#posts/authors',
            required: true,
            type: 'array',
            title: 'Authors',
            value: ['alexia-wong'],
            arrayItemForm: {
              id: '#authors/items',
              title: 'Items',
              type: 'object',
              children: {
                avatar: {
                  children: {
                    alt: {
                      id: '#authors/items/avatar/alt',
                      required: true,
                      title: 'Alt',
                      type: 'string',
                    },
                    src: {
                      id: '#authors/items/avatar/src',
                      required: true,
                      title: 'Src',
                      type: 'string',
                    },
                  },
                  id: '#authors/items/avatar',
                  required: true,
                  title: 'Avatar',
                  type: 'object',
                },
                name: {
                  id: '#authors/items/name',
                  required: true,
                  title: 'Name',
                  type: 'string',
                },
                slug: {
                  id: '#authors/items/slug',
                  required: true,
                  title: 'Slug',
                  type: 'string',
                },
                to: {
                  id: '#authors/items/to',
                  required: true,
                  title: 'To',
                  type: 'string',
                },
              },
            },
          },
          date: {
            id: '#posts/date',
            required: true,
            type: 'date',
            title: 'Date',
            value: '',
          },
          badge: {
            id: '#posts/badge',
            required: true,
            title: 'Badge',
            type: 'object',
            children: {
              label: {
                id: '#posts/badge/label',
                required: true,
                title: 'Label',
                type: 'string',
                value: 'Cooking',
              },
              color: {
                id: '#posts/badge/color',
                required: true,
                title: 'Color',
                type: 'string',
                value: '',
              },
            },
          },
          navigation: {
            id: '#posts/navigation',
            title: 'Navigation',
            type: 'object',
            toggleable: true,
            children: {
              description: {
                id: '#posts/navigation/description',
                title: 'Description',
                type: 'string',
                value: '',
              },
              icon: {
                id: '#posts/navigation/icon',
                title: 'Icon',
                type: 'string',
                value: '',
              },
              title: {
                id: '#posts/navigation/title',
                title: 'Title',
                type: 'string',
                value: '',
              },
            },
          },
          seo: {
            id: '#posts/seo',
            title: 'Seo',
            type: 'object',
            children: {
              description: {
                id: '#posts/seo/description',
                title: 'Description',
                type: 'string',
                value: '',
              },
              title: {
                id: '#posts/seo/title',
                title: 'Title',
                type: 'string',
                value: '',
              },
            },
          },
        },
      },
    })
  })

  test('ensure all exsisting props values are applied (from tree)', () => {
    const data = {
      avatar: {
        src: 'https://avatars.githubusercontent.com/larbish',
      },
      name: 'Baptiste Leproux',
      to: 'https://x.com/_larbish',
      username: 'larbish',
    }

    expect(applyValuesToFormTree(farnabazFormTree, { authors: data })).toEqual(larbishFormTree)
  })
})

describe('applyValueById', () => {
  test('recursively traverses the object, finds the corresponding id, and updates the value', () => {
    const form: FormTree = {
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          hero: {
            id: '#posts/hero',
            type: 'object',
            title: 'Hero',
            children: {
              title: {
                id: '#posts/hero/title',
                type: 'string',
                title: 'Title',
                value: 'My title',
              },
              description: {
                id: '#posts/hero/description',
                type: 'string',
                title: 'Description',
                value: 'My description',
              },
              image: {
                id: '#posts/hero/image',
                type: 'object',
                title: 'Image',
                children: {
                  dark: {
                    id: '#posts/hero/image/dark',
                    type: 'string',
                    title: 'Dark',
                    value: 'My dark image',
                  },
                  light: {
                    id: '#posts/hero/image/light',
                    type: 'string',
                    title: 'Light',
                    value: 'My old light image',
                  },
                },
              },
            },
          },
        },
      },
    }

    expect(applyValueById(form, '#posts/hero/image/light', 'My new light image')).toEqual({
      posts: {
        id: '#posts',
        type: 'object',
        title: 'Posts',
        children: {
          hero: {
            id: '#posts/hero',
            type: 'object',
            title: 'Hero',
            children: {
              title: {
                id: '#posts/hero/title',
                type: 'string',
                title: 'Title',
                value: 'My title',
              },
              description: {
                id: '#posts/hero/description',
                type: 'string',
                title: 'Description',
                value: 'My description',
              },
              image: {
                id: '#posts/hero/image',
                type: 'object',
                title: 'Image',
                children: {
                  dark: {
                    id: '#posts/hero/image/dark',
                    type: 'string',
                    title: 'Dark',
                    value: 'My dark image',
                  },
                  light: {
                    id: '#posts/hero/image/light',
                    type: 'string',
                    title: 'Light',
                    value: 'My new light image',
                  },
                },
              },
            },
          },
        },
      },
    })
  })
})

describe('getUpdatedTreeItem', () => {
  test('finds and returns the updated leaf item in a nested form tree', () => {
    const updatedAvatarSrc: FormItem = {
      id: '#authors/avatar/src',
      title: 'Src',
      type: 'string',
      value: 'https://avatars.githubusercontent.com/larbish',
    }

    const original: FormTree = farnabazFormTree
    const updated: FormTree = {
      authors: {
        id: '#authors',
        type: 'object',
        title: 'Authors',
        children: {
          ...farnabazFormTree.authors.children,
          avatar: {
            ...farnabazFormTree.authors.children!.avatar,
            children: {
              ...farnabazFormTree.authors.children!.avatar.children,
              src: updatedAvatarSrc,
            },
          },
        },
      },
    }

    expect(getUpdatedTreeItem(original, updated)).toEqual(updatedAvatarSrc)
  })

  test('returns null when no changes are found', () => {
    expect(getUpdatedTreeItem(farnabazFormTree, farnabazFormTree)).toBeNull()
  })
})

describe('required fields', () => {
  const schemaWith = (properties: Record<string, unknown>, required: string[]): Draft07 => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    $ref: '#/definitions/authors',
    definitions: {
      authors: {
        type: 'object',
        properties,
        required,
        additionalProperties: false,
      },
    } as Draft07['definitions'],
  })

  test('mark keys listed in the parent `required` array', () => {
    const tree = buildFormTreeFromSchema('authors', schemaWith({
      name: { type: 'string' },
      bio: { type: 'string' },
      avatar: {
        type: 'object',
        properties: { src: { type: 'string' }, alt: { type: 'string' } },
        required: ['src'],
      },
    }, ['name', 'avatar']))

    const children = tree.authors.children!
    expect(children.name.required).toBe(true)
    expect(children.bio.required).toBeUndefined()
    expect(children.avatar.required).toBe(true)
    expect(children.avatar.children!.src.required).toBe(true)
    expect(children.avatar.children!.alt.required).toBeUndefined()
  })

  test('do not mark children of optional objects as required', () => {
    const tree = buildFormTreeFromSchema('authors', schemaWith({
      image: {
        type: 'object',
        properties: { src: { type: 'string' } },
        required: ['src'],
      },
      navigation: {
        anyOf: [
          { type: 'boolean' },
          { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] },
        ],
        default: true,
      },
      links: {
        type: 'array',
        items: { type: 'object', properties: { to: { type: 'string' } }, required: ['to'] },
      },
    }, []))

    const children = tree.authors.children!
    expect(children.image.children!.src.required).toBeUndefined()
    expect(children.navigation.children!.title.required).toBeUndefined()
    expect(children.links.arrayItemForm!.children!.to.required).toBe(true)
  })

  test('do not mark nullable keys as required', () => {
    const tree = buildFormTreeFromSchema('authors', schemaWith({
      nick: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      handle: { type: ['string', 'null'] },
    }, ['nick', 'handle']))

    expect(tree.authors.children!.nick.required).toBeUndefined()
    expect(tree.authors.children!.handle.required).toBeUndefined()
  })

  test('do not mark keys with a default value as required', () => {
    const tree = buildFormTreeFromSchema('authors', schemaWith({
      role: { type: 'string', enum: ['creator', 'contributor'], default: 'contributor' },
    }, ['role']))

    expect(tree.authors.children!.role.required).toBeUndefined()
  })

  test('pass `required` through `anyOf` properties', () => {
    const tree = buildFormTreeFromSchema('authors', schemaWith({
      website: { anyOf: [{ type: 'string' }, { type: 'number' }] },
    }, ['website']))

    expect(tree.authors.children!.website.required).toBe(true)
  })

  test('do not mark title and description of page collections as required', () => {
    const tree = buildFormTreeFromSchema('authors', schemaWith({
      title: { type: 'string' },
      description: { type: 'string' },
      body: { type: 'object', properties: {} },
      layout: { type: 'string' },
    }, ['title', 'description', 'body', 'layout']))

    expect(tree.authors.children!.title.required).toBeUndefined()
    expect(tree.authors.children!.description.required).toBeUndefined()
    expect(tree.authors.children!.layout.required).toBe(true)
  })

  test('keep title and description required for data collections', () => {
    const tree = buildFormTreeFromSchema('authors', schemaWith({
      title: { type: 'string' },
    }, ['title']))

    expect(tree.authors.children!.title.required).toBe(true)
  })

  test('keep falsy values when applying values to the tree', () => {
    const tree = buildFormTreeFromSchema('authors', schemaWith({
      order: { type: 'number' },
      active: { type: 'boolean' },
    }, ['order']))

    const children = applyValuesToFormTree(tree, { authors: { order: 0, active: false } }).authors.children!
    expect(children.order.value).toBe(0)
    expect(children.active.value).toBe(false)
  })

  test('detect missing required values', () => {
    const item = (type: FormItem['type'], required = true): FormItem => ({ id: '#a', title: 'A', type, required })

    expect(isMissingRequiredValue(item('string'), '')).toBe(true)
    expect(isMissingRequiredValue(item('string'), '  ')).toBe(false)
    expect(isMissingRequiredValue(item('string'), undefined)).toBe(true)
    expect(isMissingRequiredValue(item('string'), 'Jane')).toBe(false)
    expect(isMissingRequiredValue(item('number'), 0)).toBe(false)
    expect(isMissingRequiredValue(item('number'), '')).toBe(true)
    expect(isMissingRequiredValue(item('boolean'), undefined)).toBe(false)
    expect(isMissingRequiredValue(item('object'), undefined)).toBe(false)
    expect(isMissingRequiredValue(item('string', false), '')).toBe(false)
  })
})
