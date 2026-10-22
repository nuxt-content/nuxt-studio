import type { DraftStatus } from './draft'
import type { StudioFeature } from '../types'

export type GitProviderType = 'github' | 'gitlab'

export interface RepositoryPullRequestOptions {
  /**
   * Target branch for pull/merge requests created after publishing.
   * When set, Studio commits to `branch` then opens or reuses a review request into this base branch.
   */
  base?: string
  /**
   * Title for pull/merge requests created after publishing.
   * When omitted, the commit message is used.
   */
  name?: string
}

export interface Repository {
  provider: GitProviderType | null
  owner: string
  repo: string
  branch: string
  rootDir: string
  pullRequest?: RepositoryPullRequestOptions
  /**
   * Can be used to specify the instance URL for self-hosted GitLab instances.
   * @default 'https://gitlab.com'
   */
  instanceUrl?: string
}

export interface GitBaseOptions {
  owner: string
  repo: string
  branch: string
  authorName: string
  authorEmail: string
}

export interface GitOptions extends GitBaseOptions {
  provider: GitProviderType | null
  rootDir: string
  token: string
  instanceUrl?: string
  pullRequest?: RepositoryPullRequestOptions
}

export interface CommitFilesOptions extends GitBaseOptions {
  files: RawFile[]
  message: string
}

export interface RawFile {
  path: string
  content: string | null
  status: DraftStatus
  encoding?: 'utf-8' | 'base64'
}

export type ReviewRequestKind = 'pull-request' | 'merge-request'

export type ReviewRequestState = 'created' | 'existing'

export interface EnsureReviewRequestOptions {
  title: string
  head: string
  base: string
  body?: string
  commitUrl?: string
}

export interface ReviewRequestResult {
  kind: ReviewRequestKind
  state: ReviewRequestState
  url: string
  head: string
  base: string
  number?: number
  iid?: number
}

export interface GitProviderAPI {
  fetchFile(path: string, options?: { cached?: boolean }): Promise<GitFile | null>
  commitFiles(files: RawFile[], message: string): Promise<CommitResult | null>
  ensureReviewRequest(options: EnsureReviewRequestOptions): Promise<ReviewRequestResult | null>
  getRepositoryUrl(): string
  getBranchUrl(): string
  getCommitUrl(sha: string): string
  getFileUrl(feature: StudioFeature, fsPath: string): string
  getRepositoryInfo(): { owner: string, repo: string, branch: string, provider: GitProviderType | null }
}

export interface CommitResult {
  success: boolean
  commitSha: string
  url: string
}

export interface GitFile {
  provider: GitProviderType
  name: string
  path: string
  sha: string
  size: number
  url: string
  content?: string
  encoding?: 'utf-8' | 'base64'
}

export interface GithubFile extends GitFile {
  html_url: string
  git_url: string
  download_url: string
  type: string
  _links: {
    self: string
    git: string
    html: string
  }
}

export interface GitLabFile extends GitFile {
  file_path: string
  ref: string
  blob_id: string
  commit_id: string
  last_commit_id: string
}
