import type { Paginated } from '@/types/hackadevs-api.types'

export function normalizePaginated<T>(
  raw: unknown,
  fallbackPage = 1,
  fallbackLimit = 20,
): Paginated<T> {
  if (!raw || typeof raw !== 'object') {
    return { data: [], total: 0, page: fallbackPage, limit: fallbackLimit, hasMore: false }
  }
  const o = raw as Record<string, unknown>
  const rawList = (o.data ?? o.items) as T[] | undefined
  const data = Array.isArray(rawList) ? rawList : []
  const page = typeof o.page === 'number' ? o.page : fallbackPage
  const limit = typeof o.limit === 'number' ? o.limit : fallbackLimit
  const total = typeof o.total === 'number' ? o.total : data.length
  const hasMore =
    typeof o.hasMore === 'boolean' ? o.hasMore : page * limit < total || data.length >= limit
  return { data, total, page, limit, hasMore }
}
