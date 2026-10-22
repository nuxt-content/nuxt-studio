import type { Draft07, Draft07DefinitionProperty, Draft07DefinitionPropertyAnyOf, Draft07DefinitionPropertyAllOf, Draft07DefinitionPropertyOneOf, EditorOptions } from '@nuxt/content'
import type { FormTree, FormItem } from '../types'
import { upperFirst, titleCase } from 'scule'
import { omit } from './object'

export function formItemInputLabel(formItem: FormItem): string {
  const custom = formItem.label?.trim()
  if (custom) {
    return custom
  }

  return titleCase(formItem.title)
}

/**
 * Maps Nuxt Content collection schema `$content.editor` display options onto a form item.
 */
function editorDisplayFromContent(
  content: Draft07DefinitionProperty['$content'],
): Partial<Pick<FormItem, 'label' | 'description' | 'tooltip'>> {
  const editor = content?.editor as EditorOptions | undefined
  if (!editor) {
    return {}
  }

  const result: Partial<Pick<FormItem, 'label' | 'description' | 'tooltip'>> = {}

  if (editor.label !== undefined) {
    result.label = editor.label
  }
  if (editor.description !== undefined) {
    result.description = editor.description
  }
  if (editor.tooltip !== undefined) {
    result.tooltip = editor.tooltip
  }

  return result
}

export function isMissingRequiredValue(formItem: FormItem, value: unknown): boolean {
  if (!formItem.required || formItem.type === 'boolean' || formItem.type === 'object') {
    return false
  }

  return value === undefined || value === null || value === ''
}

// Zod 4 lists defaulted keys in `required` (output schema), but they can be omitted from content
function isRequiredProperty(def: Draft07DefinitionProperty, key: string, optionalKeys: string[]): boolean {
  if (!def.required?.includes(key) || optionalKeys.includes(key)) {
    return false
  }

  const property = def.properties?.[key] as Draft07DefinitionProperty | undefined
  return property?.default === undefined && !isNullable(property)
}

function isNullable(def?: Draft07DefinitionProperty): boolean {
  const type = def?.type as string | string[] | undefined
  const variants = (def as Draft07DefinitionPropertyAnyOf | undefined)?.anyOf || (def as Draft07DefinitionPropertyOneOf | undefined)?.oneOf || []

  return (Array.isArray(type) && type.includes('null')) || variants.some(variant => variant.type === 'null')
}

export const buildFormTreeFromSchema = (treeKey: string, schema: Draft07): FormTree => {
  if (!schema || !schema.definitions || !schema.definitions[treeKey]) {
    return {}
  }

  const rootDef = schema.definitions[treeKey] as Draft07DefinitionProperty
  // Page collections derive these from the body when they are missing
  const optionalRootKeys = rootDef.properties?.body ? ['title', 'description'] : []

  // Children of an optional object can only be required once the object itself exists
  const buildFormTreeItem = (def: Draft07DefinitionProperty, id: string = `#${treeKey}`, required = false, present = required): FormItem | null => {
    const paths = id.split('/')
    const itemKey = paths.pop()!.replace('#', '')
    const level = paths.length

    const editor = def.$content?.editor
    if (editor?.hidden) {
      return null
    }

    // Handle two level deep for objects keys
    if (level <= 3) {
      // Handle `Of` fields
      if (
        (def as Draft07DefinitionPropertyAllOf).allOf
        || (def as Draft07DefinitionPropertyAnyOf).anyOf
        || (def as Draft07DefinitionPropertyOneOf).oneOf
      ) {
        let item: FormItem | null
        const defs = (def as Draft07DefinitionPropertyAllOf).allOf
          || (def as Draft07DefinitionPropertyAnyOf).anyOf
          || (def as Draft07DefinitionPropertyOneOf).oneOf

        const objectDef = defs.find(item => item.type === 'object')
        const stringDef = defs.find(item => item.type === 'string')
        const booleanDef = defs.find(item => item.type === 'boolean')

        // Choose object type in priority
        if (objectDef) {
          item = buildFormTreeItem(objectDef, id, required, present)
        }

        // Then string type
        else if (stringDef) {
          item = buildFormTreeItem(stringDef, id, required, present)
        }

        // Else select first one
        else {
          item = buildFormTreeItem(defs[0], id, required, present)
        }

        // Handle multiple types with boolean
        if (item!.type !== 'boolean' && booleanDef) {
          item!.toggleable = true
        }

        return item
      }

      // Object form
      if (def.type === 'object' && def.properties) {
        const children = Object.keys(def.properties).reduce((acc, key) => {
          // Hide content internal keys
          const hiddenKeys = ['id', 'contentId', 'weight', 'stem', 'extension', 'path', 'meta', 'body']
          if (hiddenKeys.includes(key) || def.properties![key]!.$content?.editor?.hidden) {
            return acc
          }

          const item = {
            ...acc,
            [key]: buildFormTreeItem(def.properties![key], `${id}/${key}`, present && isRequiredProperty(def, key, level === 0 ? optionalRootKeys : [])),
          } as FormItem

          return item
        }, {})

        const item: FormItem = {
          id,
          title: upperFirst(itemKey),
          type: editor?.input ?? def.type,
          children,
          ...editorDisplayFromContent(def.$content),
          ...(required && { required }),
        }

        if (def.enum && Array.isArray(def.enum) && def.enum.length > 0) {
          item.options = def.enum as string[]
        }

        return item
      }

      // Array form
      if (def.type === 'array' && def.items) {
        return {
          id,
          title: upperFirst(itemKey),
          type: 'array',
          arrayItemForm: buildFormTreeItem(def.items, `#${itemKey}/items`, false, true)!,
          ...editorDisplayFromContent(def.$content),
          ...(required && { required }),
        }
      }

      // Primitive form
      const editorType = editor?.input
      const type = def.type === 'string' && def.format?.includes('date') ? (def.format === 'date-time' ? 'datetime' : 'date') : editorType ?? def.type as never

      const item: FormItem = {
        id,
        title: upperFirst(itemKey),
        type: editorType ?? type,
        ...editorDisplayFromContent(def.$content),
        ...(required && { required }),
      }

      if (def.enum && Array.isArray(def.enum) && def.enum.length > 0) {
        item.options = def.enum as string[]
      }
      else if (editor?.iconLibraries && Array.isArray(editor.iconLibraries)) {
        item.options = editor.iconLibraries
      }

      return item
    }

    // Else edit directly as the return type
    const editorType = editor?.input
    const type = def.type === 'string' && def.format?.includes('date') ? 'date' : editorType ?? def.type

    const item: FormItem = {
      id,
      title: upperFirst(itemKey),
      type: editorType ?? type as never,
      ...editorDisplayFromContent(def.$content),
      ...(required && { required }),
    }

    if (type === 'array' && def.items) {
      item.arrayItemForm = buildFormTreeItem(def.items, `#${itemKey}/items`, false, true)!
    }

    if (def.enum && Array.isArray(def.enum) && def.enum.length > 0) {
      item.options = def.enum as string[]
    }
    // Pass iconLibraries from editor options for icon inputs
    else if (editor?.iconLibraries && Array.isArray(editor.iconLibraries)) {
      item.options = editor.iconLibraries as string[]
    }

    return item
  }

  return {
    [treeKey]: buildFormTreeItem(rootDef, undefined, false, true) as FormItem,
  }
}

