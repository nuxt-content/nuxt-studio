import type { DatabaseItem } from '../types/database'
import { DraftStatus } from '../types/draft'

export const COLOR_STATUS_MAP: { [key in DraftStatus]?: string } = {
  [DraftStatus.Created]: 'green',
  [DraftStatus.Updated]: 'orange',
  [DraftStatus.Deleted]: 'red',
  [DraftStatus.Renamed]: 'blue',
  [DraftStatus.Opened]: 'gray',
} as const

export const COLOR_UI_STATUS_MAP: { [key in DraftStatus]?: string } = {
  [DraftStatus.Created]: 'success',
  [DraftStatus.Updated]: 'warning',
  [DraftStatus.Deleted]: 'danger',
  [DraftStatus.Renamed]: 'info',
  [DraftStatus.Opened]: 'neutral',
} as const

export function getDraftStatus(draftedDocument: DatabaseItem, originalDatabaseItem: DatabaseItem | undefined) {
  if (!originalDatabaseItem) {
    return DraftStatus.Created
  }
  else {
    // TODO: check and fix with ahad toc and shiki presence, maybe check the content
    if (JSON.stringify(originalDatabaseItem) !== JSON.stringify(draftedDocument)) {
      return DraftStatus.Updated
    }
  }

  return DraftStatus.Opened
}
