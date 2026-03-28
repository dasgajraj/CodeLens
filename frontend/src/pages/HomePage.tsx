import {
  ArrowRight,
  Bot,
  ChartColumnBig,
  Command,
  FileCode2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'

export function HomePage() {
  const auth = useAppSelector((state) => state.auth)
  const reviews = useAppSelector((state) => state.reviews.items)

  const totalReviews = reviews.length
  const latestReview = reviews[0]
  const averageScore = totalReviews
    ? Math.round(
        reviews.reduce((sum, review) => sum + (review.aiSuggestions?.score ?? 0), 0) / totalReviews,
      )
    : 0

  const heroCtaHref = auth.status === 'authenticated' ? '/workspace' : '/auth'
  const isGuest = auth.status !== 'authenticated'
  const blurMessage = ''

  return (
    <main className="home-grid">
      <section className="surface home-hero">
        <div className="hero-column hero-primary">
          <div className="hero-badge">
            <Sparkles size={16} />
            Review fabric for builders
          </div>
          <h1>Readable review intelligence, from first paste to final fix.</h1>
          <p>
            CodeLens keeps your AI review history aligned, showing editable input, captured payloads,
            and corrected output without bouncing between tools.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" to={heroCtaHref}>
              {auth.status === 'authenticated' ? 'Open workspace' : 'Get started'}
              <ArrowRight size={16} />
            </Link>
            <Link className="ghost-button" to={auth.status === 'authenticated' ? '/user' : '/auth'}>
              {auth.status === 'authenticated' ? 'Profile & session' : 'Launch demo mode'}
            </Link>
          </div>

          <div className={`blur-guard ${isGuest ? 'is-locked' : ''}`}>
            <div className="hero-metrics">
              <article className="hero-pill">
                <p className="metric-label">Latest summary</p>
                <strong>{latestReview?.aiSuggestions?.summary ?? 'AI analysis waiting'}</strong>
                <span>
                  {latestReview
                    ? `${latestReview.language ?? 'Code'} review · ${latestReview.title}`
                    : 'Generate a review to populate your feed.'}
                </span>
              </article>
              <article className="hero-pill">
                <p className="metric-label">Session state</p>
                <strong>{auth.status === 'authenticated' ? 'Authenticated' : 'Guest'}</strong>
                <span>{auth.user?.email ?? 'Sign in to sync history and tokens.'}</span>
              </article>
            </div>
            {isGuest ? <div className="blur-guard-overlay">{blurMessage}</div> : null}
          </div>
        </div>

        <div className="hero-column hero-panel hero-secondary">
          <div className="panel-header">
            <div>
              <p className="section-label">Workspace focus</p>
              <h2>Everything aligned in a single pass.</h2>
            </div>
            <Command size={18} />
          </div>

          <ul className="hero-list">
            <li>
              <span className="timeline-marker" />
              <div>
                <strong>Editable Monaco input</strong>
                <p>Paste raw snippets with syntax color, edit, and resend without losing history.</p>
              </div>
            </li>
            <li>
              <span className="timeline-marker" />
              <div>
                <strong>Full payload inspection</strong>
                <p>Inspect stored `_id`, `status`, `aiSuggestions`, and corrected code side by side.</p>
              </div>
            </li>
            <li>
              <span className="timeline-marker" />
              <div>
                <strong>Readable account trail</strong>
                <p>Navigate to the dedicated account page for session tokens, identity, and logout.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <div className={`blur-guard ${isGuest ? 'is-locked' : ''}`}>
        <section className="home-columns">
          <article className="surface metric-card highlight">
            <div className="metric-icon">
              <FileCode2 size={18} />
            </div>
            <div>
              <p className="metric-label">Total reviews</p>
              <strong>{totalReviews}</strong>
              <span>{latestReview ? `Latest: ${latestReview.title}` : 'Run a review to populate history.'}</span>
            </div>
          </article>

          <article className="surface metric-card highlight">
            <div className="metric-icon">
              <ChartColumnBig size={18} />
            </div>
            <div>
              <p className="metric-label">Average AI score</p>
              <strong>{averageScore}/10</strong>
              <span>Calculated in real time from Redux review storage.</span>
            </div>
          </article>

          <article className="surface metric-card highlight">
            <div className="metric-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="metric-label">Account signal</p>
              <strong>{auth.user?.email ?? 'guest@codelens.dev'}</strong>
              <span>{auth.status === 'authenticated' ? 'Synced with backend identity.' : 'Sign in to persist tokens.'}</span>
            </div>
          </article>
        </section>
        {isGuest ? <div className="blur-guard-overlay">{blurMessage}</div> : null}
      </div>

      <div className={`blur-guard ${isGuest ? 'is-locked' : ''}`}>
        <section className="surface home-story">
          <div className="response-panel-header">
            <div>
              <p className="section-label">Platform overview</p>
              <h2>Designed to make AI reviews legible and traceable.</h2>
            </div>
          </div>

          <div className="home-story-grid">
            <article className="ai-callout">
              <div className="callout-icon">
                <Bot size={18} />
              </div>
              <div>
                <strong>Review memory</strong>
                <p>Each review stores title, source, score, AI suggestions, and corrected code for instant recall.</p>
              </div>
            </article>
            <article className="ai-callout">
              <div className="callout-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <strong>Session guardrails</strong>
                <p>Account status is always visible, so tokens and access stay aligned with your workspace.</p>
              </div>
            </article>
            <article className="ai-callout">
              <div className="callout-icon">
                <ChartColumnBig size={18} />
              </div>
              <div>
                <strong>Readable AI output</strong>
                <p>Review detail renders as UI sections and Monaco panes, not as opaque JSON blobs.</p>
              </div>
            </article>
          </div>
        </section>
        {isGuest ? <div className="blur-guard-overlay">{blurMessage}</div> : null}
      </div>
    </main>
  )
}
