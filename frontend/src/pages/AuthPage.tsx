import { useEffect, useState } from 'react'
import { ArrowRight, LockKeyhole, Orbit, Sparkles, UserPlus2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { signIn, signUp } from '../features/auth/authSlice'

type AuthMode = 'signin' | 'signup'

export function AuthPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error, health } = useAppSelector((state) => state.auth)
  const [mode, setMode] = useState<AuthMode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/workspace', { replace: true })
    }
  }, [navigate, status])

  const isBusy = status === 'checking'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (mode === 'signin') {
      await dispatch(signIn({ email, password }))
      return
    }

    await dispatch(signUp({ name, email, password }))
  }

  return (
    <main className="auth-layout">
      <section className="auth-showcase surface">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          Animated identity flow
        </div>
        <h1>Authentication that feels built for the product, not pasted into it.</h1>
        <p>
          CodeLens wakes the backend, validates your token pair, and lands you directly
          in the review workspace without forcing unnecessary sign-ins.
        </p>

        <div className="feature-column">
          <article className="feature-card">
            <Orbit size={18} />
            <div>
              <strong>Health-first boot</strong>
              <p>Waits for `/health` with a longer timeout before identity checks begin.</p>
            </div>
          </article>
          <article className="feature-card">
            <LockKeyhole size={18} />
            <div>
              <strong>Token-aware reloads</strong>
              <p>Runs `who am I`, then refreshes only when the access token is stale.</p>
            </div>
          </article>
          <article className="feature-card">
            <Sparkles size={18} />
            <div>
              <strong>Motion-led navigation</strong>
              <p>Panels slide and fade instead of snapping between auth and workspace.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="auth-panel glass-panel">
        <div className="mode-switch" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={`mode-pill ${mode === 'signin' ? 'is-active' : ''}`}
            onClick={() => setMode('signin')}
          >
            <ArrowRight size={14} />
            Sign in
          </button>
          <button
            type="button"
            className={`mode-pill ${mode === 'signup' ? 'is-active' : ''}`}
            onClick={() => setMode('signup')}
          >
            <UserPlus2 size={14} />
            Sign up
          </button>
        </div>

        <div className="auth-form-wrap">
          <div className={`auth-form-slider ${mode === 'signup' ? 'show-signup' : ''}`}>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div>
                <p className="section-label">Session access</p>
                <h2>{mode === 'signin' ? 'Welcome back' : 'Create your developer vault'}</h2>
                <p>
                  Backend status: <span className="inline-accent">{health}</span>
                </p>
              </div>

              {mode === 'signup' ? (
                <label className="field">
                  <span>Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="A careful engineer"
                    required
                  />
                </label>
              ) : null}

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@codelens.dev"
                  required
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </label>

              {error ? <p className="error-banner">{error}</p> : null}

              <button className="primary-button full-width" type="submit" disabled={isBusy}>
                {isBusy ? 'Checking session...' : mode === 'signin' ? 'Enter workspace' : 'Create account'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
