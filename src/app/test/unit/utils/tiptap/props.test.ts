import { expect, test, describe } from 'vitest'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { JSType } from 'untyped'
import type { PropertyMeta } from 'vue-component-meta'
import { buildAttrs, buildFormTreeFromProps, convertStringToArray, convertStringToValue, normalizeProps } from '../../../../src/utils/tiptap/props'
import { buttonPropsSchema, iconPropsSchema } from '../../../mocks/props'
import type { ComponentMeta } from '../../../../src/types/component'

describe('props', () => {
  describe('convertStringToArray', () => {
    test('should convert string to array', () => {
      // eslint-disable-next-line no-useless-escape
      expect(convertStringToArray('\"horizontal\" | \"vertical\" | undefined')).toEqual(['horizontal', 'vertical'])
    })
  })

  describe('convertStringToValue', () => {
    test('should convert multiple types of strings to value', () => {
      // String type tests
      expect(convertStringToValue('\'vertical\'', 'string')).toEqual('vertical')
      expect(convertStringToValue('"horizontal"', 'string')).toEqual('horizontal')
      expect(convertStringToValue('plain text', 'string')).toEqual('plain text')
      expect(convertStringToValue('', 'string')).toEqual('')

      // Boolean type tests
      expect(convertStringToValue('true', 'boolean')).toEqual(true)
      expect(convertStringToValue('false', 'boolean')).toEqual(false)
      expect(convertStringToValue('invalid', 'boolean')).toEqual(false)
      expect(convertStringToValue('', 'boolean')).toEqual(false)

      // Number type tests
      expect(convertStringToValue('100', 'number')).toEqual(100)
      expect(convertStringToValue('-50', 'number')).toEqual(-50)
      expect(convertStringToValue('0', 'number')).toEqual(0)
      expect(convertStringToValue('invalid', 'number')).toEqual(null)
      expect(convertStringToValue('', 'number')).toEqual(null)

      // Object type tests
      expect(convertStringToValue('{"key": "value"}', 'object')).toEqual({ key: 'value' })
      expect(convertStringToValue('{"number": 42, "boolean": true}', 'object')).toEqual({ number: 42, boolean: true })
      expect(convertStringToValue('{"array": [1, 2, 3]}', 'object')).toEqual({ array: [1, 2, 3] })
      expect(convertStringToValue('invalid json', 'object')).toEqual({})
      expect(convertStringToValue('', 'object')).toEqual({})

      // Default case (unknown type)
      expect(convertStringToValue('any value', 'array' as JSType)).toEqual([])
    })
  })

  describe('buildFormTreeFromProps', () => {
    const createComponentMeta = (props: PropertyMeta[], options: { nuxtUI?: boolean } = {}): ComponentMeta => ({
      name: 'TestComponent',
      path: '/path/to/component',
      nuxtUI: options.nuxtUI ?? false,
      meta: {
        props,
        slots: [],
        events: [],
      },
    })

    test('generate JSType props from meta', () => {
      const props: PropertyMeta[] = [
        {
          name: 'as',
          global: false,
          description: 'The element or component this component should render as.',
          tags: [
            {
              name: 'defaultValue',
              text: '\'div\'',
            },
          ],
          required: false,
          type: 'any',
          schema: 'any',
          declarations: [],
          getDeclarations: () => [],
          getTypeObject: {} as never,
        },
        {
          name: 'name',
          global: false,
          description: '',
          tags: [],
          required: false,
          type: 'string | undefined',
          schema: {
            kind: 'enum',
            type: 'string | undefined',
            schema: ['undefined', 'string'],
          },
          declarations: [],
          getDeclarations: () => [],
          getTypeObject: {} as never,
        },
        {
          name: 'orientation',
          global: false,
          description: 'The orientation of the page hero.',
          tags: [
            {
              name: 'defaultValue',
              text: '\'vertical\'',
            },
          ],
          required: false,
          type: '"horizontal" | "vertical" | undefined',
          schema: {
            kind: 'enum',
            type: '"horizontal" | "vertical" | undefined',
            schema: ['undefined', 'horizontal', 'vertical'],
          },
          default: '"vertical"',
          declarations: [],
          getDeclarations: () => [],
          getTypeObject: {} as never,
        },
        {
          name: 'reverse',
          global: false,
          description: 'Reverse the order of the default slot.',
          tags: [
            {
              name: 'defaultValue',
              text: 'false',
            },
          ],
          required: false,
          type: 'boolean | undefined',
          schema: {
            kind: 'enum',
            type: 'boolean | undefined',
            schema: ['undefined', 'true', 'false'],
          },
          declarations: [],
          getDeclarations: () => [],
          getTypeObject: {} as never,
        },
        {
          name: 'ui',
          global: false,
          description: '',
          tags: [],
          required: false,
          type: 'Partial<{ root: string; container: string; wrapper: string; headline: string; title: string; description: string; links: string; }> | undefined',
          schema: {
            kind: 'enum',
            type: 'Partial<{ root: string; container: string; wrapper: string; headline: string; title: string; description: string; links: string; }> | undefined',
            schema: ['undefined', 'Partial<{ root: string; container: string; wrapper: string; headline: string; title: string; description: string; links: string; }>'],
          },
          declarations: [],
          getDeclarations: () => [],
          getTypeObject: {} as never,
        },
        {
          name: 'to',
          global: false,
          description: 'Route Location the link should navigate to when clicked on.',
          tags: [],
          required: false,
          type: 'string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric | undefined',
          schema: {
            kind: 'enum',
            type: 'string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric | undefined',
            schema: [
              'undefined',
              'string',
              {
                kind: 'object',
                type: 'RouteLocationAsRelativeGeneric',
                schema: {
                  name: {
                    name: 'name',
                    global: false,
                    description: '',
                    tags: [],
                    required: false,
                    type: 'RouteRecordNameGeneric',
                    schema: {
                      kind: 'enum',
                      type: 'RouteRecordNameGeneric',
                      schema: ['undefined', 'string', 'symbol'],
                    },
                    declarations: [],
                    getDeclarations: () => [],
                    getTypeObject: {} as never,
                  },
                },
              },
            ],
          },
          declarations: [],
          getDeclarations: () => [],
          getTypeObject: {} as never,
        },
        {
          name: 'target',
          global: false,
          description: 'Where to display the linked URL, as the name for a browsing context.',
          tags: [],
          required: false,
          type: '"_blank" | "_parent" | "_self" | "_top" | (string & {}) | null | undefined',
          schema: {
            kind: 'enum',
            type: '"_blank" | "_parent" | "_self" | "_top" | (string & {}) | null | undefined',
            schema: [
              'undefined',
              'null',
              '"_blank"',
              '"_parent"',
              '"_self"',
              '"_top"',
              {
                kind: 'object',
                type: 'string & {}',
                schema: {},
              },
            ],
          },
          declarations: [],
          getDeclarations: () => [],
          getTypeObject: {} as never,
        },
      ]

      // Without Overriding
      const emptyNode = {
        type: {
          name: 'element',
        },
        attrs: {
          tag: 'UPageHero',
          props: {},
        },
      } as unknown as ProseMirrorNode

      expect(buildFormTreeFromProps(emptyNode, createComponentMeta(props, { nuxtUI: true }))).toEqual({
        'as': {
          id: '#u_pagehero/as',
          key: 'as',
          title: 'As',
          value: 'div',
          custom: false,
          type: 'string',
          default: 'div',
          hidden: true,
        },
        'name': {
          id: '#u_pagehero/name',
          key: 'name',
          title: 'Name',
          value: '',
          custom: false,
          type: 'string',
          default: '',
        },
        'orientation': {
          id: '#u_pagehero/orientation',
          key: 'orientation',
          title: 'Orientation',
          value: 'vertical',
          custom: false,
          type: 'string',
          default: 'vertical',
          options: ['horizontal', 'vertical'],
        },
        ':reverse': {
          id: '#u_pagehero/:reverse',
          key: ':reverse',
          title: 'Reverse',
          value: false,
          custom: false,
          type: 'boolean',
          default: false,
        },
        ':ui': {
          id: '#u_pagehero/:ui',
          key: ':ui',
          title: 'Ui',
          value: {},
          default: {},
          custom: false,
          type: 'object',
          hidden: true,
        },
        'to': {
          id: '#u_pagehero/to',
          key: 'to',
          title: 'To',
          value: '',
          custom: false,
          type: 'string',
          default: '',
        },
        'target': {
          id: '#u_pagehero/target',
          key: 'target',
          title: 'Target',
          value: '',
          custom: false,
          type: 'string',
          default: '',
          options: ['_blank', '_parent', '_self', '_top'],
        },
      })

      // With Overriding
      const node = {
        type: {
          name: 'element',
        },
        attrs: {
          tag: 'UPageHero',
          props: {
            'as': 'h1',
            'name': 'Hello World',
            'orientation': 'horizontal',
            ':reverse': true,
            'ui': {
              root: 'bg-white',
              container: 'max-w-7xl',
            },
            'target': '_blank',
          },
        },
      } as unknown as ProseMirrorNode

      expect(buildFormTreeFromProps(node, createComponentMeta(props, { nuxtUI: true }))).toEqual({
        'as': {
          id: '#u_pagehero/as',
          key: 'as',
          title: 'As',
          value: 'h1',
          custom: false,
          type: 'string',
          default: 'div',
          hidden: true,
        },
        'name': {
          id: '#u_pagehero/name',
          key: 'name',
          title: 'Name',
          value: 'Hello World',
          custom: false,
          type: 'string',
          default: '',
        },
        'orientation': {
          id: '#u_pagehero/orientation',
          key: 'orientation',
          title: 'Orientation',
          value: 'horizontal',
          custom: false,
          type: 'string',
          default: 'vertical',
          options: ['horizontal', 'vertical'],
        },
        ':reverse': {
          id: '#u_pagehero/:reverse',
          key: ':reverse',
          title: 'Reverse',
          value: true,
          custom: false,
          type: 'boolean',
          default: false,
        },
        ':ui': {
          id: '#u_pagehero/:ui',
          key: ':ui',
          title: 'Ui',
          value: {
            root: 'bg-white',
            container: 'max-w-7xl',
          },
          default: {},
          custom: false,
          type: 'object',
          hidden: true,
        },
        'to': {
          id: '#u_pagehero/to',
          key: 'to',
          title: 'To',
          value: '',
          custom: false,
          type: 'string',
          default: '',
        },
        'target': {
          id: '#u_pagehero/target',
          key: 'target',
          title: 'Target',
          value: '_blank',
          custom: false,
          type: 'string',
          default: '',
          options: ['_blank', '_parent', '_self', '_top'],
        },
      })
    })

    test('generate UButton props from meta', () => {
      const props: PropertyMeta[] = [
        buttonPropsSchema.label,
        buttonPropsSchema.color,
        buttonPropsSchema.block,
        buttonPropsSchema.activeClass,
      ]

      const node = {
        type: {
          name: 'element',
        },
        attrs: {
          tag: 'UButton',
          props: {},
        },
      } as unknown as ProseMirrorNode

      expect(buildFormTreeFromProps(node, createComponentMeta(props, { nuxtUI: true }))).toEqual({
        'label': {
          id: '#u_button/label',
          key: 'label',
          title: 'Label',
          value: '',
          custom: false,
          type: 'string',
          default: '',
        },
        'color': {
          id: '#u_button/color',
          key: 'color',
          title: 'Color',
          value: 'primary',
          custom: false,
          type: 'string',
          default: 'primary',
          options: ['error', 'primary', 'secondary', 'success', 'info', 'warning', 'neutral'],
        },
        ':block': {
          id: '#u_button/:block',
          key: ':block',
          title: 'Block',
          value: false,
          custom: false,
          type: 'boolean',
          default: false,
        },
        'activeClass': {
          id: '#u_button/activeClass',
          key: 'activeClass',
          title: 'ActiveClass',
          value: '',
          custom: false,
          type: 'string',
          default: '',
          hidden: true,
        },
      })
    })

    test('generate UIcon props from meta', () => {
      const props: PropertyMeta[] = [
        iconPropsSchema.name,
        iconPropsSchema.mode,
        iconPropsSchema.size,
        iconPropsSchema.customize,
      ]

      const node = {
        type: {
          name: 'element',
        },
        attrs: {
          tag: 'UIcon',
          props: {},
        },
      } as unknown as ProseMirrorNode

      expect(buildFormTreeFromProps(node, createComponentMeta(props, { nuxtUI: true }))).toEqual({
        name: {
          id: '#u_icon/name',
          key: 'name',
          title: 'Name',
          value: '',
          custom: false,
          type: 'string',
          default: '',
        },
        mode: {
          id: '#u_icon/mode',
          key: 'mode',
          title: 'Mode',
          value: '',
          custom: false,
          type: 'string',
          default: '',
          options: ['svg', 'css'],
        },
        size: {
          id: '#u_icon/size',
          key: 'size',
          title: 'Size',
          value: '',
          custom: false,
          type: 'string',
          default: '',
        },
        customize: {
          id: '#u_icon/customize',
          key: 'customize',
          title: 'Customize',
          value: '',
          default: '',
          custom: false,
          type: 'string',
          hidden: true,
        },
      })
    })

    test('generate object props from meta', () => {
      const props = [
        {
          name: 'avatar',
          global: false,
          description: 'Display an avatar on the left side.',
          tags: [],
          required: false,
          type: 'AvatarProps | undefined',
          schema: {
            kind: 'enum',
            type: 'AvatarProps | undefined',
            schema: [
              'undefined',
              {
                kind: 'object',
                type: 'AvatarProps',
                schema: {
                  src: {
                    name: 'src',
                    global: false,
                    description: '',
                    tags: [],
                    required: false,
                    type: 'string | undefined',
                    schema: {
                      kind: 'enum',
                      type: 'string | undefined',
                      schema: ['undefined', 'string'],
                    },
                  },
                  icon: {
                    name: 'icon',
                    global: false,
                    description: '',
                    tags: [
                      {
                        name: 'IconifyIcon',
                      },
                    ],
                    required: false,
                    type: 'string | undefined',
                    schema: 'string | undefined',
                  },
                  ui: {
                    name: 'ui',
                    global: false,
                    description: '',
                    tags: [],
                    required: false,
                    type: 'Partial<{ root: string; image: string; fallback: string; icon: string; }> | undefined',
                    schema: {
                      kind: 'enum',
                      type: 'Partial<{ root: string; image: string; fallback: string; icon: string; }> | undefined',
                      schema: ['undefined', 'Partial<{ root: string; image: string; fallback: string; icon: string; }>'],
                    },
                  },
                },
              },
            ],
          },
        },
        {
          name: 'avatar2',
          global: false,
          description: 'Display an avatar on the left side.',
          tags: [],
          required: false,
          type: 'AvatarProps',
          schema: {
            kind: 'object',
            type: 'AvatarProps',
            schema: {
              src: {
                name: 'src',
                global: false,
                description: '',
                tags: [],
                required: false,
                type: 'string | undefined',
                schema: {
                  kind: 'enum',
                  type: 'string | undefined',
                  schema: ['undefined', 'string'],
                },
              },
              icon: {
                name: 'icon',
                global: false,
                description: '',
                tags: [
                  {
                    name: 'IconifyIcon',
                  },
                ],
                required: false,
                type: 'string | undefined',
                schema: 'string | undefined',
              },
            },
          },
        },
      ] as unknown as PropertyMeta[]

      // Without Overriding
      const emptyNode = {
        type: {
          name: 'element',
        },
        attrs: {
          tag: 'UPageHero',
          props: {},
        },
      } as unknown as ProseMirrorNode

      expect(buildFormTreeFromProps(emptyNode, createComponentMeta(props, { nuxtUI: true }))).toEqual({
        ':avatar': {
          id: '#u_pagehero/:avatar',
          key: ':avatar',
          type: 'object',
          title: 'Avatar',
          custom: false,
          value: {},
          default: {},
          children: {
            src: {
              id: '#u_pagehero/:avatar/src',
              key: 'src',
              title: 'Src',
              type: 'string',
              value: '',
              default: '',
              custom: false,
            },
            icon: {
              id: '#u_pagehero/:avatar/icon',
              key: 'icon',
              title: 'Icon',
              type: 'icon',
              value: '',
              default: '',
              custom: false,
            },
            ui: {
              id: '#u_pagehero/:avatar/ui',
              key: 'ui',
              title: 'Ui',
              value: '',
              default: '',
              custom: false,
              type: 'string',
              hidden: true,
            },
          },
        },
        ':avatar2': {
          id: '#u_pagehero/:avatar2',
          key: ':avatar2',
          type: 'object',
          title: 'Avatar2',
          custom: false,
          value: {},
          default: {},
          children: {
            src: {
              id: '#u_pagehero/:avatar2/src',
              key: 'src',
              title: 'Src',
              type: 'string',
              value: '',
              default: '',
              custom: false,
            },
            icon: {
              id: '#u_pagehero/:avatar2/icon',
              key: 'icon',
              title: 'Icon',
              type: 'icon',
              value: '',
              default: '',
              custom: false,
            },
          },
        },
      })

      // With Overriding
      const node = {
        type: {
          name: 'element',
        },
        attrs: {
          tag: 'UPageHero',
          props: {
            avatar: {
              src: 'https://example.com/avatar.png',
              icon: 'i-ph-user',
            },
          },
        },
      } as unknown as ProseMirrorNode

      expect(buildFormTreeFromProps(node, createComponentMeta(props, { nuxtUI: true }))).toEqual({
        ':avatar': {
          id: '#u_pagehero/:avatar',
          key: ':avatar',
          type: 'object',
          title: 'Avatar',
          custom: false,
          value: {
            src: 'https://example.com/avatar.png',
            icon: 'i-ph-user',
          },
          default: {},
          children: {
            src: {
              id: '#u_pagehero/:avatar/src',
              key: 'src',
              title: 'Src',
              type: 'string',
              value: 'https://example.com/avatar.png',
              default: '',
              custom: false,
            },
            icon: {
              id: '#u_pagehero/:avatar/icon',
              key: 'icon',
              title: 'Icon',
              type: 'icon',
              value: 'i-ph-user',
              default: '',
              custom: false,
            },
            ui: {
              id: '#u_pagehero/:avatar/ui',
              key: 'ui',
              title: 'Ui',
              value: '',
              default: '',
              custom: false,
              type: 'string',
              hidden: true,
            },
          },
        },
        ':avatar2': {
          id: '#u_pagehero/:avatar2',
          key: ':avatar2',
          type: 'object',
          title: 'Avatar2',
          custom: false,
          value: {},
          default: {},
          children: {
            src: {
              id: '#u_pagehero/:avatar2/src',
              key: 'src',
              title: 'Src',
              type: 'string',
              value: '',
              default: '',
              custom: false,
            },
            icon: {
              id: '#u_pagehero/:avatar2/icon',
              key: 'icon',
              title: 'Icon',
              type: 'icon',
              value: '',
              default: '',
              custom: false,
            },
          },
        },
      })
    })

    test('generate multiple level deep object/array props', () => {
      const props: PropertyMeta[] = [{
        name: 'links',
        global: false,
        description: 'Display a list of Button under the description.\n`{ size: \'xl\' }`{lang="ts-type"}',
        tags: [],
        required: false,
        type: 'ButtonProps[]',
        schema: {
          kind: 'array',
          type: 'ButtonProps[]',
          schema: [{
            kind: 'object',
            type: 'ButtonProps',
            schema: {
              label: {
                name: 'label',
                global: false,
                description: '',
                tags: [],
                required: false,
                type: 'string',
                schema: 'string',
                declarations: [],
                getDeclarations: () => [],
                getTypeObject: {} as never,
              },
              size: {
                name: 'size',
                global: false,
                description: '',
                tags: [
                  {
                    name: 'defaultValue',
                    text: '\'md\'',
                  },
                ],
                required: false,
                type: '"xs" | "sm" | "md" | "lg" | "xl"',
                schema: {
                  kind: 'enum',
                  type: '"xs" | "sm" | "md" | "lg" | "xl"',
                  schema: ['"xs"', '"sm"', '"md"', '"lg"', '"xl"'],
                },
                declarations: [],
                getDeclarations: () => [],
                getTypeObject: {} as never,
              },
              avatar: {
                name: 'avatar',
                global: false,
                description: 'Display an avatar on the left side.',
                tags: [],
                required: false,
                type: 'AvatarProps',
                schema: {
                  kind: 'object',
                  type: 'AvatarProps',
                  schema: {
                    as: {
                      name: 'as',
                      global: false,
                      description: 'The element or component this component should render as.',
                      tags: [
                        {
                          name: 'defaultValue',
                          text: '\'span\'',
                        },
                      ],
                      required: false,
                      type: 'any',
                      schema: 'any',
                      declarations: [],
                      getDeclarations: () => [],
                      getTypeObject: {} as never,
                    },
                    src: {
                      name: 'src',
                      global: false,
                      description: '',
                      tags: [],
                      required: false,
                      type: 'string',
                      schema: 'string',
                      declarations: [],
                      getDeclarations: () => [],
                      getTypeObject: {} as never,
                    },
                  },
                },
                declarations: [],
                getDeclarations: () => [],
                getTypeObject: {} as never,
              },
            },
          }],
        },
        declarations: [],
        getDeclarations: () => [],
        getTypeObject: {} as never,
      }]

      const node = {
        type: {
          name: 'element',
        },
        attrs: {
          tag: 'Button',
          props: {},
        },
      } as unknown as ProseMirrorNode

      expect(buildFormTreeFromProps(node, createComponentMeta(props))).toEqual({
        ':links': {
          id: '#button/:links',
          key: ':links',
          title: 'Links',
          value: [],
          type: 'array',
          custom: false,
          default: [],
          arrayItemForm: {
            id: '#array/items',
            type: 'object',
            title: 'Items',
            children: {
              label: {
                id: '#array/items/label',
                key: 'label',
                title: 'Label',
                type: 'string',
                value: '',
                default: '',
                custom: false,
              },
              size: {
                id: '#array/items/size',
                key: 'size',
                title: 'Size',
                type: 'string',
                value: 'md',
                default: 'md',
                custom: false,
                options: ['xs', 'sm', 'md', 'lg', 'xl'],
              },
              avatar: {
                id: '#array/items/avatar',
                key: 'avatar',
                title: 'Avatar',
                type: 'object',
                value: {},
                default: {},
                custom: false,
                children: {
                  as: {
                    id: '#array/items/avatar/as',
                    key: 'as',
                    title: 'As',
                    type: 'string',
                    value: 'span',
                    default: 'span',
                    custom: false,
                  },
                  src: {
                    id: '#array/items/avatar/src',
                    key: 'src',
                    title: 'Src',
                    type: 'string',
                    value: '',
                    default: '',
                    custom: false,
                  },
                },
              },
            },
          },
        },
      })
    })

    test('generate array of object prop from meta case one (schema is directly defined as an array of object)', () => {
      const props: PropertyMeta[] = [{
        name: 'features',
        global: false,
        description: '',
        tags: [],
        required: true,
        type: '{ label: string; content: string; }[]',
        schema: {
          kind: 'array',
          type: '{ label: string; content: string; }[]',
          schema: [
            {
              kind: 'object',
              type: '{ label: string; content: string; }',
              schema: {
                label: {
                  name: 'label',
                  global: false,
                  description: '',
                  tags: [],
                  required: true,
                  type: 'string',
                  schema: 'string',
                  declarations: [],
                  getDeclarations: () => [],
                  getTypeObject: {} as never,
                },
                content: {
                  name: 'content',
                  global: false,
                  description: '',
                  tags: [],
                  required: true,
                  type: 'string',
                  schema: 'string',
                  declarations: [],
                  getDeclarations: () => [],
                  getTypeObject: {} as never,
                },
                ui: {
                  name: 'ui',
                  global: false,
                  description: '',
                  tags: [],
                  required: false,
                  type: 'Partial<{ root: string; image: string; fallback: string; icon: string; }> | undefined',
                  schema: {
                    kind: 'enum',
                    type: 'Partial<{ root: string; image: string; fallback: string; icon: string; }> | undefined',
                    schema: ['undefined', 'Partial<{ root: string; image: string; fallback: string; icon: string; }>'],
                  },
                  declarations: [],
                  getDeclarations: () => [],
                  getTypeObject: {} as never,
                },
              },
            },
          ],
        },
        declarations: [],
        getDeclarations: () => [],
        getTypeObject: {} as never,
      }]

      const node = {
        type: {
          name: 'element',
        },
        attrs: {
          tag: 'TemplateFeatures',
          props: {},
        },
      } as unknown as ProseMirrorNode

      expect(buildFormTreeFromProps(node, createComponentMeta(props))).toEqual({
        ':features': {
          id: '#templatefeatures/:features',
          key: ':features',
          title: 'Features',
          value: [],
          type: 'array',
          custom: false,
          default: [],
          arrayItemForm: {
            id: '#array/items',
            type: 'object',
            title: 'Items',
            children: {
              label: {
                id: '#array/items/label',
                key: 'label',
                title: 'Label',
                type: 'string',
                value: '',
                default: '',
                custom: false,
              },
              content: {
                id: '#array/items/content',
                key: 'content',
                title: 'Content',
                type: 'string',
                value: '',
                default: '',
                custom: false,
              },
              ui: {
                id: '#array/items/ui',
                key: 'ui',
                title: 'Ui',
                value: '',
                default: '',
                custom: false,
                type: 'string',
              },
            },
          },
        },
      })
    })

    test('generate array of object prop from meta case two (schema is an enum object containing an array of object)', () => {
      const props: PropertyMeta[] = [{
        name: 'links',
        global: false,
        description: '',
        tags: [],
        required: false,
        type: 'ButtonProps[] | undefined',
        schema: {
          kind: 'enum',
          type: 'ButtonProps[] | undefined',
          schema: [
            'undefined',
            {
              kind: 'array',
              type: 'ButtonProps[]',
              schema: [
                {
                  kind: 'object',
                  type: 'ButtonProps',
                  schema: {
                    label: buttonPropsSchema.label,
                    color: buttonPropsSchema.color,
                    block: buttonPropsSchema.block,
                    activeClass: buttonPropsSchema.activeClass,
                  },
                },
              ],
            },
          ],
        },
        declarations: [],
        getDeclarations: () => [],
        getTypeObject: {} as never,
      }]

      const node = {
        type: {
          name: 'element',
        },
        attrs: {
          tag: 'UButton',
          props: {},
        },
      } as unknown as ProseMirrorNode

      expect(buildFormTreeFromProps(node, createComponentMeta(props, { nuxtUI: true }))).toEqual({
        ':links': {
          id: '#u_button/:links',
          key: ':links',
          title: 'Links',
          value: [],
          type: 'array',
          custom: false,
          default: [],
          arrayItemForm: {
            id: '#array/items',
            type: 'object',
            title: 'Items',
            children: {
              label: {
                id: '#array/items/label',
                key: 'label',
                title: 'Label',
                type: 'string',
                value: '',
                default: '',
                custom: false,
              },
              color: {
                id: '#array/items/color',
                key: 'color',
                title: 'Color',
                type: 'string',
                value: 'primary',
                default: 'primary',
                options: ['error', 'primary', 'secondary', 'success', 'info', 'warning', 'neutral'],
                custom: false,
              },
              block: {
                id: '#array/items/block',
                key: 'block',
                title: 'Block',
                type: 'boolean',
                value: false,
                default: false,
                custom: false,
              },
              activeClass: {
                id: '#array/items/activeClass',
                key: 'activeClass',
                title: 'ActiveClass',
                type: 'string',
                value: '',
                default: '',
                custom: false,
                hidden: true,
              },
            },
          },
        },
      })
    })

    test('generate array of string prop from meta', () => {
      const props: PropertyMeta[] = [{
        name: 'names',
        global: false,
        description: '',
        tags: [],
        required: true,
        type: 'string[]',
        schema: {
          kind: 'array',
          type: 'string[]',
          schema: ['string'],
        },
        declarations: [],
        getDeclarations: () => [],
        getTypeObject: {} as never,
      }]

      const node = {
        type: {
          name: 'element',
        },
        attrs: {
          tag: 'Authors',
          props: {},
        },
      } as unknown as ProseMirrorNode

      expect(buildFormTreeFromProps(node, createComponentMeta(props))).toEqual({
        ':names': {
          id: '#authors/:names',
          key: ':names',
          title: 'Names',
          value: [],
          type: 'array',
          custom: false,
          default: [],
          arrayItemForm: {
            id: '#array/items',
            type: 'string',
            title: 'Items',
          },
        },
      })
    })

    test('generate prop not present in meta', () => {
      const props: PropertyMeta[] = []

      const node = {
        type: {
          name: 'element',
        },
        attrs: {
          tag: 'Unicorn',
          props: {
            as: 'h1',
          },
        },
      } as unknown as ProseMirrorNode

      expect(buildFormTreeFromProps(node, createComponentMeta(props))).toEqual({
        as: {
          id: '#unicorn/as', // should not cointain _ since it's not ui component
          key: 'as',
          title: 'As',
          value: 'h1',
          custom: true,
          disabled: false,
          type: 'string',
        },
      })
    })

    // test('generate props for video component', () => {
    //   const props: PropertyMeta[] = []

    //   const node = {
    //     type: {
    //       name: 'video',
    //     },
    //     attrs: {
    //       tag: 'video',
    //       props: {
    //         ':autoplay': 'true',
    //         ':controls': 'true',
    //         ':loop': 'true',
    //         'poster': '/assets/home/videos/HomeNotionLikePoster.webp',
    //         'src': 'https://res.cloudinary.com/nuxt/video/upload/v1733494722/contentv3final_rc8bvu.mp4',
    //       },
    //     },
    //   } as unknown as ProseMirrorNode

    //   // When props array is empty, custom props from node are added
    //   expect(buildFormTreeFromProps(node, props)).toEqual({
    //     'src': {
    //       id: '#video/src',
    //       key: 'src',
    //       title: 'Src',
    //       value: 'https://res.cloudinary.com/nuxt/video/upload/v1733494722/contentv3final_rc8bvu.mp4',
    //       type: 'string',
    //       custom: true,
    //       disabled: false,
    //     },
    //     ':autoplay': {
    //       id: '#video/:autoplay',
    //       key: ':autoplay',
    //       title: 'Autoplay',
    //       value: 'true',
    //       type: 'string',
    //       custom: true,
    //       disabled: false,
    //     },
    //     ':controls': {
    //       id: '#video/:controls',
    //       key: ':controls',
    //       title: 'Controls',
    //       value: 'true',
    //       type: 'string',
    //       custom: true,
    //       disabled: false,
    //     },
    //     ':loop': {
    //       id: '#video/:loop',
    //       key: ':loop',
    //       title: 'Loop',
    //       value: 'true',
    //       type: 'string',
    //       custom: true,
    //       disabled: false,
    //     },
    //     'poster': {
    //       id: '#video/poster',
    //       key: 'poster',
    //       title: 'Poster',
    //       value: '/assets/home/videos/HomeNotionLikePoster.webp',
    //       type: 'string',
    //       custom: true,
    //       disabled: false,
    //     },
    //   })
    // })

    // test('generate props for image component', () => {
    //   const props: PropertyMeta[] = []

    //   // Without overriding - empty props result in empty formTree
    //   const emptyNode = {
    //     type: {
    //       name: 'image',
    //     },
    //     attrs: {
    //       tag: 'image',
    //       props: {},
    //     },
    //   } as unknown as ProseMirrorNode

    //   expect(buildFormTreeFromProps(emptyNode, props)).toEqual({})

    //   // With overriding - custom props from node are added
    //   const node = {
    //     type: {
    //       name: 'image',
    //     },
    //     attrs: {
    //       tag: 'image',
    //       props: {
    //         alt: 'Alt value',
    //         src: '/image.webp',
    //       },
    //     },
    //   } as unknown as ProseMirrorNode

    //   expect(buildFormTreeFromProps(node, props)).toEqual({
    //     alt: {
    //       id: '#image/alt',
    //       key: 'alt',
    //       title: 'Alt',
    //       value: 'Alt value',
    //       type: 'string',
    //       custom: true,
    //       disabled: false,
    //     },
    //     src: {
    //       id: '#image/src',
    //       key: 'src',
    //       title: 'Src',
    //       value: '/image.webp',
    //       type: 'string',
    //       custom: true,
    //       disabled: false,
    //     },
    //   })
    // })
  })

  describe('normalizeProps', () => {
    test('passes array-of-objects values through unchanged', () => {
      const authors = [
        { name: 'John Doe', role: 'contributor', avatar: 'https://placehold.co/150' },
        { name: 'Jane Doe', role: 'creator', avatar: 'https://placehold.co/150' },
      ]
      expect(normalizeProps({ authorsOne: authors }, {})).toEqual({ authorsOne: authors })
    })

    test('passes plain object values through unchanged', () => {
      const config = { key1: 'value1', key2: 'value2' }
      expect(normalizeProps({ objectAttr: config }, {})).toEqual({ objectAttr: config })
    })

    test('passes array-of-primitives through unchanged', () => {
      const tags = ['important', 'archived', 'urgent']
      expect(normalizeProps({ tags }, {})).toEqual({ tags })
    })

    test('passes null through unchanged', () => {
      expect(normalizeProps({ optional: null }, {})).toEqual({ optional: null })
    })

    test('passes primitive values through unchanged (no stringification)', () => {
      // Values are already the correct type from comark parse — no coercion wanted
      expect(normalizeProps({ title: 'Hello', count: 42, enabled: true }, {})).toEqual({
        title: 'Hello',
        count: 42,
        enabled: true,
      })
    })

    test('passes className array through unchanged', () => {
      expect(normalizeProps({ className: ['foo', 'bar'] }, {})).toEqual({ className: ['foo', 'bar'] })
    })

    test('trims whitespace from keys', () => {
      expect(normalizeProps({ '  title  ': 'Hello' }, {})).toEqual({ title: 'Hello' })
    })

    test('drops empty and whitespace-only keys', () => {
      expect(normalizeProps({ '': 'a', '   ': 'b', 'valid': 'c' }, {})).toEqual({ valid: 'c' })
    })

    test('merges nodeProps and extraProps, extraProps wins on collision', () => {
      expect(normalizeProps({ a: 1, b: 2 }, { b: 99, c: 3 })).toEqual({ a: 1, b: 99, c: 3 })
    })
  })

  describe('buildAttrs', () => {
    test('preserves insertion order of input keys', () => {
      const out = buildAttrs({ 'src': 'a.mp4', 'poster': 'a.jpg', ':controls': 'true' })
      expect(Object.keys(out)).toEqual(['src', 'poster', ':controls'])
    })

    test('returns an empty object when input is nullish', () => {
      expect(buildAttrs(undefined)).toEqual({})
      expect(buildAttrs(null)).toEqual({})
    })

    test('applies transform to rename / re-value entries while keeping position', () => {
      const out = buildAttrs({ src: 'a.mp4', controls: true, poster: 'a.jpg' }, {
        transform: (key, value) => {
          if (key === 'controls') return value ? [':controls', 'true'] : null
          return [key, value]
        },
      })
      // controls keeps its slot (index 1) but is rewritten to `:controls: 'true'`
      expect(Object.keys(out)).toEqual(['src', ':controls', 'poster'])
      expect(out[':controls']).toBe('true')
    })

    test('drops entries when transform returns null', () => {
      const out = buildAttrs({ href: 'x', rel: 'noopener', target: '_blank' }, {
        transform: (key, value) => (key === 'rel' ? null : [key, value]),
      })
      expect(Object.keys(out)).toEqual(['href', 'target'])
    })

    test('appends fallbacks at the end for missing keys, skipping nullish values', () => {
      const out = buildAttrs({ width: '800' }, {
        fallbacks: { src: 'a.mp4', alt: undefined, title: null },
      })
      expect(Object.keys(out)).toEqual(['width', 'src'])
      expect(out.src).toBe('a.mp4')
    })

    test('does not overwrite existing keys with fallbacks', () => {
      const out = buildAttrs({ src: 'authored.mp4' }, {
        fallbacks: { src: 'fallback.mp4' },
      })
      expect(out.src).toBe('authored.mp4')
    })
  })

  describe('studio annotations (defineStudioMeta)', () => {
    const stringProp = (name: string, overrides: Partial<PropertyMeta> = {}): PropertyMeta => ({
      name,
      global: false,
      description: '',
      tags: [],
      required: false,
      type: 'string | undefined',
      schema: {
        kind: 'enum',
        type: 'string | undefined',
        schema: ['undefined', 'string'],
      },
      declarations: [],
      getDeclarations: () => [],
      getTypeObject: {} as never,
      ...overrides,
    })

    const createStudioComponentMeta = (
      props: PropertyMeta[],
      studio: NonNullable<ComponentMeta['meta']['studio']>,
      options: { nuxtUI?: boolean } = {},
    ): ComponentMeta => ({
      name: 'AuthorCard',
      path: '/path/to/AuthorCard.vue',
      nuxtUI: options.nuxtUI ?? false,
      meta: {
        props,
        slots: [],
        events: [],
        studio,
      },
    })

    const createNode = (props: Record<string, unknown> = {}): ProseMirrorNode => ({
      type: { name: 'element' },
      attrs: { tag: 'AuthorCard', props },
    } as unknown as ProseMirrorNode)

    test('input override beats heuristics and keeps a plain key for string-like inputs', () => {
      const meta = createStudioComponentMeta(
        [stringProp('cover'), stringProp('bio'), stringProp('publishedAt')],
        {
          props: {
            cover: { input: 'media' },
            bio: { input: 'textarea' },
            publishedAt: { input: 'date' },
          },
        },
      )

      const tree = buildFormTreeFromProps(createNode({ cover: '/img/cover.png' }), meta)

      expect(tree.cover).toMatchObject({ key: 'cover', type: 'media', value: '/img/cover.png' })
      expect(tree.bio).toMatchObject({ key: 'bio', type: 'textarea' })
      expect(tree.publishedAt).toMatchObject({ key: 'publishedAt', type: 'date' })
    })

    test('icon input picks up iconLibraries as options', () => {
      const meta = createStudioComponentMeta(
        [stringProp('symbol')],
        { props: { symbol: { input: 'icon', iconLibraries: ['lucide', 'simple-icons'] } } },
      )

      const tree = buildFormTreeFromProps(createNode(), meta)

      expect(tree.symbol).toMatchObject({ type: 'icon', options: ['lucide', 'simple-icons'] })
    })

    test('explicit options override enum extraction', () => {
      const enumProp = stringProp('variant', {
        type: '"primary" | "secondary" | undefined',
        schema: {
          kind: 'enum',
          type: '"primary" | "secondary" | undefined',
          schema: ['undefined', 'primary', 'secondary'],
        },
      })
      const meta = createStudioComponentMeta(
        [enumProp],
        { props: { variant: { options: ['primary', 'secondary', 'ghost'] } } },
      )

      const tree = buildFormTreeFromProps(createNode(), meta)

      expect(tree.variant!.options).toEqual(['primary', 'secondary', 'ghost'])
    })

    test('label, description and tooltip land on the form item', () => {
      const meta = createStudioComponentMeta(
        [stringProp('cover')],
        { props: { cover: { label: 'Cover image', description: 'Shown on top', tooltip: 'Use landscape' } } },
      )

      const tree = buildFormTreeFromProps(createNode(), meta)

      expect(tree.cover).toMatchObject({ label: 'Cover image', description: 'Shown on top', tooltip: 'Use landscape' })
    })

    test('hidden: true hides a prop, hidden: false un-hides a HIDDEN_PROPS entry', () => {
      const meta = createStudioComponentMeta(
        [stringProp('internal'), stringProp('disabled')],
        {
          props: {
            internal: { hidden: true },
            disabled: { hidden: false },
          },
        },
        { nuxtUI: true },
      )

      const tree = buildFormTreeFromProps(createNode(), meta)

      expect(tree.internal!.hidden).toBe(true)
      // `disabled` is in HIDDEN_PROPS and would be hidden on a Nuxt UI component
      expect(tree.disabled!.hidden).toBeUndefined()
    })

    test('single reference keeps a plain key, stores a string and carries picker options', () => {
      const meta = createStudioComponentMeta(
        [stringProp('authorId')],
        { props: { authorId: { input: 'reference', collection: 'authors', field: 'stem' } } },
      )

      const tree = buildFormTreeFromProps(createNode({ authorId: 'authors/john-doe' }), meta)

      expect(tree.authorId).toMatchObject({
        key: 'authorId',
        type: 'reference',
        value: 'authors/john-doe',
        collection: 'authors',
        field: 'stem',
      })
    })

    test('multiple reference uses an interpreted key, stores an array and defaults to []', () => {
      const meta = createStudioComponentMeta(
        [stringProp('related'), stringProp('tags')],
        {
          props: {
            related: { input: 'reference', collection: 'articles', multiple: true },
            tags: { input: 'reference', collection: 'tags', multiple: true },
          },
        },
      )

      const tree = buildFormTreeFromProps(
        createNode({ ':related': ['articles/one', 'articles/two'] }),
        meta,
      )

      expect(tree[':related']).toMatchObject({
        key: ':related',
        type: 'reference',
        value: ['articles/one', 'articles/two'],
        collection: 'articles',
        multiple: true,
      })
      expect(tree[':tags']).toMatchObject({ key: ':tags', value: [], default: [] })
    })

    test('multiple reference parses a JSON string node value', () => {
      const meta = createStudioComponentMeta(
        [stringProp('related')],
        { props: { related: { input: 'reference', collection: 'articles', multiple: true } } },
      )

      const tree = buildFormTreeFromProps(
        createNode({ ':related': '["articles/one"]' }),
        meta,
      )

      expect(tree[':related']!.value).toEqual(['articles/one'])
    })

    test('convertStringToValue handles the studio input types', () => {
      expect(convertStringToValue('/img/a.png', 'media')).toEqual('/img/a.png')
      expect(convertStringToValue('"quoted"', 'textarea')).toEqual('quoted')
      expect(convertStringToValue('2026-07-01', 'date')).toEqual('2026-07-01')
      expect(convertStringToValue('authors/john', 'reference')).toEqual('authors/john')
    })
  })
})
