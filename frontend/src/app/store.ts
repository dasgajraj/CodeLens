import { configureStore } from '@reduxjs/toolkit'
import authReducer, { type AuthState } from '../features/auth/authSlice'
import reviewsReducer, { type ReviewsState } from '../features/reviews/reviewsSlice'
import { loadState, saveState } from '../utils/persistence'

export type RootState = {
  auth: AuthState
  reviews: ReviewsState
}

const preloadedState = loadState()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reviews: reviewsReducer,
  },
  ...(preloadedState ? { preloadedState } : {}),
})

store.subscribe(() => {
  saveState(store.getState())
})

export type AppDispatch = typeof store.dispatch
