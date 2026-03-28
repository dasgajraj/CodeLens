import type { Review, ReviewAiSuggestions } from '../types/api'

const emptyAiSuggestions: ReviewAiSuggestions = {
  summary: 'No AI summary yet',
  criticalBugs: [],
  optimizations: [],
  score: 0,
  correctedCode: '',
}

export function normalizeAiSuggestions(value: unknown): ReviewAiSuggestions {
  if (!value || typeof value !== 'object') {
    return emptyAiSuggestions
  }

  const source = value as Partial<ReviewAiSuggestions>

  return {
    summary: typeof source.summary === 'string' ? source.summary : emptyAiSuggestions.summary,
    criticalBugs: Array.isArray(source.criticalBugs)
      ? source.criticalBugs.filter((item): item is string => typeof item === 'string')
      : [],
    optimizations: Array.isArray(source.optimizations)
      ? source.optimizations.filter((item): item is string => typeof item === 'string')
      : [],
    score: Number.isFinite(source.score) ? Number(source.score) : 0,
    correctedCode:
      typeof source.correctedCode === 'string' ? source.correctedCode : emptyAiSuggestions.correctedCode,
  }
}

export function normalizeReview(review: Review): Review {
  return {
    ...review,
    githubUrl: typeof review.githubUrl === 'string' ? review.githubUrl : '',
    aiSuggestions: normalizeAiSuggestions(review.aiSuggestions),
  }
}
