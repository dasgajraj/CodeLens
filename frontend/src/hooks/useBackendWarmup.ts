import { useEffect, useMemo, useState } from 'react'
import { mapAxiosError, wakeBackend } from '../lib/api'

type WarmupState = 'idle' | 'warming' | 'ready' | 'error'

type WarmupResult = {
  state: WarmupState
  latencyMs: number | null
  error?: string
  lastCheckedAt?: Date
  refresh: () => void
}

export const useBackendWarmup = (): WarmupResult => {
  const [state, setState] = useState<WarmupState>('idle')
  const [latencyMs, setLatency] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | undefined>()
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let isMounted = true

    const runWarmup = async () => {
      setState('warming')
      setErrorMessage(undefined)

      const started = performance.now()
      try {
        await wakeBackend()
        if (!isMounted) return
        setLatency(Math.round(performance.now() - started))
        setLastCheckedAt(new Date())
        setState('ready')
      } catch (error) {
        if (!isMounted) return
        const mapped = mapAxiosError(error)
        setErrorMessage(mapped.message)
        setState('error')
      }
    }

    runWarmup().catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [refreshToken])

  return useMemo(
    () => ({
      state,
      latencyMs,
      error: errorMessage,
      lastCheckedAt,
      refresh: () => setRefreshToken((token) => token + 1),
    }),
    [state, latencyMs, errorMessage, lastCheckedAt],
  )
}
