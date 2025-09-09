export interface StudioUser {
  githubId: string
  githubToken: string
  name: string
  avatar: string
  email: string
  provider: 'github' | 'google'
}
