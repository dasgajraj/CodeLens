import { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Bot,
  CalendarDays,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  GitBranch,
  RefreshCcw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  createGithubReview,
  createRawReview,
  deleteReview,
  fetchReviewById,
  fetchReviews,
  selectReview,
} from '../features/reviews/reviewsSlice'
import type { Review } from '../types/api'
import { configureMonaco, sharedEditorOptions } from '../utils/monaco'

type ComposeMode = 'github' | 'paste'

const starterSnippet = `export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

export function average(values: number[]) {
  return sum(values) / values.length
}`

const correctedCodePlaceholder = '// AI corrected code will appear here once generated'

export function WorkspacePage() {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((state) => state.auth)
  const reviewsState = useAppSelector((state) => state.reviews)
  const [composeMode, setComposeMode] = useState<ComposeMode>('github')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [language, setLanguage] = useState('typescript')
  const [code, setCode] = useState(starterSnippet)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [editableCorrectedCode, setEditableCorrectedCode] = useState(correctedCodePlaceholder)
  const [showAllReviews, setShowAllReviews] = useState(false)
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

  const formattedTimestamp = selectedReview?.createdAt
    ? new Date(selectedReview.createdAt).toLocaleString()
    : 'Timestamp unavailable'
  const criticalBugs = selectedReview?.aiSuggestions?.criticalBugs ?? []
  const optimizations = selectedReview?.aiSuggestions?.optimizations ?? []

  const copyToClipboard = async (value: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(value)
        return
      }
    } catch {
      /* ignored */
    }

    const fallback = document.createElement('textarea')
    fallback.value = value
    fallback.style.position = 'fixed'
    fallback.style.left = '-9999px'
    document.body.appendChild(fallback)
    fallback.focus()
    fallback.select()
    document.execCommand('copy')
    document.body.removeChild(fallback)
  }

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  }

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

  useEffect(() => {
    if (!selectedReview) {
      setEditableCorrectedCode(correctedCodePlaceholder)
      return
    }
    setEditableCorrectedCode(selectedReview.aiSuggestions?.correctedCode || correctedCodePlaceholder)
  }, [selectedReview])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      if (composeMode === 'github') {
        await dispatch(
          createGithubReview({
            title,
            url,
            language: language || undefined,
          }),
        ).unwrap()
      } else {
        await dispatch(
          createRawReview({
            code,
            language: language || undefined,
          }),
        ).unwrap()
      }

      setIsCreateModalOpen(false)
      setTitle('')
      setUrl('')
      setLanguage('typescript')
      setCode(starterSnippet)
    } catch {
      /* errors handled in slice */
    }
  }

  const handleReviewRefresh = () => {
    if (!selectedReview?._id) {
      return
    }
    void dispatch(fetchReviewById(selectedReview._id))
  }

  const handleDeleteReview = async () => {
    if (!selectedReview?._id) {
      return
    }
    await dispatch(deleteReview(selectedReview._id))
    setIsReviewModalOpen(false)
  }

  const handleReviewSelect = (review: Review) => {
    dispatch(selectReview(review._id))
    setIsReviewModalOpen(true)
    setEditableCorrectedCode(review.aiSuggestions?.correctedCode || correctedCodePlaceholder)
    void dispatch(fetchReviewById(review._id))
  }

  const handleCopyCorrectedCode = () => {
    void copyToClipboard(editableCorrectedCode)
  }

  const handleDownloadCorrectedCode = () => {
    const fileSafeTitle = (selectedReview?.title ?? 'ai-corrected')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const filename = `${fileSafeTitle || 'ai-corrected'}.${selectedReview?.language ?? 'txt'}`
    downloadFile(filename, editableCorrectedCode)
  }

  return (
    <main className="workspace-grid">
      <section className="hero-panel surface workspace-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Workspace control room
          </div>
          <h1>Launch reviews, open modals, and keep Monaco inline.</h1>
          <p>
            Saved reviews stay in the rail, the board highlights what to do next, and every
            selection opens a styled detail modal instead of dumping JSON.
          </p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => setIsCreateModalOpen(true)}>
              New review
              <Send size={16} />
            </button>
            <button className="ghost-button" type="button" onClick={() => void dispatch(fetchReviews())}>
              <RefreshCcw size={16} />
              Sync history
            </button>
          </div>
        </div>

        <div className="workspace-stats">
          <article className="metric-card">
            <div className="metric-icon">
              <FileCode2 size={18} />
            </div>
            <div>
              <p className="metric-label">Stored reviews</p>
              <strong>{totalReviews}</strong>
              <span>Fetched for {auth.user?.name ?? auth.user?.email ?? 'guest user'}.</span>
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="metric-label">Average score</p>
              <strong>{averageScore}/10</strong>
              <span>Derived from the AI suggestions currently in memory.</span>
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-icon">
              <Bot size={18} />
            </div>
            <div>
              <p className="metric-label">Session</p>
              <strong>{auth.status === 'authenticated' ? 'Authenticated' : 'Guest'}</strong>
              <span>{auth.accessToken ? 'Tokens ready for review creation.' : 'Sign in to persist more runs.'}</span>
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
            <p className="empty-copy">No reviews yet. Create one from the board.</p>
          ) : (
            <>
              {(showAllReviews ? reviewsState.items : reviewsState.items.slice(0, 4)).map((review: Review) => (
                <button
                  type="button"
                  key={review._id}
                  className={`history-item ${review._id === reviewsState.selectedReviewId ? 'is-active' : ''}`}
                  onClick={() => handleReviewSelect(review)}
                >
                  <div>
                    <strong>{review.title || 'Untitled review'}</strong>
                    <span>{review.language ?? 'Unknown language'}</span>
                  </div>
                  <span className="history-meta">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'No timestamp'}
                  </span>
                </button>
              ))}
              {reviewsState.items.length > 4 ? (
                <button
                  type="button"
                  className="ghost-button full-width"
                  onClick={() => setShowAllReviews((prev) => !prev)}
                >
                  {showAllReviews ? 'Show fewer memories' : `Show all ${reviewsState.items.length} reviews`}
                </button>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="editor-stage surface workspace-board">
        <div className="workspace-board-card glass-panel">
          <p className="section-label">Create review</p>
          <h2>Launch the composer</h2>
          <p>Use GitHub URLs or raw Monaco pastes without leaving the workspace.</p>
          <div className="workspace-board-actions">
            <button className="primary-button" type="button" onClick={() => setIsCreateModalOpen(true)}>
              Open composer
              <Send size={16} />
            </button>
            <button className="ghost-button" type="button" onClick={() => setComposeMode('github')}>
              Default to GitHub
            </button>
          </div>
        </div>

        <div className="workspace-board-card glass-panel">
          <p className="section-label">Selected review</p>
          <h2>{selectedReview?.title ?? 'No review selected yet'}</h2>
          <p>
            {selectedReview
              ? 'Open the modal for structured AI feedback, Monaco previews, and metadata.'
              : 'Choose a stored review from the left rail to inspect details.'}
          </p>
          <div className="workspace-board-actions">
            <button
              className="ghost-button"
              type="button"
              disabled={!selectedReview}
              onClick={() => setIsReviewModalOpen(Boolean(selectedReview))}
            >
              View details
            </button>
            <button className="ghost-button" type="button" disabled={!selectedReview} onClick={handleReviewRefresh}>
              <RefreshCcw size={16} />
              Refresh selected
            </button>
          </div>
          {selectedReview ? <span className="history-meta">Last updated: {formattedTimestamp}</span> : null}
        </div>
      </section>

      {isCreateModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)} role="presentation">
          <section
            className="modal-shell create-review-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Create review"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="response-panel-header">
              <div>
                <p className="section-label">Create review</p>
                <h3>{composeMode === 'github' ? 'GitHub file request' : 'Raw Monaco paste'}</h3>
              </div>
              <button className="ghost-button compact" type="button" onClick={() => setIsCreateModalOpen(false)}>
                Close
              </button>
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
                        theme="codelens-dark"
                        beforeMount={configureMonaco}
                        onChange={(value) => setCode(value ?? '')}
                        options={{
                          ...sharedEditorOptions,
                          readOnly: false,
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

              <div className="modal-actions">
                <button className="ghost-button" type="button" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button className="primary-button submit-button" type="submit">
                  {reviewsState.submitStatus === 'submitting' ? 'Submitting...' : 'Create review'}
                  <Send size={16} />
                </button>
              </div>
            </form>

            {reviewsState.error ? <p className="error-banner">{reviewsState.error}</p> : null}
          </section>
        </div>
      ) : null}

      {isReviewModalOpen && selectedReview ? (
        <div className="modal-backdrop" onClick={() => setIsReviewModalOpen(false)} role="presentation">
          <section
            className="modal-shell review-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Review details"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="review-detail-header">
              <div>
                <p className="section-label">Review detail</p>
                <h3>{selectedReview.title ?? 'Untitled review'}</h3>
                <p className="review-detail-meta">
                  <CalendarDays size={14} />
                  {formattedTimestamp}
                </p>
              </div>
              <div className="review-detail-actions">
                {selectedReview.githubUrl && selectedReview.githubUrl !== 'Manual Paste' ? (
                  <a className="ghost-button compact" href={selectedReview.githubUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} />
                    Source
                  </a>
                ) : null}
                <button
                  className="ghost-button compact"
                  type="button"
                  onClick={() => copyToClipboard(selectedReview._id ?? '')}
                >
                  <Copy size={14} />
                  Copy ID
                </button>
                <button className="ghost-button compact" type="button" onClick={handleReviewRefresh}>
                  <RefreshCcw size={14} />
                  Refresh
                </button>
                <button className="ghost-button compact" type="button" onClick={handleDeleteReview}>
                  <Trash2 size={14} />
                  Delete
                </button>
                <button className="ghost-button compact" type="button" onClick={() => setIsReviewModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>

            <div className="review-detail-grid">
              <article className="review-detail-card">
                <p className="section-label">Language</p>
                <strong>{selectedReview.language ?? 'Unknown'}</strong>
              </article>
              <article className="review-detail-card">
                <p className="section-label">GitHub URL</p>
                <strong>{selectedReview.githubUrl || 'Manual paste'}</strong>
              </article>
              <article className="review-detail-card">
                <p className="section-label">Status</p>
                <strong>{selectedReview.status ?? 'Unknown'}</strong>
              </article>
            </div>

            <section className="review-detail-section">
              <p className="section-label">AI summary</p>
              <h3>{selectedReview.aiSuggestions?.summary ?? 'No AI summary yet'}</h3>
            </section>

            <div className="review-detail-lists">
              <div>
                <p className="section-label">Critical bugs</p>
                <ul className="review-detail-list">
                  {criticalBugs.length ? (
                    criticalBugs.map((bug) => <li key={bug}>{bug}</li>)
                  ) : (
                    <li>No critical bugs reported.</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="section-label">Optimizations</p>
                <ul className="review-detail-list">
                  {optimizations.length ? (
                    optimizations.map((optimization) => <li key={optimization}>{optimization}</li>)
                  ) : (
                    <li>No optimizations reported.</li>
                  )}
                </ul>
              </div>
              <div className="review-detail-score">
                <p className="section-label">Score</p>
                <strong>{selectedReview.aiSuggestions?.score ?? 0}/10</strong>
              </div>
            </div>

            <div className="review-detail-editors">
              <section className="modal-code-panel">
                <div className="response-panel-header">
                  <div>
                    <p className="section-label">Original code</p>
                    <h3>{selectedReview.title ?? 'Stored submission'}</h3>
                  </div>
                  <div className="panel-actions">
                    <button className="ghost-button compact" type="button" onClick={() => copyToClipboard(selectedReview.code ?? '')}>
                      <Copy size={14} />
                      Copy
                    </button>
                    <button
                      className="ghost-button compact"
                      type="button"
                      onClick={() =>
                        downloadFile(
                          `${selectedReview.title ?? 'original-code'}.${selectedReview.language ?? 'txt'}`,
                          selectedReview.code ?? '',
                        )
                      }
                    >
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </div>
                <div className="editor-frame modal-editor-frame">
                  <div className="editor-toolbar">
                    <div className="traffic-lights" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="editor-tab">review-source.{selectedReview.language ?? 'txt'}</span>
                    <span className="editor-badge">Read only</span>
                  </div>
                  <div className="editor-wrapper modal-code-wrapper">
                    <Editor
                      height="100%"
                      defaultLanguage="typescript"
                      language={selectedReview.language ?? 'typescript'}
                      value={selectedReview.code ?? '// No code available'}
                      theme="codelens-dark"
                      beforeMount={configureMonaco}
                      options={{
                        ...sharedEditorOptions,
                        readOnly: true,
                      }}
                    />
                  </div>
                </div>
              </section>

              <section className="modal-code-panel">
                <div className="response-panel-header">
                  <div>
                    <p className="section-label">AI corrected code</p>
                    <h3>Editable suggestion</h3>
                  </div>
                  <div className="panel-actions">
                    <button className="ghost-button compact" type="button" onClick={handleCopyCorrectedCode}>
                      <Copy size={14} />
                      Copy
                    </button>
                    <button className="ghost-button compact" type="button" onClick={handleDownloadCorrectedCode}>
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </div>
                <div className="editor-frame modal-editor-frame">
                  <div className="editor-toolbar">
                    <div className="traffic-lights" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="editor-tab">review-corrected.{selectedReview.language ?? 'txt'}</span>
                    <span className="editor-badge">Editable</span>
                  </div>
                  <div className="editor-wrapper modal-code-wrapper">
                    <Editor
                      height="100%"
                      defaultLanguage="typescript"
                      language={selectedReview.language ?? 'typescript'}
                      value={editableCorrectedCode}
                      theme="codelens-dark"
                      beforeMount={configureMonaco}
                      onChange={(value) => setEditableCorrectedCode(value ?? correctedCodePlaceholder)}
                      options={{
                        ...sharedEditorOptions,
                        readOnly: false,
                      }}
                    />
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
