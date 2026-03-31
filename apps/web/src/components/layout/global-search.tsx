import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGlobalSearch } from '@/hooks/search/useGlobalSearch'
import type { GlobalSearchChallengeHit, GlobalSearchUserHit } from '@/types/hackadevs-api.types'

type Row =
  | { kind: 'challenge'; item: GlobalSearchChallengeHit }
  | { kind: 'user'; item: GlobalSearchUserHit }

function buildRows(data: {
  challenges: GlobalSearchChallengeHit[]
  users: GlobalSearchUserHit[]
}): Row[] {
  return [
    ...data.challenges.map((item) => ({ kind: 'challenge' as const, item })),
    ...data.users.map((item) => ({ kind: 'user' as const, item })),
  ]
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  useEffect(() => {
    setDismissed(false)
  }, [query])

  const { data, loading, error, debouncedQuery } = useGlobalSearch(query)

  useEffect(() => {
    setSelectedIndex(-1)
  }, [data, debouncedQuery])

  const showPanel = query.trim().length >= 2 && !dismissed
  const expanded = showPanel

  const goToRow = useCallback(
    (row: Row) => {
      setDismissed(true)
      if (row.kind === 'challenge') {
        navigate(`/challenge/${encodeURIComponent(row.item.slug)}`)
      } else {
        navigate(`/u/${encodeURIComponent(row.item.username)}`)
      }
    },
    [navigate],
  )

  useEffect(() => {
    if (!showPanel) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return
      setDismissed(true)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showPanel])

  const onSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setDismissed(true)
      return
    }
    if (!showPanel || !data) return
    const rows = buildRows(data)
    const total = rows.length
    if (total === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => (i < total - 1 ? i + 1 : 0))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => (i <= 0 ? total - 1 : i - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const idx = selectedIndex >= 0 ? selectedIndex : 0
      goToRow(rows[idx]!)
    }
  }

  const empty =
    showPanel &&
    !loading &&
    !error &&
    data &&
    data.challenges.length === 0 &&
    data.users.length === 0 &&
    debouncedQuery.length >= 2

  const activeDescendantId =
    selectedIndex >= 0 && data ? `global-search-opt-${selectedIndex}` : undefined

  return (
    <div ref={containerRef} className="relative w-full max-w-sm sm:max-w-md">
      <label className="sr-only" htmlFor="global-search">
        Search
      </label>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-hd-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" strokeLinecap="round" />
      </svg>
      <input
        id="global-search"
        type="search"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendantId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Search challenges, devs, tags…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setDismissed(false)}
        onKeyDown={onSearchKeyDown}
        className="w-full rounded-2xl border border-hd-border/90 bg-hd-elevated/80 py-2.5 pl-9 pr-3 text-sm text-hd-text shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] placeholder:text-hd-muted transition-[border-color,box-shadow] duration-150 ease-out focus:border-hd-indigo/35 focus:outline-none focus:ring-2 focus:ring-hd-indigo/15"
      />

      {showPanel ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,420px)] overflow-auto rounded-2xl border border-hd-border/90 bg-hd-elevated py-2 shadow-lg"
        >
          {loading ? <div className="px-3 py-2.5 text-sm text-hd-muted">Searching…</div> : null}
          {error ? <div className="px-3 py-2.5 text-sm text-hd-rose">{error}</div> : null}
          {empty ? <div className="px-3 py-2.5 text-sm text-hd-muted">No results.</div> : null}

          {!loading && !error && data && data.challenges.length > 0 ? (
            <div className="px-2">
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-hd-muted">
                Challenges
              </div>
              {data.challenges.map((c, i) => {
                const flatIndex = i
                const selected = selectedIndex === flatIndex
                return (
                  <Link
                    key={c.slug}
                    id={`global-search-opt-${flatIndex}`}
                    role="option"
                    aria-selected={selected}
                    to={`/challenge/${encodeURIComponent(c.slug)}`}
                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                    className={`flex flex-col gap-0.5 rounded-xl px-2 py-2 text-left text-sm transition-colors ${
                      selected ? 'bg-hd-hover text-hd-text' : 'text-hd-text hover:bg-hd-hover'
                    }`}
                  >
                    <span className="font-medium leading-tight">{c.title}</span>
                    <span className="text-xs text-hd-muted">{c.category.replace(/_/g, ' ')}</span>
                  </Link>
                )
              })}
            </div>
          ) : null}

          {!loading && !error && data && data.users.length > 0 ? (
            <div className="px-2 pt-1">
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-hd-muted">
                People
              </div>
              {data.users.map((u, j) => {
                const flatIndex = data.challenges.length + j
                const selected = selectedIndex === flatIndex
                return (
                  <Link
                    key={u.username}
                    id={`global-search-opt-${flatIndex}`}
                    role="option"
                    aria-selected={selected}
                    to={`/u/${encodeURIComponent(u.username)}`}
                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                    className={`flex items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition-colors ${
                      selected ? 'bg-hd-hover text-hd-text' : 'text-hd-text hover:bg-hd-hover'
                    }`}
                  >
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hd-surface text-xs font-semibold text-hd-muted">
                        {u.displayName.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span>
                      <span className="block font-medium leading-tight">{u.displayName}</span>
                      <span className="text-xs text-hd-muted">@{u.username}</span>
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
