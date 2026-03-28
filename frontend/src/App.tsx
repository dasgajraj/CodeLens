import { useEffect, useRef } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Activity, Bot, Command, ShieldCheck } from 'lucide-react'
import './App.css'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { bootstrapSession } from './features/auth/authSlice'
import { AuthPage } from './pages/AuthPage'
import { WorkspacePage } from './pages/WorkspacePage'

function RouteStage() {
  const location = useLocation()

  return (
    <div className="route-stage" key={location.pathname}>
      <Outlet />
    </div>
  )
}

function ProtectedRoute() {
  const authStatus = useAppSelector((state) => state.auth.status)
  if (authStatus !== 'authenticated') {
    return <Navigate to="/auth" replace />
  }

  return <RouteStage />
}

function RootRedirect() {
  const authStatus = useAppSelector((state) => state.auth.status)
  return <Navigate to={authStatus === 'authenticated' ? '/workspace' : '/auth'} replace />
}

function BootScreen() {
  return (
    <div className="boot-screen">
      <div className="boot-card glass-panel">
        <span className="boot-pulse" />
        <p className="section-label">Boot sequence</p>
        <h1>Waking CodeLens and validating your session.</h1>
        <p>
          The app is waiting for backend health, then verifying your identity before
          opening the workspace.
        </p>
      </div>
    </div>
  )
}

function AppChrome() {
  const { health, user } = useAppSelector((state) => state.auth)

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <header className="topbar">
        <div className="brand-mark">
          <div className="brand-orb">
            <Bot size={18} />
          </div>
          <div>
            <p className="section-label">Developer Intelligence</p>
            <strong>CodeLens</strong>
          </div>
        </div>

        <nav className="topnav" aria-label="Primary navigation">
          <NavLink
            to="/workspace"
            className={({ isActive }) => `topnav-link ${isActive ? 'is-active' : ''}`}
          >
            <Command size={15} />
            Review fabric
          </NavLink>
          <NavLink
            to="/auth"
            className={({ isActive }) => `topnav-link ${isActive ? 'is-active' : ''}`}
          >
            <ShieldCheck size={15} />
            Identity vault
          </NavLink>
        </nav>

        <div className="topbar-status">
          <span className={`status-pill ${health === 'online' ? 'status-pill-live' : ''}`}>
            <Activity size={14} />
            API {health}
          </span>
          <span className="status-pill">{user?.email ?? 'guest@codelens.dev'}</span>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route element={<RouteStage />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/workspace" element={<WorkspacePage />} />
        </Route>
      </Routes>
    </div>
  )
}

function App() {
  const dispatch = useAppDispatch()
  const bootstrapped = useAppSelector((state) => state.auth.bootstrapped)
  const hasStartedBootstrap = useRef(false)

  useEffect(() => {
    if (hasStartedBootstrap.current) {
      return
    }

    hasStartedBootstrap.current = true
    void dispatch(bootstrapSession())
  }, [dispatch])

  if (!bootstrapped) {
    return <BootScreen />
  }

  return <AppChrome />
}

export default App
