import { LogOut, Mail, ShieldCheck, UserCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { signOut } from '../features/auth/authSlice'

export function UserPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const auth = useAppSelector((state) => state.auth)

  const handleLogout = async () => {
    await dispatch(signOut())
    navigate('/auth', { replace: true })
  }

  return (
    <main className="profile-grid">
      <section className="hero-panel surface">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            User profile
          </div>
          <h1>Account, session, and token state in one place.</h1>
          <p>
            This page keeps the personal and session information out of the home page and
            the review studio, while still making logout and token status easy to find.
          </p>
        </div>
      </section>

      <section className="surface profile-card">
        <article className="metric-card">
          <div className="metric-icon">
            <UserCircle2 size={18} />
          </div>
          <div>
            <p className="metric-label">Name</p>
            <strong>{auth.user?.name || 'Unknown user'}</strong>
            <span>User id: {auth.user?.id ?? 'Unavailable'}</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon">
            <Mail size={18} />
          </div>
          <div>
            <p className="metric-label">Email</p>
            <strong>{auth.user?.email || 'Unavailable'}</strong>
            <span>This email also links here from the global navbar.</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="metric-label">Session status</p>
            <strong>{auth.status}</strong>
            <span>
              Access token {auth.accessToken ? 'loaded' : 'missing'}, refresh token{' '}
              {auth.refreshToken ? 'ready' : 'missing'}.
            </span>
          </div>
        </article>

        <button className="primary-button" type="button" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </section>
    </main>
  )
}
