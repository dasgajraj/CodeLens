import { apiClient } from './client'
import type { Review } from '../../types/api'
import { normalizeReview } from '../../utils/reviewNormalization'

export const reviewApi = {
  async getAll(accessToken: string): Promise<Review[]> {
    const response = await apiClient.get<Review[]>('/api/reviews/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return response.data.map(normalizeReview)
  },

  async getOne(reviewId: string, accessToken: string): Promise<Review> {
    const response = await apiClient.get<Review>(`/api/reviews/${reviewId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return normalizeReview(response.data)
  },

  async createGithub(
    payload: { title: string; url: string; language?: string },
    accessToken: string,
  ): Promise<Review> {
    const response = await apiClient.post<{ message: string; review: Review }>(
      '/api/reviews',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(payload.language ? { 'x-language': payload.language } : {}),
        },
      },
    )
    return normalizeReview(response.data.review)
  },

  async createRaw(
    payload: { code: string; language?: string },
    accessToken: string,
  ): Promise<Review> {
    const response = await apiClient.post<{ message: string; review: Review }>(
      '/api/reviews',
      payload.code,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/plain',
          ...(payload.language ? { 'x-language': payload.language } : {}),
        },
      },
    )
    return normalizeReview(response.data.review)
  },

  async remove(reviewId: string, accessToken: string): Promise<void> {
    await apiClient.delete(`/api/reviews/${reviewId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  },
}
