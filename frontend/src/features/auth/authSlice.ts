import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import type { RootState } from '../../app/store'
import { authApi } from '../../services/api/authApi'
import { extractErrorMessage } from '../../utils/errors'
import type { AuthResponse, AuthTokens, AuthUser } from '../../types/api'

type AuthStatus = 'checking' | 'authenticated' | 'guest'
type HealthStatus = 'idle' | 'checking' | 'online' | 'offline'

export type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  status: AuthStatus
  health: HealthStatus
  error: string | null
  bootstrapped: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'checking',
  health: 'idle',
  error: null,
  bootstrapped: false,
}

function applyAuthPayload(state: AuthState, payload: { user: AuthUser; tokens: AuthTokens }) {
  state.user = payload.user
  state.accessToken = payload.tokens.accessToken
  state.refreshToken = payload.tokens.refreshToken
  state.status = 'authenticated'
  state.error = null
}

export const refreshSession = createAsyncThunk<
  AuthTokens,
  void,
  { state: RootState; rejectValue: string }
>('auth/refreshSession', async (_, { getState, rejectWithValue }) => {
  const { refreshToken, accessToken } = getState().auth
  if (!refreshToken) {
    return rejectWithValue('Missing refresh token')
  }

  try {
    const response = await authApi.refresh(refreshToken, accessToken)
    return response.tokens
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const bootstrapSession = createAsyncThunk<
  { user: AuthUser | null; tokens?: AuthTokens },
  void,
  { state: RootState; rejectValue: string }
>('auth/bootstrapSession', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    await authApi.waitForHealth()
    dispatch(setHealth('online'))
  } catch (error) {
    dispatch(setHealth('offline'))
    return rejectWithValue(extractErrorMessage(error))
  }

  const state = getState().auth
  if (!state.refreshToken && !state.accessToken) {
    return { user: null }
  }

  if (state.accessToken) {
    try {
      const response = await authApi.me(state.accessToken)
      return { user: response.user }
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        return rejectWithValue(extractErrorMessage(error))
      }
    }
  }

  if (!state.refreshToken) {
    return { user: null }
  }

  try {
    const refreshed = await dispatch(refreshSession()).unwrap()
    const me = await authApi.me(refreshed.accessToken)
    return { user: me.user, tokens: refreshed }
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const signIn = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>('auth/signIn', async (payload, { rejectWithValue }) => {
  try {
    return await authApi.signIn(payload)
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const signUp = createAsyncThunk<
  AuthResponse,
  { name: string; email: string; password: string },
  { rejectValue: string }
>('auth/signUp', async (payload, { rejectWithValue }) => {
  try {
    return await authApi.signUp(payload)
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const signOut = createAsyncThunk<void, void, { state: RootState }>(
  'auth/signOut',
  async (_, { getState }) => {
    const { refreshToken, accessToken } = getState().auth
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken, accessToken)
      } catch {
        // Client state still needs clearing even if logout fails remotely.
      }
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthState: () => initialState,
    setHealth: (state, action: PayloadAction<HealthStatus>) => {
      state.health = action.payload
    },
    applyRefreshedTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.status = 'authenticated'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.status = 'checking'
        state.health = 'checking'
        state.error = null
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.bootstrapped = true
        state.health = 'online'

        if (!action.payload.user) {
          state.user = null
          state.accessToken = null
          state.refreshToken = null
          state.status = 'guest'
          return
        }

        state.user = action.payload.user
        if (action.payload.tokens) {
          state.accessToken = action.payload.tokens.accessToken
          state.refreshToken = action.payload.tokens.refreshToken
        }
        state.status = 'authenticated'
      })
      .addCase(bootstrapSession.rejected, (state, action) => {
        state.bootstrapped = true
        state.status = 'guest'
        state.error = action.payload ?? 'Failed to initialize session'
      })
      .addCase(signIn.fulfilled, (state, action) => {
        applyAuthPayload(state, action.payload)
      })
      .addCase(signUp.fulfilled, (state, action) => {
        applyAuthPayload(state, action.payload)
      })
      .addCase(signIn.rejected, (state, action) => {
        state.error = action.payload ?? 'Unable to sign in'
      })
      .addCase(signUp.rejected, (state, action) => {
        state.error = action.payload ?? 'Unable to sign up'
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.status = 'authenticated'
        state.error = null
      })
      .addCase(refreshSession.rejected, (state, action) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.status = 'guest'
        state.error = action.payload ?? 'Session refresh failed'
      })
      .addCase(signOut.fulfilled, () => ({
        ...initialState,
        bootstrapped: true,
        status: 'guest' as const,
      }))
  },
})

export const { clearAuthState, setHealth, applyRefreshedTokens } = authSlice.actions
export default authSlice.reducer
