const fallbackApiBaseUrl = 'http://localhost:5000'

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || fallbackApiBaseUrl,
}
