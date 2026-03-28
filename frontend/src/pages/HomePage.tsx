import { ArrowRight, Bot, ChartColumnBig, FileCode2, ShieldCheck } from 'lucide-react'
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

  return (
    <main className="home-grid">
      <section className="hero-panel surface home-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Clean developer workspace
          </div>
          <h1>CodeLens gives every review a readable trail from input to AI output.</h1>
          <p>
            Use GitHub links or editable Monaco input, keep review history in one place,
            and inspect the complete stored response without digging through logs.
          </p>
        </div>

        <div className="home-hero-grid">
          <div className="home-hero-actions">
            <div className="hero-actions">
              <Link className="primary-button" to={auth.status === 'authenticated' ? '/workspace' : '/auth'}>
                {auth.status === 'authenticated' ? 'Open workspace' : 'Sign in'}
                <ArrowRight size={16} />
              </Link>
              {auth.status === 'authenticated' ? (
                <Link className="ghost-button" to="/user">
                  Profile and session
                </Link>
              ) : (
                <Link className="ghost-button" to="/auth">
                  Create account
                </Link>
              )}
            </div>

            <div className="home-mini-callout">
              <div className="metric-icon">
                <Bot size={18} />
              </div>
              <div>
                <p className="metric-label">Latest review summary</p>
                <strong>{latestReview?.aiSuggestions?.summary ?? 'No AI summary yet'}</strong>
                <span>
                  {latestReview
                    ? `Latest review: ${latestReview.title}`
                    : 'Generate a review to start seeing summaries here.'}
                </span>
              </div>
            </div>
          </div>

          <div className="home-focus-card glass-panel">
            <p className="section-label">Workspace focus</p>
            <h2>One place for editable input, complete review detail, and corrected output.</h2>
            <div className="home-focus-list">
              <div className="timeline-item">
                <span className="timeline-marker" />
                <div>
                  <strong>Editable Monaco input</strong>
                  <p>Write or paste code directly in the review flow with visible syntax coloring.</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-marker" />
                <div>
                  <strong>Structured review detail</strong>
                  <p>Selected reviews open as readable UI sections instead of a raw JSON wall.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface home-stats">
        <article className="metric-card">
          <div className="metric-icon">
            <FileCode2 size={18} />
          </div>
          <div>
            <p className="metric-label">Total reviews</p>
            <strong>{totalReviews}</strong>
            <span>{latestReview ? `Latest: ${latestReview.title}` : 'No reviews loaded yet'}</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon">
            <ChartColumnBig size={18} />
          </div>
          <div>
            <p className="metric-label">Average AI score</p>
            <strong>{averageScore}/10</strong>
            <span>Calculated from the reviews currently stored in Redux.</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="metric-label">Session state</p>
            <strong>{auth.status === 'authenticated' ? 'Authenticated' : 'Guest'}</strong>
            <span>{auth.user?.email ?? 'Sign in to sync reviews and tokens'}</span>
          </div>
        </article>
      </section>

      <section className="surface home-story">
        <div className="response-panel-header">
          <div>
            <p className="section-label">Platform overview</p>
            <h2>Built to keep context readable as your review history grows.</h2>
          </div>
        </div>

        <div className="home-story-grid">
          <article className="ai-callout">
            <div className="callout-icon">
              <Bot size={18} />
            </div>
            <div>
              <strong>Review memory</strong>
              <p>Each stored review keeps title, source, score, suggestions, and corrected code ready for recall.</p>
            </div>
          </article>
          <article className="ai-callout">
            <div className="callout-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <strong>Account page</strong>
              <p>Your email in the navbar opens a dedicated page for session details, identity, and logout.</p>
            </div>
          </article>
          <article className="ai-callout">
            <div className="callout-icon">
              <ChartColumnBig size={18} />
            </div>
            <div>
              <strong>Readable AI output</strong>
              <p>Review detail is shown as UI sections and modal panels, not as unstructured raw data.</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
