import type { DatabasePageItem } from '../../src/types'
import { idToFsPath } from './host'

export const createMockDocument = (id: string, overrides?: Partial<DatabasePageItem>) => {
  const fsPath = idToFsPath(id)
  const path = fsPath.replace('.md', '')
  return {
    id,
    fsPath,
    path,
    stem: path,
    extension: 'md',
    body: { nodes: [['p', {}, 'Test content']], frontmatter: {}, meta: {} },
    meta: {},
    ...overrides,
  } as DatabasePageItem
}