// Apply json to form tree values
// Only override properties that are present in the tree
export const applyValuesToFormTree = (tree: FormTree, override: Record<string, unknown>): FormTree => {
  return Object.keys(tree).reduce((acc, key) => {
    // Recursively override if found
    if (override[key] !== undefined && override[key] !== null) {
      if (tree[key].children) {
        return {
          ...acc,
          [key]: {
            ...(omit(tree[key], ['children'])),
            children: {
              ...tree[key].children,
              ...applyValuesToFormTree(tree[key].children, override[key] as Record<string, unknown>),
            },
          },
        } as FormTree
      }

      return {
        ...acc,
        [key]: {
          ...tree[key],
          value: override[key],
        },
      } as FormTree
    }
    // Else recusively add empty value
    else {
      if (tree[key].children) {
        return {
          ...acc,
          [key]: {
            ...(omit(tree[key], ['children'])),
            children: {
              ...tree[key].children,
              ...applyValuesToFormTree(tree[key].children, {}),
            },
          },
        }
      }

      return {
        ...acc,
        [key]: {
          ...tree[key],
          value: '',
        },

      }
    }
  }, {})
}

// Recursively traverse the form tree to find the corresponding id and update the value
export const applyValueById = (form: FormTree, id: string, value: unknown): FormTree => {
  return Object.keys(form).reduce((acc, key) => {
    if (form[key].id === id) {
      return {
        ...acc,
        [key]: {
          ...form[key],
          value,
        },
      }
    }
    else if (form[key].children) {
      return {
        ...acc,
        [key]: {
          ...form[key],
          children: applyValueById(form[key].children, id, value),
        },
      }
    }
    return {
      ...acc,
      [key]: form[key],
    }
  }, {})
}

// Recursively compare form trees to find the updated item and return it
// Updated item must a be leaf (input) of the form
export const getUpdatedTreeItem = (original: FormTree, updated: FormTree): FormItem | null => {
  for (const key of Object.keys(updated)) {
    const originalItem = original[key]
    const updatedItem = updated[key]

    if (!originalItem) {
      continue
    }

    // If both have children, recurse into them
    if (originalItem.children && updatedItem.children) {
      const result = getUpdatedTreeItem(originalItem.children, updatedItem.children)
      if (result) {
        return result
      }
    }
    // If it's a leaf node, compare values
    else if (!updatedItem.children) {
      if (originalItem.value !== updatedItem.value) {
        return updatedItem
      }
    }
  }

  return null
}
