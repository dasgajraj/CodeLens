import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { mapAxiosError, reviewApi } from '../lib/api'
import type { AuthTokens } from '../types/auth'
import '../App.css'

type ReviewsPageProps = {
  tokens: AuthTokens | null
}

type ReviewRecord = {
  _id: string
  title: string
  status: string
  code?: string
  aiSuggestions?: {
    summary?: string
    score?: number
  }
}

export const ReviewsPage = ({ tokens }: ReviewsPageProps) => {
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | undefined>()
  const [selectedReview, setSelectedReview] = useState<ReviewRecord | null>(null)
  const [reviewId, setReviewId] = useState('')
  const [githubPayload, setGithubPayload] = useState({ title: 'Fix divide-by-zero', url: '', language: 'typescript' })
  const [rawCode, setRawCode] = useState('// Paste code snippet here')

  const fetchReviews = async () => {
    if (!tokens?.accessToken) {
      setListError('Authenticate first to fetch reviews.')
      return
    }
    setListLoading(true)
    setListError(undefined)
    try {
      const { data } = await reviewApi.listMine()
      setReviews(data)
    } catch (error) {
      setListError(mapAxiosError(error).message)
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchReviews().catch(() => undefined)
    }
  }, [tokens?.accessToken])

  const handleGetById = async (event: FormEvent) => {
    event.preventDefault()
    if (!reviewId) return
    try {
      const { data } = await reviewApi.byId(reviewId)
      setSelectedReview(data)
    } catch (error) {
      alert(mapAxiosError(error).message)
    }
  }

  const handleGithubSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const { data } = await reviewApi.createFromGithub(githubPayload)
      setSelectedReview(data.review ?? data)
      fetchReviews().catch(() => undefined)
    } catch (error) {
      alert(mapAxiosError(error).message)
    }
  }

  const handleRawSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const { data } = await reviewApi.createRaw(rawCode)
      setSelectedReview(data.review ?? data)
      fetchReviews().catch(() => undefined)
    } catch (error) {
      alert(mapAxiosError(error).message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete review?')) return
    try {
      await reviewApi.delete(id)
      setSelectedReview((current) => (current?._id === id ? null : current))
      fetchReviews().catch(() => undefined)
    } catch (error) {
      alert(mapAxiosError(error).message)
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="section-label">Reviews</p>
          <h2>Orchestrate CodeLens review APIs</h2>
        </div>
        <button className="ghost-button" type="button" onClick={fetchReviews} disabled={!tokens?.accessToken}>
          Refresh list
        </button>
      </div>

      <div className="page-grid reviews-grid">
        <section className="surface">
          <header className="section-block">
            <h3>Your reviews</h3>
            <p>Requires bearer token.</p>
          </header>
          {listLoading ? <p>Loading reviews…</p> : null}
          {listError ? <p className="form-error">{listError}</p> : null}
          <div className="review-list">
            {reviews.map((review) => (
              <article key={review._id} className="review-card">
                <div>
                  <strong>{review.title}</strong>
                  <p>Status: {review.status}</p>
                </div>
                <div className="card-actions">
                  <button className="ghost-button compact" type="button" onClick={() => setSelectedReview(review)}>
                    Inspect
                  </button>
                  <button className="icon-button" type="button" onClick={() => handleDelete(review._id)}>
                    ✕
                  </button>
                </div>
              </article>
            ))}
            {!reviews.length && !listLoading ? <p>No reviews yet.</p> : null}
          </div>
        </section>

        <section className="surface">
          <header className="section-block">
            <h3>Get review by id</h3>
            <p>Query `/api/reviews/:id`.</p>
          </header>
          <form className="form-inline" onSubmit={handleGetById}>
            <input value={reviewId} onChange={(event) => setReviewId(event.target.value)} placeholder="Review id" />
            <button className="primary-button" type="submit">
              Fetch
            </button>
          </form>
          {selectedReview ? (
            <pre className="review-preview">{JSON.stringify(selectedReview, null, 2)}</pre>
          ) : (
            <p>No review selected.</p>
          )}
        </section>

        <section className="surface">
          <header className="section-block">
            <h3>Create from GitHub URL</h3>
            <p>Proxy request payloads via CodeLens backend.</p>
          </header>
          <form className="form-grid" onSubmit={handleGithubSubmit}>
            <label className="form-field">
              <span>title</span>
              <input value={githubPayload.title} onChange={(event) => setGithubPayload({ ...githubPayload, title: event.target.value })} />
            </label>
            <label className="form-field">
              <span>url</span>
              <input value={githubPayload.url} onChange={(event) => setGithubPayload({ ...githubPayload, url: event.target.value })} placeholder="https://github.com/..." />
            </label>
            <label className="form-field">
              <span>language</span>
              <input value={githubPayload.language} onChange={(event) => setGithubPayload({ ...githubPayload, language: event.target.value })} />
            </label>
            <button className="primary-button" type="submit">
              Send request
            </button>
          </form>
        </section>

        <section className="surface">
          <header className="section-block">
            <h3>Send raw snippet</h3>
            <p>POST text/plain payload to `/api/reviews`.</p>
          </header>
          <form className="form-column" onSubmit={handleRawSubmit}>
            <textarea value={rawCode} onChange={(event) => setRawCode(event.target.value)} rows={8} />
            <button className="primary-button" type="submit">
              Submit snippet
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
