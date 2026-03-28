import { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Bot,
  Code2,
  ExternalLink,
  FileCode2,
  GitBranch,
  LogOut,
  RefreshCcw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { signOut } from '../features/auth/authSlice'
import {
  createGithubReview,
  createRawReview,
  deleteReview,
  fetchReviewById,
  fetchReviews,
  selectReview,
} from '../features/reviews/reviewsSlice'
import type { Review } from '../types/api'

type ComposeMode = 'github' | 'paste'

const starterSnippet = `export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

export function average(values: number[]) {
  return sum(values) / values.length
}`

export function WorkspacePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const auth = useAppSelector((state) => state.auth)
  const reviewsState = useAppSelector((state) => state.reviews)
  const [composeMode, setComposeMode] = useState<ComposeMode>('github')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [language, setLanguage] = useState('typescript')
  const [code, setCode] = useState(starterSnippet)
  const hasLoadedInitialReviews = useRef(false)

  const selectedReview = useMemo(
    () =>
      reviewsState.items.find((item: Review) => item._id === reviewsState.selectedReviewId) ?? null,
    [reviewsState.items, reviewsState.selectedReviewId],
  )

  const totalReviews = reviewsState.items.length
  const averageScore = totalReviews
    ? Math.round(
        reviewsState.items.reduce((sum, review) => sum + (review.aiSuggestions?.score ?? 0), 0) /
          totalReviews,
      )
    : 0

  useEffect(() => {
    if (auth.status === 'authenticated' && !hasLoadedInitialReviews.current) {
      hasLoadedInitialReviews.current = true
      void dispatch(fetchReviews())
    }
  }, [auth.status, dispatch])

  useEffect(() => {
    if (reviewsState.selectedReviewId) {
      void dispatch(fetchReviewById(reviewsState.selectedReviewId))
    }
  }, [dispatch, reviewsState.selectedReviewId])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (composeMode === 'github') {
      await dispatch(
        createGithubReview({
          title,
          url,
          language: language || undefined,
        }),
      )
      return
    }

    await dispatch(
      createRawReview({
        code,
        language: language || undefined,
      }),
    )
  }

  const handleLogout = async () => {
    await dispatch(signOut())
    navigate('/auth', { replace: true })
  }

  return (
    <main className="workspace-grid">
      <section className="hero-panel surface workspace-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Review command deck
          </div>
          <h1>Paste code, review GitHub files, and inspect AI output in one studio.</h1>
          <p>
            CodeLens now keeps the writing surface, review response, corrected code, and
            saved history visible in one place so the workflow feels deliberate instead of
            fragmented.
          </p>
        </div>

        <div className="user-hub glass-panel">
          <div className="user-hub-top">
            <div>
              <p className="section-label">Session</p>
              <h2>{auth.user?.name || auth.user?.email || 'CodeLens user'}</h2>
            </div>
            <div className="user-hub-actions">
              <button className="ghost-button" type="button" onClick={() => void dispatch(fetchReviews())}>
                <RefreshCcw size={16} />
                Refresh reviews
              </button>
              <button className="primary-button" type="button" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          <div className="status-strip">
            <span className="status-pill status-pill-live">
              {auth.user?.name || auth.user?.email || 'Guest'}
            </span>
            <span className="status-pill">{totalReviews} stored reviews</span>
            <span className="status-pill">Persisted token session</span>
          </div>
        </div>

        <div className="workspace-stats">
          <article className="metric-card">
            <div className="metric-icon">
              <FileCode2 size={18} />
            </div>
            <div>
              <p className="metric-label">Total reviews</p>
              <strong>{totalReviews}</strong>
              <span>Saved locally in Redux and refreshed from the API.</span>
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="metric-label">Average AI score</p>
              <strong>{averageScore}/10</strong>
              <span>Based on the reviews currently loaded in the workspace.</span>
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-icon">
              <Bot size={18} />
            </div>
            <div>
              <p className="metric-label">Token status</p>
              <strong>{auth.accessToken ? 'Loaded' : 'Missing'}</strong>
              <span>
                Refresh token {auth.refreshToken ? 'ready' : 'missing'} if `/api/auth/me`
                needs renewal.
              </span>
            </div>
          </article>
        </div>
      </section>

      <section className="left-rail surface glass-panel">
        <div className="rail-header">
          <div>
            <p className="section-label">Saved reviews</p>
            <h2>Review memory</h2>
          </div>
        </div>

        <div className="history-list">
          {reviewsState.items.length === 0 ? (
            <p className="empty-copy">No reviews yet. Create one from GitHub or Monaco paste.</p>
          ) : (
            reviewsState.items.map((review: Review) => (
              <button
                type="button"
                key={review._id}
                className={`history-item ${
                  review._id === reviewsState.selectedReviewId ? 'is-active' : ''
                }`}
                onClick={() => dispatch(selectReview(review._id))}
              >
                <div>
                  <strong>{review.title}</strong>
                  <span>{review._id}</span>
                </div>
                <span className="history-meta">{review.language}</span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="editor-stage surface">
        <div className="editor-header">
          <div>
            <p className="section-label">Create review</p>
            <h2>{composeMode === 'github' ? 'GitHub file request' : 'Raw paste in Monaco'}</h2>
          </div>
        </div>

        <div className="composer-toggle" role="tablist" aria-label="Review mode">
          <button
            type="button"
            className={`mode-pill ${composeMode === 'github' ? 'is-active' : ''}`}
            onClick={() => setComposeMode('github')}
          >
            <GitBranch size={14} />
            GitHub file
          </button>
          <button
            type="button"
            className={`mode-pill ${composeMode === 'paste' ? 'is-active' : ''}`}
            onClick={() => setComposeMode('paste')}
          >
            <Code2 size={14} />
            Raw paste editor
          </button>
        </div>

        <form className="composer-grid" onSubmit={handleSubmit}>
          {composeMode === 'github' ? (
            <>
              <label className="field">
                <span>Review title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Auth middleware pass"
                  required
                />
              </label>
              <label className="field field-wide">
                <span>GitHub file URL</span>
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://github.com/org/repo/blob/main/src/file.ts"
                  required
                />
              </label>
            </>
          ) : (
            <div className="field field-wide">
              <span>Raw code payload</span>
              <div className="editor-frame compose-editor-frame">
                <div className="editor-toolbar">
                  <div className="traffic-lights" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="editor-tab">raw-review-input.{language || 'ts'}</span>
                  <span className="editor-badge">Editable Monaco editor</span>
                </div>

                <div className="editor-wrapper compose-editor-wrapper">
                  <Editor
                    height="100%"
                    defaultLanguage="typescript"
                    language={language || 'typescript'}
                    value={code}
                    theme="vs-dark"
                    onChange={(value) => setCode(value ?? '')}
                    options={{
                      readOnly: false,
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbersMinChars: 3,
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <label className="field">
            <span>{composeMode === 'github' ? 'Language hint' : 'Editor language'}</span>
            <input
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              placeholder="typescript"
            />
          </label>

          <button className="primary-button submit-button" type="submit">
            {reviewsState.submitStatus === 'submitting' ? 'Submitting...' : 'Create review'}
            <Send size={16} />
          </button>
        </form>

        {reviewsState.error ? <p className="error-banner">{reviewsState.error}</p> : null}

        <div className="response-grid">
          <section className="response-panel">
            <div className="response-panel-header">
              <div>
                <p className="section-label">API response</p>
                <h3>{selectedReview?.title ?? 'Select or create a review'}</h3>
              </div>
              {selectedReview?.githubUrl.startsWith('http') ? (
                <a
                  className="ghost-button compact"
                  href={selectedReview.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={14} />
                  Source
                </a>
              ) : null}
            </div>

            <div className="response-card-grid">
              <article className="ai-callout">
                <div className="callout-icon">
                  <Bot size={18} />
                </div>
                <div>
                  <strong>{selectedReview?.aiSuggestions?.summary ?? 'No AI summary yet'}</strong>
                  <p>
                    Score: {selectedReview?.aiSuggestions?.score ?? 0}/10. Review id:{' '}
                    {selectedReview?._id ?? 'not selected'}.
                  </p>
                </div>
              </article>

              <div className="timeline">
                {(selectedReview?.aiSuggestions?.criticalBugs ?? []).map((bug: string) => (
                  <div className="timeline-item" key={bug}>
                    <span className="timeline-marker" />
                    <div>
                      <strong>Critical bug</strong>
                      <p>{bug}</p>
                    </div>
                  </div>
                ))}
                {(selectedReview?.aiSuggestions?.optimizations ?? []).map((optimization: string) => (
                  <div className="timeline-item" key={optimization}>
                    <span className="timeline-marker" />
                    <div>
                      <strong>Optimization</strong>
                      <p>{optimization}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stack-actions">
              {selectedReview ? (
                <>
                  <button
                    className="ghost-button full-width"
                    type="button"
                    onClick={() => void dispatch(fetchReviewById(selectedReview._id))}
                  >
                    <RefreshCcw size={15} />
                    Refresh selected review
                  </button>
                  <button
                    className="ghost-button full-width"
                    type="button"
                    onClick={() => void dispatch(deleteReview(selectedReview._id))}
                  >
                    <Trash2 size={15} />
                    Delete review
                  </button>
                </>
              ) : null}
            </div>
          </section>

          <section className="response-panel">
            <div className="response-panel-header">
              <div>
                <p className="section-label">Original code</p>
                <h3>{selectedReview?.language ?? language}</h3>
              </div>
            </div>

            <div className="editor-frame">
              <div className="editor-toolbar">
                <div className="traffic-lights" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="editor-tab">
                  {selectedReview?.title ?? 'Waiting for selected review'}
                </span>
                <span className="editor-badge">Stored submission</span>
              </div>

              <div className="editor-wrapper">
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  language={selectedReview?.language ?? language ?? 'typescript'}
                  value={selectedReview?.code ?? '// No review selected yet'}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbersMinChars: 3,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </section>

          <section className="response-panel response-panel-wide">
            <div className="response-panel-header">
              <div>
                <p className="section-label">AI suggested code</p>
                <h3>Corrected output</h3>
              </div>
            </div>

            <div className="editor-frame">
              <div className="editor-toolbar">
                <div className="traffic-lights" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="editor-tab">ai-corrected-output.ts</span>
                <span className="editor-badge">Generated correction</span>
              </div>

              <div className="editor-wrapper corrected-editor-wrapper">
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  language={selectedReview?.language ?? language ?? 'typescript'}
                  value={
                    selectedReview?.aiSuggestions?.correctedCode ||
                    '// AI corrected code will appear here after a review is generated'
                  }
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbersMinChars: 3,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
