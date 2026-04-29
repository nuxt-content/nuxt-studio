import { describe, it, expect } from 'vitest'
import { useDraftBase } from '../../../src/composables/useDraftBase'
import { dbItemsList } from '../../mocks/database'
import { DraftStatus } from '../../../src/types'
import { createMockHost } from '../../mocks/host'

const { getStatus } = useDraftBase('document', createMockHost(), null as never, null as never)

describe('getStatus', () => {
  it('returns Deleted status when modified item is undefined', async () => {
    const original = dbItemsList[0] // landing/index.md

    expect(await getStatus(undefined as never, original)).toBe(DraftStatus.Deleted)
  })

  it('returns Created status when original is undefined', async () => {
    const modified = dbItemsList[1] // docs/1.getting-started/2.introduction.md

    expect(await getStatus(modified, undefined as never)).toBe(DraftStatus.Created)
  })

  it('returns Created status when original has different id', async () => {
    const original = dbItemsList[0] // landing/index.md
    const modified = dbItemsList[1] // docs/1.getting-started/2.introduction.md

    expect(await getStatus(modified, original)).toBe(DraftStatus.Created)
  })

  it('returns Updated status when markdown content is different', async () => {
    const original = dbItemsList[1] // docs/1.getting-started/2.introduction.md
    const modified = {
      ...original,
      body: { nodes: [['p', {}, 'text'], ['p', {}, 'Modified']], frontmatter: {}, meta: {} },
    }

    expect(await getStatus(modified, original)).toBe(DraftStatus.Updated)
  })

  it('returns Pristine status when markdown content is identical', async () => {
    const original = dbItemsList[1] // docs/1.getting-started/2.introduction.md

    expect(await getStatus(original, original)).toBe(DraftStatus.Pristine)
  })
})
