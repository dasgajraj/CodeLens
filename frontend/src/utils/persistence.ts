import type { RootState } from '../app/store'
import type { AuthState } from '../features/auth/authSlice'
import type { ReviewsState } from '../features/reviews/reviewsSlice'
import { normalizeReview } from './reviewNormalization'

const STORAGE_KEY = 'codelens-state'

type PersistedState = {
  auth: Pick<AuthState, 'user' | 'accessToken' | 'refreshToken'>
  reviews: Pick<ReviewsState, 'items' | 'selectedReviewId'>
}

export function loadState():
  | {
      auth: AuthState
      reviews: ReviewsState
    }
  | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return undefined
    }

    const parsed = JSON.parse(raw) as PersistedState
    return {
      auth: {
        ...parsed.auth,
        status: parsed.auth.accessToken || parsed.auth.refreshToken ? 'checking' : 'guest',
        health: 'idle',
        error: null,
        bootstrapped: false,
      },
      reviews: {
        items: (parsed.reviews.items ?? []).map(normalizeReview),
        selectedReviewId: parsed.reviews.selectedReviewId ?? null,
        status: 'idle',
        submitStatus: 'idle',
        error: null,
      },
    }
  } catch {
    return undefined
  }
}

export function saveState(state: RootState) {
  const payload: PersistedState = {
    auth: {
      user: state.auth.user,
      accessToken: state.auth.accessToken,
      refreshToken: state.auth.refreshToken,
    },
    reviews: {
      items: state.reviews.items,
      selectedReviewId: state.reviews.selectedReviewId,
    },
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}
