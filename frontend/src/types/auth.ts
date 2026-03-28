export type AuthUser = {
  id: string
  name: string
  email: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type AuthResponse = {
  message: string
  user: AuthUser
  tokens: AuthTokens
}
