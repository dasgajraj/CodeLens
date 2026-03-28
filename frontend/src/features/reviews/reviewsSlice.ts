import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { runAuthorized } from '../../services/api/authenticatedRequest'
import { reviewApi } from '../../services/api/reviewApi'
import type { Review } from '../../types/api'
import { extractErrorMessage } from '../../utils/errors'

export type ReviewsState = {
  items: Review[]
  selectedReviewId: string | null
  status: 'idle' | 'loading' | 'ready'
  submitStatus: 'idle' | 'submitting'
  error: string | null
}

const initialState: ReviewsState = {
  items: [],
  selectedReviewId: null,
  status: 'idle',
  submitStatus: 'idle',
  error: null,
}

export const fetchReviews = createAsyncThunk<Review[], void, { state: RootState }>(
  'reviews/fetchAll',
  async (_, thunkApi) => {
    try {
      return await runAuthorized(thunkApi, (token) => reviewApi.getAll(token))
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  },
)

export const fetchReviewById = createAsyncThunk<Review, string, { state: RootState }>(
  'reviews/fetchById',
  async (reviewId, thunkApi) => {
    try {
      return await runAuthorized(thunkApi, (token) => reviewApi.getOne(reviewId, token))
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  },
)

export const createGithubReview = createAsyncThunk<
  Review,
  { title: string; url: string; language?: string },
  { state: RootState }
>('reviews/createGithub', async (payload, thunkApi) => {
  try {
    return await runAuthorized(thunkApi, (token) => reviewApi.createGithub(payload, token))
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
})

export const createRawReview = createAsyncThunk<
  Review,
  { code: string; language?: string },
  { state: RootState }
>('reviews/createRaw', async (payload, thunkApi) => {
  try {
    return await runAuthorized(thunkApi, (token) => reviewApi.createRaw(payload, token))
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
})

export const deleteReview = createAsyncThunk<string, string, { state: RootState }>(
  'reviews/delete',
  async (reviewId, thunkApi) => {
    try {
      await runAuthorized(thunkApi, (token) => reviewApi.remove(reviewId, token))
      return reviewId
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  },
)

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    selectReview: (state, action: { payload: string | null }) => {
      state.selectedReviewId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.status = 'ready'
        state.items = action.payload
        if (!state.selectedReviewId && action.payload[0]) {
          state.selectedReviewId = action.payload[0]._id
        }
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.status = 'ready'
        state.error = action.error.message ?? 'Failed to fetch reviews'
      })
      .addCase(fetchReviewById.fulfilled, (state, action) => {
        const existingIndex = state.items.findIndex((item) => item._id === action.payload._id)
        if (existingIndex >= 0) {
          state.items[existingIndex] = action.payload
        } else {
          state.items.unshift(action.payload)
        }
        state.selectedReviewId = action.payload._id
      })
      .addCase(createGithubReview.pending, (state) => {
        state.submitStatus = 'submitting'
        state.error = null
      })
      .addCase(createRawReview.pending, (state) => {
        state.submitStatus = 'submitting'
        state.error = null
      })
      .addCase(createGithubReview.fulfilled, (state, action) => {
        state.submitStatus = 'idle'
        state.items.unshift(action.payload)
        state.selectedReviewId = action.payload._id
      })
      .addCase(createRawReview.fulfilled, (state, action) => {
        state.submitStatus = 'idle'
        state.items.unshift(action.payload)
        state.selectedReviewId = action.payload._id
      })
      .addCase(createGithubReview.rejected, (state, action) => {
        state.submitStatus = 'idle'
        state.error = action.error.message ?? 'Failed to create review'
      })
      .addCase(createRawReview.rejected, (state, action) => {
        state.submitStatus = 'idle'
        state.error = action.error.message ?? 'Failed to create review'
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload)
        if (state.selectedReviewId === action.payload) {
          state.selectedReviewId = state.items[0]?._id ?? null
        }
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to delete review'
      })
  },
})

export const { selectReview } = reviewsSlice.actions
export default reviewsSlice.reducer
