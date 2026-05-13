import { describe, it, expect } from 'vitest'
import {
  comarkTreeFromLegacyDocument,
  markdownRootFromComarkTree,
} from '../../src/runtime/utils/document/legacy'
import { renderMarkdown } from 'comark/render'
import type { ComarkTree } from 'comark'
import type { DatabaseItem } from 'nuxt-studio/app'
import type { MDCRoot } from '@nuxtjs/mdc'

function legacyDocument(body: MDCRoot): DatabaseItem {
  return {
    id: 'content:index.md',
    extension: 'md',
    stem: 'index',
    meta: {},
    body: body as unknown,
  } as DatabaseItem
}

describe('mdc → comark slot translation', () => {
  it('converts `v-slot:headline=""` into `{ name: "headline" }` on template nodes', () => {
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'u-page-hero',
        props: {},
        children: [{
          type: 'element',
          tag: 'template',
          props: { 'v-slot:headline': '' },
          children: [{ type: 'text', value: 'Hello' }],
        }],
      }],
    }))!

    const hero = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(hero[0]).toBe('u-page-hero')
    const slot = hero[2] as [string, Record<string, unknown>, ...unknown[]]
    expect(slot[0]).toBe('template')
    expect(slot[1]).toEqual({ name: 'headline' })
    expect(slot[2]).toBe('Hello')
  })

  it('renders the translated slot as MDC `#slotname` (not `#undefined`)', async () => {
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'u-page-hero',
        props: {},
        children: [{
          type: 'element',
          tag: 'template',
          props: { 'v-slot:title': '' },
          children: [{ type: 'text', value: 'Hello' }],
        }],
      }],
    }))!

    const md = await renderMarkdown(tree)
    expect(md).toContain('#title')
    expect(md).not.toContain('#undefined')
    expect(md).not.toContain('v-slot:')
  })

  it('treats an empty `v-slot:` key as the default slot', () => {
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'template',
        props: { 'v-slot:': '' },
        children: [{ type: 'text', value: 'body' }],
      }],
    }))!

    const slot = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(slot[1]).toEqual({ name: 'default' })
  })

  it('preserves other props alongside the v-slot directive', () => {
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'template',
        props: { 'v-slot:headline': '', 'unwrap': 'p' },
        children: [],
      }],
    }))!

    const slot = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(slot[1]).toEqual({ name: 'headline', unwrap: 'p' })
  })
})

describe('mdc → comark className translation', () => {
  it('joins `className: string[]` into `class: "a b"`', () => {
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'span',
        props: { className: ['text-primary', 'font-bold'] },
        children: [{ type: 'text', value: 'Nuxt' }],
      }],
    }))!

    const span = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(span[1]).toEqual({ class: 'text-primary font-bold' })
  })

  it('drops an empty className array', () => {
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'div',
        props: { className: [] },
        children: [],
      }],
    }))!

    const div = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(div[1]).toEqual({})
  })

  it('renders className as `.foo.bar` (not JSON-stringified)', async () => {
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'span',
        props: { className: ['text-primary'] },
        children: [{ type: 'text', value: 'Nuxt' }],
      }],
    }))!

    const md = await renderMarkdown(tree)
    expect(md).not.toContain('[\\"text-primary\\"]')
    expect(md).not.toContain('className')
  })
})

describe('mdc → comark attribute ordering', () => {
  it('emits attrs in alphabetical order on a single element', () => {
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'u-button',
        props: {
          'to': '/intro',
          'variant': 'outline',
          'size': 'sm',
          'target': '_blank',
          'trailing-icon': 'i-lucide-arrow-right',
        },
        children: [],
      }],
    }))!

    const button = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(Object.keys(button[1])).toEqual([
      'size',
      'target',
      'to',
      'trailing-icon',
      'variant',
    ])
  })

  it('sorts attrs deeply on nested elements', () => {
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'outer',
        props: { z: '1', a: '2' },
        children: [{
          type: 'element',
          tag: 'inner',
          props: { y: '3', b: '4' },
          children: [],
        }],
      }],
    }))!

    const outer = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(Object.keys(outer[1])).toEqual(['a', 'z'])
    const inner = outer[2] as [string, Record<string, unknown>, ...unknown[]]
    expect(Object.keys(inner[1])).toEqual(['b', 'y'])
  })

  it('sorts attrs after a slot name has been hoisted out of `v-slot:name`', () => {
    // The `name` derived from `v-slot:title` must participate in the final
    // sort, not stay at whatever position the source-shaped translation left it.
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'template',
        props: { 'unwrap': 'p', 'v-slot:title': '' },
        children: [],
      }],
    }))!

    const slot = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(Object.keys(slot[1])).toEqual(['name', 'unwrap'])
  })
})

describe('mdc → comark generic array → string normalization', () => {
  it('joins arbitrary token-list arrays into space-joined strings', () => {
    // Beyond className, any other array-valued attr coming out of @nuxtjs/mdc
    // (e.g. `ping`) should collapse to a space-joined string so the bridged
    // body matches the shape comark's parser produces from raw markdown.
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'card',
        props: { ping: ['a', 'b'] },
        children: [],
      }],
    }))!

    const card = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(card[1]).toEqual({ ping: 'a b' })
  })

  it('leaves arrays of non-primitives untouched', () => {
    // We only collapse arrays of primitives — anything else is unexpected in
    // MDC content but shouldn't be silently mutated.
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'card',
        props: { items: [{ x: 1 }] },
        children: [],
      }],
    }))!

    const card = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(card[1]).toEqual({ items: [{ x: 1 }] })
  })
})

