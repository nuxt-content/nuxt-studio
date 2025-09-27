import type { DraftItem } from '../../src/types/draft'
import { DraftStatus } from '../../src/types/draft'

const draftItemsList: DraftItem[] = [
  // Root files
  {
    id: 'landing/index.md',
    fsPath: '/index.md',
    status: DraftStatus.Updated,
  },
  {
    id: 'docs/root-file.md',
    fsPath: '/root-file.md',
    status: DraftStatus.Created,
  },

  // Files in getting-started directory
  {
    id: 'docs/1.getting-started/2.introduction.md',
    fsPath: '/1.getting-started/2.introduction.md',
    status: DraftStatus.Updated,
  },
  {
    id: 'docs/1.getting-started/3.installation.md',
    fsPath: '/1.getting-started/3.installation.md',
    status: DraftStatus.Created,
  },
  {
    id: 'docs/1.getting-started/4.configuration.md',
    fsPath: '/1.getting-started/4.configuration.md',
    status: DraftStatus.Deleted,
  },

  // Files in advanced subdirectory
  {
    id: 'docs/1.getting-started/1.advanced/1.studio.md',
    fsPath: '/1.getting-started/1.advanced/1.studio.md',
    status: DraftStatus.Updated,
  },
  {
    id: 'docs/1.getting-started/1.advanced/2.deployment.md',
    fsPath: '/1.getting-started/1.advanced/2.deployment.md',
    status: DraftStatus.Created,
  },
]

export { draftItemsList }
