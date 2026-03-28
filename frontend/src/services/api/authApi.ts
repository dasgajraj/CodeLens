import { apiClient } from './client'
import type { AuthResponse, AuthTokens, AuthUser, HealthResponse } from '../../types/api'

const HEALTH_ATTEMPTS = 4
const HEALTH_TIMEOUT_MS = 15000

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export const authApi = {
  async waitForHealth(): Promise<HealthResponse> {
    let lastError: unknown

    for (let attempt = 0; attempt < HEALTH_ATTEMPTS; attempt += 1) {
      try {
        const response = await apiClient.get<HealthResponse>('/health', {
          timeout: HEALTH_TIMEOUT_MS,
        })
        return response.data
      } catch (error) {
        lastError = error
        await delay(700 * (attempt + 1))
      }
    }

    throw lastError ?? new Error('Backend health check failed')
  },

  async signUp(payload: {
    name: string
    email: string
    password: string
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/signup', payload)
    return response.data
  },

  async signIn(payload: { email: string; password: string }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', payload)
    return response.data
  },

  async refresh(refreshToken: string, accessToken?: string | null): Promise<{ tokens: AuthTokens }> {
    const response = await apiClient.post<{ message: string; tokens: AuthTokens }>(
      '/api/auth/refresh',
      { refreshToken },
      {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      },
    )

    return { tokens: response.data.tokens }
  },

  async logout(refreshToken: string, accessToken?: string | null): Promise<void> {
    await apiClient.post(
      '/api/auth/logout',
      { refreshToken },
      {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      },
    )
  },

  async me(accessToken: string): Promise<{ user: AuthUser }> {
    const response = await apiClient.get<{ user: AuthUser }>('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return response.data
  },
}
