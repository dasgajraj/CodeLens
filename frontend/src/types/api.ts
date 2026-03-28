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

export type ReviewAiSuggestions = {
  summary: string
  criticalBugs: string[]
  optimizations: string[]
  score: number
  correctedCode: string
}

export type Review = {
  _id: string
  title: string
  code: string
  language: string
  githubUrl: string
  userId: string
  status?: string
  aiSuggestions: ReviewAiSuggestions
  createdAt: string
}

export type HealthResponse = {
  status: boolean
  timestamp: string
}
