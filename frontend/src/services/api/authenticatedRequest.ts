import axios from 'axios'
import { applyRefreshedTokens, signOut } from '../../features/auth/authSlice'
import { authApi } from './authApi'
import { extractErrorMessage } from '../../utils/errors'
import type { RootState } from '../../app/store'

type ThunkApi = {
  dispatch: (action: unknown) => unknown
  getState: () => RootState
}

export async function runAuthorized<T>(
  thunkApi: ThunkApi,
  request: (accessToken: string) => Promise<T>,
): Promise<T> {
  const state = thunkApi.getState()
  const accessToken = state.auth.accessToken
  const refreshToken = state.auth.refreshToken

  if (!accessToken && !refreshToken) {
    throw new Error('No active session found')
  }

  if (accessToken) {
    try {
      return await request(accessToken)
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 401 || !refreshToken) {
        throw error
      }
    }
  }

  if (!refreshToken) {
    throw new Error('Session expired')
  }

  try {
    const refreshed = await authApi.refresh(refreshToken, accessToken)
    thunkApi.dispatch(applyRefreshedTokens(refreshed.tokens))
    return await request(refreshed.tokens.accessToken)
  } catch (error) {
    await thunkApi.dispatch(signOut())
    throw new Error(extractErrorMessage(error))
  }
}
