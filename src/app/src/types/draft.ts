import type { GitFile } from './git'
import type { DatabaseItem } from './database'
import type { MediaItem } from './media'

export enum DraftStatus {
  Deleted = 'deleted',
  Created = 'created',
  Updated = 'updated',
  Pristine = 'pristine',
}

export interface ContentConflict {
  remoteContent: string
  localContent: string
}

export interface DraftItem<T = DatabaseItem | MediaItem> {
  fsPath: string // file path in content directory
  status: DraftStatus // status

  remoteFile?: GitFile
  original?: T
  modified?: T
  /**
   * - Buffer media content
   */
  raw?: string | Buffer
  /**
   * Version of the draft
   * Incremented when the draft is updated
   * Used to detect changes when the draft is saved
   */
  version?: number
  /**
   * Content conflict detection
   */
  conflict?: ContentConflict
  /**
   * Marks the draft as "the user explicitly accepted the comark
   * formatting for this file." Even if there is no manual updates from the editor.
   *
   * Set by `useDraftDocuments.applyFormatting(fsPath)`, cleared by `revert`.
   */
  formattingApplied?: boolean

  /**
   * Marks the draft as having been successfully committed to Git but not yet
   * reflected in the deployed content database.
   *
   * A published draft bridges the gap between a successful commit and the
   * deployment that rebuilds the SQLite dump. It overlays the committed content
   * on top of the stale dump and self-removes once `load()` detects the dump has
   * caught up.
   *
   * Set by `useDraftBase.markPublished()` after a successful commit.
   * Cleared automatically in `load()` when the deployed dump matches the committed content.
   */
  published?: boolean
}
