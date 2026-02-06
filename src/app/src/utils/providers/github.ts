import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { consola } from 'consola'
import type { GitOptions, GitProviderAPI, GitFile, RawFile, CommitResult, CommitFilesOptions } from '../../types'
import { StudioFeature } from '../../types'
import { DraftStatus } from '../../types/draft'

interface GitHubUser {
  login: string
  email: string | null
  name: string | null
}

const NUXT_STUDIO_COAUTHOR = 'Co-authored-by: Nuxt Studio <noreply@nuxt.studio>'
const logger = consola.withTag('Nuxt Studio')

export function createGitHubProvider(options: GitOptions): GitProviderAPI {
  const { owner, repo, token, branch, rootDir, authorName, authorEmail } = options
  const gitFiles: Record<string, GitFile> = {}

  // Support both token formats: "token {token}" for fine grained PATs, "Bearer {token}" for OAuth PATs
  const isPAT = token.startsWith('github_pat_')
  const authHeader = isPAT ? `token ${token}` : `Bearer ${token}`

  const $repositoryApi = ofetch.create({
    baseURL: `https://api.github.com/repos/${owner}/${repo}`,
    headers: {
      Authorization: authHeader,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  const $userApi = ofetch.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: authHeader,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  // Cache for authenticated user info (PAT owner)
  let cachedPATUser: GitHubUser | null = null

  /**
   * Fetch the authenticated user associated with the current token
   * Used for PAT tokens to get the token owner's info
   */
  async function fetchAuthenticatedUser(): Promise<GitHubUser | null> {
    if (cachedPATUser) {
      return cachedPATUser
    }

    try {
      const user = await $userApi('/user')

      // If email is not public, try to fetch from emails endpoint
      let email = user.email
      if (!email) {
        try {
          const emails = await $userApi('/user/emails')
          const primaryEmail = emails.find((e: { primary: boolean, verified: boolean }) => e.primary && e.verified)
          email = primaryEmail?.email || emails.find((e: { verified: boolean }) => e.verified)?.email || null
        }
        catch {
          return null
        }
      }

      cachedPATUser = {
        login: user.login,
        email,
        name: user.name || user.login,
      }

      return cachedPATUser
    }
    catch {
      return null
    }
  }

  async function fetchFile(path: string, { cached = false }: { cached?: boolean } = {}): Promise<GitFile | null> {
    path = joinURL(rootDir, path)
    if (cached) {
      const file = gitFiles[path]
      if (file) {
        return file
      }
    }

    try {
      const ghResponse = await $repositoryApi(`/contents/${path}?ref=${branch}`)
      const ghFile: GitFile = {
        ...ghResponse,
        provider: 'github' as const,
      }

      if (cached) {
        gitFiles[path] = ghFile
      }
      return ghFile
    }
    catch (error) {
      // Handle different types of errors gracefully
      if ((error as { status?: number }).status === 404) {
        logger.warn(`File not found on GitHub: ${path}`)
        return null
      }

      logger.error(`Failed to fetch file from GitHub: ${path}`, error)

      // For development, show alert. In production, you might want to use a toast notification
      if (process.env.NODE_ENV === 'development') {
        alert(`Failed to fetch file: ${path}\n${(error as { message?: string }).message || error}`)
      }

      return null
    }
  }

  async function commitFiles(files: RawFile[], message: string): Promise<CommitResult | null> {
    if (!token) {
      return Promise.resolve(null)
    }

    files = files
      .filter(file => file.status !== DraftStatus.Pristine)
      .map(file => ({ ...file, path: joinURL(rootDir, file.path) }))

    const coAuthors: string[] = [NUXT_STUDIO_COAUTHOR]

    let commitAuthorName = authorName
    let commitAuthorEmail = authorEmail

    // For PAT tokens, use the PAT owner's info for the commit author
    // This ensures the commit email is associated with a GitHub account
    if (isPAT) {
      const patUser = await fetchAuthenticatedUser()
      if (patUser?.email) {
        // Add the original user (who performed the action) as co-author if different from PAT owner
        if (authorEmail && authorEmail !== patUser.email) {
          coAuthors.push(`Co-authored-by: ${authorName} <${authorEmail}>`)
        }

        // Use PAT owner as the commit author
        commitAuthorName = patUser.name || patUser.login
        commitAuthorEmail = patUser.email
      }
    }

    // Build commit message with co-authors
    const fullMessage = coAuthors.length > 0
      ? `${message}\n\n${coAuthors.join('\n')}`
      : message

    return commitFilesToGitHub({
      owner,
      repo,
      branch,
      files,
      message: fullMessage,
      authorName: commitAuthorName,
      authorEmail: commitAuthorEmail,
    })
  }

  async function commitFilesToGitHub({ owner, repo, branch, files, message, authorName, authorEmail }: CommitFilesOptions) {
    // Get latest commit SHA
    const refData = await $repositoryApi(`/git/refs/heads/${branch}`)
    const latestCommitSha = refData.object.sha

    // Get base tree SHA
    const commitData = await $repositoryApi(`/git/commits/${latestCommitSha}`)
    const baseTreeSha = commitData.tree.sha

    // Create blobs and prepare tree
    const tree = []
    for (const file of files) {
      if (file.status === DraftStatus.Deleted) {
        // For deleted files, set sha to null to remove them from the tree
        tree.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: null,
        })
      }
      else {
        // For new/modified files, create blob and use its sha
        const blobData = await $repositoryApi(`/git/blobs`, {
          method: 'POST',
          body: JSON.stringify({
            content: file.content,
            encoding: file.encoding,
          }),
        })
        tree.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha,
        })
      }
    }

    // Create new tree
    const treeData = await $repositoryApi(`/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree,
      }),
    })

    // Create new commit
    const newCommit = await $repositoryApi(`/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [latestCommitSha],
        author: {
          name: authorName,
          email: authorEmail,
          date: new Date().toISOString(),
        },
      }),
    })

    // Update branch ref
    await $repositoryApi(`/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommit.sha }),
    })

    return {
      success: true,
      commitSha: newCommit.sha,
      url: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
    }
  }

  function getRepositoryUrl() {
    return `https://github.com/${owner}/${repo}`
  }

  function getBranchUrl() {
    return `https://github.com/${owner}/${repo}/tree/${branch}`
  }

  function getCommitUrl(sha: string) {
    return `https://github.com/${owner}/${repo}/commit/${sha}`
  }

  function getFileUrl(feature: StudioFeature, fsPath: string) {
    const featureDir = feature === StudioFeature.Content ? 'content' : 'public'
    const fullPath = joinURL(rootDir, featureDir, fsPath)
    return `https://github.com/${owner}/${repo}/blob/${branch}/${fullPath}`
  }

  function getRepositoryInfo() {
    return {
      owner,
      repo,
      branch,
      provider: 'github' as const,
    }
  }

  return {
    fetchFile,
    commitFiles,
    getRepositoryUrl,
    getBranchUrl,
    getCommitUrl,
    getFileUrl,
    getRepositoryInfo,
  }
}
