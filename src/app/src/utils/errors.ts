/**
 * Thrown from the publish handler when pre-publish conflict detection finds that
 * one or more files were changed on the remote since the local draft was created.
 *
 * HeaderReview catches this specifically and navigates to /content so the user
 * can resolve the conflict in the editor, rather than routing to /error.
 */
export class ConflictAbortError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictAbortError'
  }
}
