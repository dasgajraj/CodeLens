import type { FC } from 'react'
import { Cloud, Loader2 } from 'lucide-react'
import '../App.css'

type LoadingScreenProps = {
  status: 'warming' | 'ready' | 'error'
  latencyMs: number | null
  message?: string
  onRetry?: () => void
}

export const LoadingScreen: FC<LoadingScreenProps> = ({ status, latencyMs, message, onRetry }) => {
  const isError = status === 'error'
  const headline = isError ? 'Waking servers failed' : status === 'ready' ? 'Backend ready' : 'Warming up CodeLens'

  return (
    <div className="loading-gate">
      <div className="loading-card surface glass-panel">
        <div className="loading-icon">
          {isError ? <Cloud size={32} /> : <Loader2 size={32} className="spin" />}
        </div>
        <h2>{headline}</h2>
        <p>
          {message ??
            (status === 'ready'
              ? 'Edge functions respond in just ' + (latencyMs ?? '...') + 'ms'
              : 'Initial ping ensures cold starts are gone before you land on the dashboard.')}
        </p>
        {latencyMs ? <span className="latency-badge">Last ping {latencyMs}ms</span> : null}
        {isError && onRetry ? (
          <button className="primary-button" type="button" onClick={onRetry}>
            Retry wake-up
          </button>
        ) : null}
      </div>
    </div>
  )
}
