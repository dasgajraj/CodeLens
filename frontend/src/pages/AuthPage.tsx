import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { authApi, mapAxiosError, setAuthToken } from '../lib/api'
import type { AuthResponse, AuthTokens, AuthUser } from '../types/auth'
import '../App.css'

type AuthPageProps = {
  onAuthSuccess: (payload: { user?: AuthUser; tokens: AuthTokens }) => void
  onLogout: () => void
  currentUser: AuthUser | null
  tokens: AuthTokens | null
}

type FormState<T> = {
  values: T
  loading: boolean
  error?: string
  result?: string
}

const createInitialFormState = <T,>(values: T): FormState<T> => ({
  values,
  loading: false,
})

export const AuthPage = ({ onAuthSuccess, onLogout, currentUser, tokens }: AuthPageProps) => {
  const [signupForm, setSignupForm] = useState(
    createInitialFormState({ name: 'Das Gajraj', email: 'dasgajraj@gmail.com', password: 'dasgajraj' }),
  )
  const [loginForm, setLoginForm] = useState(createInitialFormState({ email: 'dasgajraj@gmail.com', password: 'dasgajraj' }))
  const [refreshForm, setRefreshForm] = useState(createInitialFormState({ refreshToken: tokens?.refreshToken ?? '' }))

  useEffect(() => {
    setRefreshForm((state) => ({ ...state, values: { ...state.values, refreshToken: tokens?.refreshToken ?? '' } }))
  }, [tokens?.refreshToken])

  const handleSubmit = async <T extends object,>(
    event: FormEvent<HTMLFormElement>,
    form: FormState<T>,
    updater: (state: FormState<T>) => void,
    action: () => Promise<AuthResponse | { message: string; tokens?: AuthTokens; user?: AuthUser }>,
  ) => {
    event.preventDefault()
    updater({ ...form, loading: true, error: undefined, result: undefined })
    try {
      const response = await action()
      updater({ ...form, loading: false, result: response.message })
      if ('tokens' in response && response.tokens) {
        setAuthToken(response.tokens.accessToken)
        onAuthSuccess({ user: response.user, tokens: response.tokens })
      }
    } catch (error) {
      const mapped = mapAxiosError(error)
      updater({ ...form, loading: false, error: mapped.message })
    }
  }

  const isAuthenticated = Boolean(currentUser)

  const helperText = useMemo(() => {
    if (isAuthenticated) {
      return `Signed in as ${currentUser?.name} (${currentUser?.email})`
    }
    return 'Authenticate to access protected review endpoints'
  }, [currentUser?.email, currentUser?.name, isAuthenticated])

  const renderForm = <T extends Record<string, string>>(
    label: string,
    description: string,
    form: FormState<T>,
    updater: (state: FormState<T>) => void,
    fields: Array<{ name: keyof T; type?: string; placeholder?: string }>,
    action: () => Promise<AuthResponse | { message: string; tokens?: AuthTokens; user?: AuthUser }>,
    cta = label,
  ) => (
    <form
      className="api-form surface"
      onSubmit={(event) => handleSubmit<T>(event, form, updater, action)}
      aria-label={label}
    >
      <header>
        <h3>{label}</h3>
        <p>{description}</p>
      </header>

      <div className="form-grid">
        {fields.map(({ name, type = 'text', placeholder }) => (
          <label key={String(name)} className="form-field">
            <span>{String(name)}</span>
            <input
              type={type}
              value={form.values[name] ?? ''}
              placeholder={placeholder}
              onChange={(event) =>
                updater({ ...form, values: { ...form.values, [name]: event.target.value } as T })
              }
            />
          </label>
        ))}
      </div>

      <button className="primary-button" type="submit" disabled={form.loading}>
        {form.loading ? 'Calling API…' : cta}
      </button>

      {form.error ? <p className="form-error">{form.error}</p> : null}
      {form.result ? <p className="form-success">{form.result}</p> : null}
    </form>
  )

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="section-label">Auth</p>
          <h2>Control your backend tokens</h2>
        </div>
        <span className="badge">{helperText}</span>
      </div>

      <div className="page-grid">
        {renderForm(
          'Sign up',
          'Provision a new reviewer account.',
          signupForm,
          setSignupForm,
          [
            { name: 'name', placeholder: 'Das Gajraj' },
            { name: 'email', type: 'email', placeholder: 'you@example.com' },
            { name: 'password', type: 'password', placeholder: 'Strong password' },
          ],
          () => authApi.signup(signupForm.values).then((response) => response.data as AuthResponse),
          'Create account',
        )}

        {renderForm(
          'Sign in',
          'Exchange credentials for access + refresh tokens.',
          loginForm,
          setLoginForm,
          [
            { name: 'email', type: 'email' },
            { name: 'password', type: 'password' },
          ],
          () => authApi.login(loginForm.values).then((response) => response.data as AuthResponse),
          'Sign in & store tokens',
        )}

        {renderForm(
          'Refresh token',
          'Rotate access tokens by sending your refresh token.',
          refreshForm,
          setRefreshForm,
          [{ name: 'refreshToken', placeholder: 'Paste refresh token' }],
          () => authApi.refresh({ refreshToken: refreshForm.values.refreshToken }).then((response) => response.data as { message: string; tokens?: AuthTokens }),
          'Refresh access token',
        )}

        <div className="api-form surface">
          <header>
            <h3>Logout</h3>
            <p>Invalidate the current refresh token.</p>
          </header>
          <button
            className="ghost-button"
            type="button"
            disabled={!tokens?.refreshToken}
            onClick={async () => {
              if (!tokens?.refreshToken) return
              try {
                await authApi.logout({ refreshToken: tokens.refreshToken })
                setAuthToken(null)
                onLogout()
              } catch (error) {
                const mapped = mapAxiosError(error)
                alert(mapped.message)
              }
            }}
          >
            {tokens?.refreshToken ? 'Logout from backend' : 'Refresh token unavailable'}
          </button>
        </div>
      </div>
    </div>
  )
}
