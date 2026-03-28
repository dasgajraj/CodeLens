import { useState } from 'react'
import { KeyRound, LogOut, Mail, ShieldCheck, UserCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { signOut } from '../features/auth/authSlice'

export function UserPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const auth = useAppSelector((state) => state.auth)
  const reviews = useAppSelector((state) => state.reviews.items)
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  const handleLogout = async () => {
    setConfirmingLogout(false)
    await dispatch(signOut())
    navigate('/auth', { replace: true })
  }

  const identityRows = [
    { label: 'Name', value: auth.user?.name ?? 'Unknown user' },
    { label: 'Email', value: auth.user?.email ?? 'Unavailable' },
    { label: 'Session', value: auth.status },
  ]

  const tokenRows = [
    {
      label: 'Access token',
      value: auth.accessToken ? 'Active' : 'Missing',
      meta: auth.accessToken ? 'API calls will authenticate' : 'Requests fall back to guest mode',
      status: auth.accessToken ? 'ready' : 'missing',
    },
    {
      label: 'Refresh token',
      value: auth.refreshToken ? 'Issued' : 'Missing',
      meta: auth.refreshToken ? 'Session can silently renew' : 'Manual login required when expired',
      status: auth.refreshToken ? 'ready' : 'missing',
    },
  ]

  return (
    <main className="profile-grid">
      <section className="hero-panel surface profile-hero">
        <div className="profile-hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Account center
          </div>
          <h1>Keep session health, identity, and actions in one glance.</h1>
          <p>
            All authentication data lives here so the home page and review workspace stay focused on
            code. Check token state, confirm who is signed in, and log out without digging through
            settings.
          </p>
          <div className="profile-hero-badges">
            <span className={`status-pill ${auth.status === 'authenticated' ? 'status-pill-live' : ''}`}>
              <ShieldCheck size={14} /> {auth.status}
            </span>
            <span className="status-pill profile-muted-pill">
              <Mail size={14} /> {auth.user?.email ?? 'guest@codelens.dev'}
            </span>
            <span className="status-pill profile-muted-pill">
              Reviews stored: {reviews.length}
            </span>
          </div>
        </div>

        <div className="profile-hero-panel glass-panel">
          <p className="section-label">Session snapshot</p>
          <h2>{auth.user?.name ?? 'Guest workspace'}</h2>
          <p className="profile-hero-panel-subtext">Active identity and token availability.</p>
          <div className="profile-token-grid">
            {tokenRows.map((token) => (
              <div key={token.label} className={`profile-token-pill ${token.status === 'ready' ? 'is-ready' : 'is-missing'}`}>
                <div>
                  <span>{token.label}</span>
                  <strong>{token.value}</strong>
                </div>
                <small>{token.meta}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-detail-grid">
        <article className="surface profile-detail-card">
          <div className="profile-card-header">
            <UserCircle2 size={20} />
            <div>
              <p className="section-label">Identity</p>
              <h3>Account overview</h3>
            </div>
          </div>
          <div className="profile-info-list">
            {identityRows.map((row) => (
              <div key={row.label} className="profile-info-row">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="surface profile-detail-card">
          <div className="profile-card-header">
            <KeyRound size={20} />
            <div>
              <p className="section-label">Tokens</p>
              <h3>Authentication state</h3>
            </div>
          </div>
          <ul className="profile-token-list">
            {tokenRows.map((token) => (
              <li key={token.label}>
                <div>
                  <span>{token.label}</span>
                  <strong>{token.value}</strong>
                </div>
                <small>{token.meta}</small>
              </li>
            ))}
          </ul>
        </article>

        <article className="surface profile-detail-card profile-action-card">
          <div className="profile-card-header">
            <ShieldCheck size={20} />
            <div>
              <p className="section-label">Controls</p>
              <h3>Sign out</h3>
            </div>
          </div>
          <p>
            Logging out clears the stored tokens on both frontend state and backend session, keeping
            the review workspace clean for the next sign in.
          </p>
          <button className="primary-button" type="button" onClick={() => setConfirmingLogout(true)}>
            <LogOut size={16} />
            Logout
          </button>
        </article>
      </section>

      {confirmingLogout ? (
        <div className="modal-backdrop">
          <div className="modal-shell profile-logout-modal">
            <div className="profile-card-header">
              <ShieldCheck size={20} />
              <div>
                <p className="section-label">Confirm logout</p>
                <h3>End this session?</h3>
              </div>
            </div>
            <p>
              Logging out clears stored tokens on the device and invalidates your session on the
              backend. You can sign back in at any time.
            </p>
            <div className="profile-logout-actions">
              <button className="ghost-button" type="button" onClick={() => setConfirmingLogout(false)}>
                Stay signed in
              </button>
              <button className="primary-button" type="button" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
