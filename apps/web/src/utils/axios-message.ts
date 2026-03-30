import axios from 'axios'

export type ParsedAxiosError = {
  message: string
  status?: number
}

export function parseAxiosError(err: unknown): ParsedAxiosError {
  if (!axios.isAxiosError(err)) {
    return { message: err instanceof Error ? err.message : 'Something went wrong' }
  }
  const status = err.response?.status
  const body = err.response?.data as { message?: string; error?: string } | undefined
  const message =
    body?.message ??
    body?.error ??
    (typeof body === 'string' ? body : undefined) ??
    err.message ??
    'Something went wrong'
  return { message, status }
}
