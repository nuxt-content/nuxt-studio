import { describe, it, expect } from 'vitest'
import { isEqual } from '../../../src/utils/database'
import type { DatabasePageItem } from '../../../src/types'
import { ContentFileExtension } from '../../../src/types'

describe('isEqual', () => {
  it('should return true for two identical markdown documents with diffrent hash', () => {
    const document1: DatabasePageItem = {
      id: 'content:index.md',
      path: '/index',
      title: 'Test Document',
      description: 'A test document',
      extension: ContentFileExtension.Markdown,
      stem: 'index',
      seo: {},
      body: {
        type: 'minimark',
        value: ['Hello World'],
      },
      meta: {
        __hash__: 'hash123',
      },
    }

    const document2: DatabasePageItem = {
      id: 'content:index.md',
      path: '/index',
      title: 'Test Document',
      description: 'A test document',
      extension: ContentFileExtension.Markdown,
      stem: 'index',
      seo: {},
      body: {
        type: 'minimark',
        value: ['Hello World'],
      },
      meta: {
        __hash__: 'hash456',
      },
    }

    expect(isEqual(document1, document2)).toBe(true)
  })

  it('should return false for two different markdown documents', () => {
    const document1: DatabasePageItem = {
      id: 'content:index.md',
      path: '/index',
      title: 'Test Document',
      description: 'A test document',
      extension: ContentFileExtension.Markdown,
      stem: 'index',
      seo: {},
      body: {
        type: 'minimark',
        value: ['Hello World'],
      },
      meta: {
        title: 'Test Document',
      },
    }

    const document2: DatabasePageItem = {
      id: 'content:index.md',
      path: '/index',
      title: 'Test Document',
      description: 'A test document',
      extension: ContentFileExtension.Markdown,
      stem: 'index',
      seo: {},
      body: {
        type: 'minimark',
        value: ['Different content'],
      },
      meta: {
        title: 'Test Document',
      },
    }

    expect(isEqual(document1, document2)).toBe(false)
  })
})
