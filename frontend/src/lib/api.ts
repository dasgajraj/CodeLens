import axios from 'axios'

export type ApiError = {
  message: string
  status?: number
  details?: unknown
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export const mapAxiosError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.message ?? error.message,
      status: error.response?.status,
      details: error.response?.data,
    }
  }

  return {
    message: error instanceof Error ? error.message : 'Unexpected error',
  }
}

export const wakeBackend = async () => api.get('/health')

export const authApi = {
  signup: (payload: { name: string; email: string; password: string }) =>
    api.post('/api/auth/signup', payload),
  login: (payload: { email: string; password: string }) => api.post('/api/auth/login', payload),
  refresh: (payload: { refreshToken: string }) => api.post('/api/auth/refresh', payload),
  logout: (payload: { refreshToken: string }) => api.post('/api/auth/logout', payload),
  me: () => api.get('/api/auth/me'),
}

export const reviewApi = {
  listMine: () => api.get('/api/reviews/user/'),
  byId: (id: string) => api.get(`/api/reviews/${id}`),
  createFromGithub: (payload: { title: string; url: string; language: string }) =>
    api.post('/api/reviews', payload, {
      headers: { 'x-language': payload.language },
    }),
  createRaw: (code: string) => api.post('/api/reviews', code, { headers: { 'Content-Type': 'text/plain' } }),
  delete: (id: string) => api.delete(`/api/reviews/${id}`),
}

export const getApiBaseUrl = () => API_BASE_URL