describe('mdc → comark `rel` stripping', () => {
  it('drops `rel` from any element, regardless of tag', () => {
    // @nuxt/content's rehype-external-links plugin injects `rel: ['nofollow']`
    // on external links at SQLite-build time. That's not user-authored, so we
    // strip it at the bridge so it never reaches the editor or comparison.
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'p',
        props: {},
        children: [{
          type: 'element',
          tag: 'a',
          props: { href: 'https://nuxt.com', rel: ['nofollow'] },
          children: [{ type: 'text', value: 'Nuxt' }],
        }],
      }],
    }))!

    const p = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    const a = p[2] as [string, Record<string, unknown>, ...unknown[]]
    expect(a[1]).toEqual({ href: 'https://nuxt.com' })
    expect(a[1]).not.toHaveProperty('rel')
  })

  it('drops `rel` even when it is a plain string', () => {
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'a',
        props: { href: 'https://nuxt.com', rel: 'nofollow' },
        children: [{ type: 'text', value: 'Nuxt' }],
      }],
    }))!

    const a = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(a[1]).not.toHaveProperty('rel')
  })

  it('leaves other auto-adjacent attrs alone (e.g. `target`)', () => {
    const tree = comarkTreeFromLegacyDocument(legacyDocument({
      type: 'root',
      children: [{
        type: 'element',
        tag: 'a',
        props: { href: 'https://nuxt.com', target: '_blank' },
        children: [{ type: 'text', value: 'Nuxt' }],
      }],
    }))!

    const a = tree.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(a[1]).toEqual({ href: 'https://nuxt.com', target: '_blank' })
  })
})

describe('roundtrip: legacy MDC → ComarkTree → legacy MDC', () => {
  it('round-trips a template slot back into `v-slot:name=""` shape', () => {
    const original: MDCRoot = {
      type: 'root',
      children: [{
        type: 'element',
        tag: 'u-page-hero',
        props: {},
        children: [{
          type: 'element',
          tag: 'template',
          props: { 'v-slot:title': '' },
          children: [{ type: 'text', value: 'Hello' }],
        }],
      }],
    }

    const tree = comarkTreeFromLegacyDocument(legacyDocument(original))!
    const back = markdownRootFromComarkTree(tree)

    // markdownRootFromComarkTree returns a compressed minimark tree, but the
    // important invariant is that re-converting it produces the original shape.
    const rebuilt = comarkTreeFromLegacyDocument(legacyDocument(back as unknown as MDCRoot))!
    const hero = rebuilt.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    const slot = hero[2] as [string, Record<string, unknown>, ...unknown[]]
    expect(slot[0]).toBe('template')
    expect(slot[1]).toEqual({ name: 'title' })
  })

  it('round-trips className arrays without loss', () => {
    const original: MDCRoot = {
      type: 'root',
      children: [{
        type: 'element',
        tag: 'span',
        props: { className: ['text-primary', 'font-bold'] },
        children: [{ type: 'text', value: 'Nuxt' }],
      }],
    }

    const tree = comarkTreeFromLegacyDocument(legacyDocument(original))!
    const back = markdownRootFromComarkTree(tree)
    const rebuilt = comarkTreeFromLegacyDocument(legacyDocument(back as unknown as MDCRoot))!
    const span = rebuilt.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(span[1]).toEqual({ class: 'text-primary font-bold' })
  })
})

describe('comark → mdc reverse helpers (used at DB write boundary)', () => {
  it('writes back a `template` slot as `v-slot:name=""`', () => {
    const tree: ComarkTree = {
      nodes: [['template', { name: 'title' }, 'Hello']],
      frontmatter: {},
      meta: {},
    }

    const root = markdownRootFromComarkTree(tree) as unknown as MDCRoot
    // markdownRootFromComarkTree compresses via @nuxt/content; reverse it to inspect.
    const reloaded = comarkTreeFromLegacyDocument(legacyDocument(root))!
    const slot = reloaded.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    expect(slot[0]).toBe('template')
    expect(slot[1]).toEqual({ name: 'title' })
  })

  it('writes back `class` strings as `className` arrays', () => {
    const tree: ComarkTree = {
      nodes: [['span', { class: 'text-primary font-bold' }, 'Nuxt']],
      frontmatter: {},
      meta: {},
    }

    const root = markdownRootFromComarkTree(tree) as unknown as MDCRoot
    const reloaded = comarkTreeFromLegacyDocument(legacyDocument(root))!
    const span = reloaded.nodes[0] as [string, Record<string, unknown>, ...unknown[]]
    // After full roundtrip back through MDC compression and our forward
    // translation, the span should expose the comark-shape (`class` string).
    expect(span[1]).toEqual({ class: 'text-primary font-bold' })
  })
})
