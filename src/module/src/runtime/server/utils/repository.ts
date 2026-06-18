/**
 * Detect repository information from CI / platform environment variables at runtime.
 * Supports Vercel, Netlify, GitHub Actions, and GitLab CI.
 *
 * Note: VERCEL_GIT_* and Netlify REPOSITORY_URL / BRANCH env vars are present in the
 * running server process, so they resolve at runtime.  GITHUB_ACTIONS and GITLAB_CI env
 * vars are typically only available during the CI build pipeline; for deployments that rely
 * on those, set explicit `repository` config in nuxt.config.ts or via
 * NUXT_PUBLIC_STUDIO_REPOSITORY_* environment variables instead.
 */
export interface RepositoryDetection {
  provider?: 'github' | 'gitlab'
  owner?: string
  repo?: string
  branch?: string
  instanceUrl?: string
}

export function detectRepositoryFromCI(): RepositoryDetection | undefined {
  // Vercel (available at runtime)
  if (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG && ['github', 'gitlab'].includes(process.env.VERCEL_GIT_PROVIDER!)) {
    return {
      provider: process.env.VERCEL_GIT_PROVIDER as 'github' | 'gitlab',
      owner: process.env.VERCEL_GIT_REPO_OWNER,
      repo: process.env.VERCEL_GIT_REPO_SLUG,
      branch: process.env.VERCEL_GIT_COMMIT_REF,
    }
  }

  // Netlify (available at runtime)
  if (process.env.NETLIFY && process.env.REPOSITORY_URL) {
    const match = process.env.REPOSITORY_URL.match(/(?:github\.com|gitlab\.com)[:/]([^/]+)\/([^/.]+)/)
    if (match?.[1] && match[2]) {
      const isGitLab = process.env.REPOSITORY_URL.includes('gitlab.com')
      return {
        provider: isGitLab ? 'gitlab' : 'github',
        owner: match[1],
        repo: match[2],
        branch: process.env.BRANCH,
      }
    }
  }

  // GitHub Actions (build-time only in most CI setups)
  if (process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY?.includes('/')) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/') as [string, string]
    return {
      provider: 'github',
      owner,
      repo,
      branch: process.env.GITHUB_REF_NAME,
    }
  }

  // GitLab CI (build-time only in most CI setups)
  if (process.env.GITLAB_CI && process.env.CI_PROJECT_NAMESPACE && process.env.CI_PROJECT_NAME) {
    return {
      provider: 'gitlab',
      owner: process.env.CI_PROJECT_NAMESPACE,
      repo: process.env.CI_PROJECT_NAME,
      branch: process.env.CI_COMMIT_BRANCH,
      instanceUrl: process.env.CI_SERVER_URL,
    }
  }

  return undefined
}
