import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import { useBackendWarmup } from './hooks/useBackendWarmup'
import { LoadingScreen } from './components/LoadingScreen'
import { HomePage, ThemeMode } from './pages/HomePage'
import { AuthPage } from './pages/AuthPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { AuthTokens, AuthUser } from './types/auth'
import { getApiBaseUrl, mapAxiosError, reviewApi, setAuthToken } from './lib/api'

type AuthState = {
  user: AuthUser | null
  tokens: AuthTokens | null
}

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Auth', path: '/auth' },
  { label: 'Reviews', path: '/reviews' },
  { label: 'System', path: '/system' },
]

const SystemPage = ({ latencyMs, lastCheckedAt }: { latencyMs?: number | null; lastCheckedAt?: Date }) => (
  <div className="page-shell">
    <div className="page-header">
      <div>
        <p className="section-label">System</p>
        <h2>Backend diagnostics</h2>
      </div>
      <span className="badge">Base URL: {getApiBaseUrl()}</span>
    </div>
    <div className="surface section-block">
      <p>Last health check: {lastCheckedAt ? lastCheckedAt.toLocaleString() : 'Unavailable'}</p>
      <p>Latency: {latencyMs ? `${latencyMs}ms` : 'Not measured yet'}</p>
      <p className="muted">Use the navigation bar to trigger live API calls.</p>
    </div>
  </div>
)

function AppShell() {
  const warmup = useBackendWarmup()
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [authState, setAuthState] = useState<AuthState>({ user: null, tokens: null })
  const [reviewStats, setReviewStats] = useState<{ total: number; latestTitle?: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem('codelens-auth')
    if (!stored) return
    try {
      const parsed: AuthState = JSON.parse(stored)
      setAuthState(parsed)
      setAuthToken(parsed.tokens?.accessToken ?? null)
    } catch (error) {
      console.warn('Failed to parse stored auth state', error)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    setAuthToken(authState.tokens?.accessToken ?? null)
    if (authState.tokens) {
      localStorage.setItem('codelens-auth', JSON.stringify(authState))
    } else {
      localStorage.removeItem('codelens-auth')
    }
  }, [authState])

  useEffect(() => {
    if (!authState.tokens?.accessToken) {
      setReviewStats(undefined)
      return
    }
    let isMounted = true
    reviewApi
      .listMine()
      .then(({ data }) => {
        if (!isMounted) return
        const total = Array.isArray(data) ? data.length : 0
        const latestTitle = Array.isArray(data) && data.length ? data[0].title : undefined
        setReviewStats({ total, latestTitle })
      })
      .catch((error) => console.error('Failed to fetch review stats', mapAxiosError(error)))
    return () => {
      isMounted = false
    }
  }, [authState.tokens?.accessToken])

  const handleAuthSuccess = ({ user, tokens }: { user?: AuthUser; tokens: AuthTokens }) => {
    setAuthState((current) => ({ user: user ?? current.user, tokens }))
  }

  const handleLogout = () => {
    setAuthToken(null)
    setAuthState({ user: null, tokens: null })
  }

  const gateStatus = warmup.state === 'idle' ? 'warming' : warmup.state
  const normalizedStatus: 'warming' | 'ready' | 'error' =
    gateStatus === 'ready' ? 'ready' : gateStatus === 'error' ? 'error' : 'warming'

  if (normalizedStatus !== 'ready') {
    return (
      <LoadingScreen
        status={normalizedStatus}
        latencyMs={warmup.latencyMs}
        message={warmup.error}
        onRetry={warmup.refresh}
      />
    )
  }

  return (
    <div className="app-container">
        <header className="nav-shell surface glass-panel">
          <div className="brand">
            <span className="brand-dot" />
            <div>
              <strong>CodeLens</strong>
              <p>API-native dashboard</p>
            </div>
          </div>
          <nav>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-cta">
            <button className="ghost-button compact" type="button" onClick={() => setTheme((mode) => (mode === 'dark' ? 'light' : 'dark'))}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <span className="badge">{authState.user ? authState.user.email : 'Guest session'}</span>
          </div>
        </header>

        <Routes>
          <Route
            index
            element={
              <HomePage
                theme={theme}
                isAuthenticated={Boolean(authState.user)}
                onToggleTheme={() => setTheme((mode) => (mode === 'dark' ? 'light' : 'dark'))}
                onSignOut={authState.user ? handleLogout : undefined}
                onNavigateAuth={() => navigate('/auth')}
                backendLatency={warmup.latencyMs}
                reviewStats={reviewStats}
              />
            }
          />
          <Route
            path="/auth"
            element={
              <AuthPage
                onAuthSuccess={handleAuthSuccess}
                onLogout={handleLogout}
                currentUser={authState.user}
                tokens={authState.tokens}
              />
            }
          />
          <Route path="/reviews" element={<ReviewsPage tokens={authState.tokens} />} />
          <Route path="/system" element={<SystemPage latencyMs={warmup.latencyMs} lastCheckedAt={warmup.lastCheckedAt} />} />
        </Routes>
      </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
