export interface StudioUser {
  providerId: string
  accessToken: string
  name: string
  avatar: string
  email: string
  provider: 'github' | 'gitlab' | 'google'
}
