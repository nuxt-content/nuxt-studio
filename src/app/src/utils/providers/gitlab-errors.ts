export const GITLAB_TOKEN_EXPIRED_ERROR_CODE = 'gitlab_token_expired'

export class GitLabTokenExpiredError extends Error {
  readonly code = GITLAB_TOKEN_EXPIRED_ERROR_CODE

  constructor() {
    super('GitLab token expired')
    this.name = 'GitLabTokenExpiredError'
  }
}

interface GitLabOAuthErrorResponse {
  error?: string
  error_description?: string
}

function getGitLabOAuthErrorData(error: unknown): GitLabOAuthErrorResponse | undefined {
  if (!error || typeof error !== 'object' || !('data' in error)) {
    return undefined
  }

  const data = (error as { data?: unknown }).data

  if (!data || typeof data !== 'object') {
    return undefined
  }

  return data as GitLabOAuthErrorResponse
}

/**
 * GitLab returns OAuth-style errors for expired access tokens.
 *
 * @see https://github.com/nuxt-content/nuxt-studio/issues/512
 */
export function isGitLabTokenExpiredFetchError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return false
  }

  const status = (error as { status?: number }).status

  if (status !== 401) {
    return false
  }

  return getGitLabOAuthErrorData(error)?.error === 'invalid_token'
}

export function isGitLabTokenExpiredError(error: unknown): error is GitLabTokenExpiredError {
  return error instanceof GitLabTokenExpiredError
}
