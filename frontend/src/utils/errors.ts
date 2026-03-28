import axios from 'axios'

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') {
      return message
    }

    const details = error.response?.data?.details
    if (Array.isArray(details) && details.every((item) => typeof item === 'string')) {
      return details.join(', ')
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}
