import axios from 'axios'
import { env } from '../../config/env'

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === 'get') {
    config.params = {
      ...(config.params ?? {}),
      _t: Date.now(),
    }
  }

  return config
})
