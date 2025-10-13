import type { DraftStatus } from './draft'

export interface Repository {
  provider: 'github'
  owner: string
  repo: string
  branch: string
  rootDir: string
}

export interface GitBaseOptions {
  owner: string
  repo: string
  branch: string
  authorName: string
  authorEmail: string
}

export interface GitOptions extends GitBaseOptions {
  rootDir: string
  token: string
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

// GITHUB
export interface GithubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
  content?: string
  encoding?: string
  _links: {
    self: string
    git: string
    html: string
  }
}
