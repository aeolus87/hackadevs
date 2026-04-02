import { useMemo, useState } from 'react'
import { HdSelect } from '@/components/ui/hd-select'
import { useAuthUser } from '@/contexts/auth-context'
import type { Category, ChallengeStatus } from '@/types/hackadevs-api.types'
import { useAdminChallenges, type AdminChallengeRow } from '@/hooks/admin/useAdminChallenges'
import { usePublishChallenge } from '@/hooks/admin/usePublishChallenge'
import { useDeleteChallenge } from '@/hooks/admin/useDeleteChallenge'
import { useArchiveChallenge } from '@/hooks/admin/useArchiveChallenge'
import { useCloseChallenge } from '@/hooks/admin/useCloseChallenge'
import { useGenerateChallenge } from '@/hooks/admin/useGenerateChallenge'
import { useToast } from '@/contexts/toast-context'
import { AdminChallengeEditDrawer } from './admin-challenge-edit-drawer'

const TABS: { label: string; status: ChallengeStatus }[] = [
  { label: 'Draft', status: 'DRAFT' },
  { label: 'Scheduled', status: 'SCHEDULED' },
  { label: 'Active', status: 'ACTIVE' },
  { label: 'Closed', status: 'CLOSED' },
  { label: 'Archived', status: 'ARCHIVED' },
]

const WEEKLY_THEMES = [
  'resilience patterns',
  'query optimisation',
  'API design',
  'concurrency',
  'security hardening',
  'caching strategies',
  'observability',
  'data pipelines',
  'distributed consensus',
  'rate limiting',
] as const

const GEN_CATEGORIES: Category[] = [
  'BACKEND',
  'FRONTEND',
  'SYSTEM_DESIGN',
  'SECURITY',
  'DATA_ENGINEERING',
  'ML_OPS',
  'DEVOPS',
  'FULLSTACK',
]

const GEN_THEME_OPTIONS = WEEKLY_THEMES.map((t) => ({ value: t, label: t }))
const GEN_CATEGORY_OPTIONS = GEN_CATEGORIES.map((c) => ({
  value: c,
  label: c.replace(/_/g, ' '),
}))

function statusPillClass(s: ChallengeStatus): string {
  if (s === 'DRAFT') return 'border-hd-border bg-hd-surface text-hd-muted'
  if (s === 'SCHEDULED') return 'border-hd-amber/40 bg-hd-amber/10 text-hd-amber'
  if (s === 'ACTIVE') return 'border-hd-emerald/40 bg-hd-emerald/10 text-hd-emerald'
  if (s === 'CLOSED') return 'border-hd-border bg-hd-card text-hd-muted'
  return 'border-hd-border bg-hd-card text-hd-muted'
}

function formatOpens(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function AdminChallengesPage() {
  const { user } = useAuthUser()
  const canWrite = user?.role === 'ADMIN'
  const [tab, setTab] = useState<ChallengeStatus>('DRAFT')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [genOpen, setGenOpen] = useState(false)
  const [genTheme, setGenTheme] = useState<string>(WEEKLY_THEMES[0])
  const [genCategory, setGenCategory] = useState<Category>('BACKEND')
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const { data, loading, error, refetch } = useAdminChallenges({ status: tab, page, limit: 20 })
  const { data: activeMeta } = useAdminChallenges({ status: 'ACTIVE', page: 1, limit: 1 })

  const { mutate: publishOne } = usePublishChallenge(() => void refetch())
  const { mutate: deleteOne } = useDeleteChallenge(() => {
    void refetch()
    setSelectedId(null)
    setDrawerOpen(false)
  })
  const { mutate: generate, loading: genBusy, error: genErr } = useGenerateChallenge()
  const toast = useToast()
  const { mutate: closeChallengeRow } = useCloseChallenge(() => {
    toast.push('Challenge closed. Rankings computing.', 'success')
    void refetch()
  })
  const { mutate: archiveChallengeRow } = useArchiveChallenge(() => void refetch())

  const rangeLabel = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

  const openEdit = (row: AdminChallengeRow) => {
    setSelectedId(row.id)
    setDrawerOpen(true)
  }

  const rows = data?.data ?? []

  return (
    <div className="mx-auto max-w-[1400px] pb-16">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[22px] font-medium text-hd-text">Challenge review</h1>
          <p className="mt-1 text-sm text-hd-muted">{rangeLabel}</p>
          {user?.role === 'MODERATOR' && (
            <p className="mt-3 max-w-xl rounded-lg border border-hd-amber/30 bg-hd-amber/10 px-3 py-2 text-sm text-hd-amber">
              You can review the queue as a moderator. Generating challenges, publishing, editing,
              and deletes require an administrator.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-hd-emerald/30 bg-hd-emerald/10 px-3 py-1 font-mono text-xs text-hd-emerald">
            Active challenges · {activeMeta?.total ?? 0}
          </span>
          <button
            type="button"
            disabled={!canWrite}
            title={!canWrite ? 'Admin only' : undefined}
            onClick={() => canWrite && setGenOpen(true)}
            className={`rounded-full border border-hd-indigo px-4 py-2 text-sm font-medium text-hd-indigo-tint hover:bg-hd-indigo-surface disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Generate new
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.status}
            type="button"
            onClick={() => {
              setTab(t.status)
              setPage(1)
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.status
                ? 'bg-hd-indigo text-white'
                : 'border border-hd-border text-hd-secondary hover:border-hd-border-hover'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 text-sm text-hd-rose-light">
          {error}{' '}
          <button type="button" onClick={() => void refetch()} className="underline">
            Retry
          </button>
        </p>
      )}

      <div className="overflow-x-auto rounded-[12px] border border-hd-border bg-hd-card">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-hd-border text-xs uppercase tracking-wide text-hd-muted">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Difficulty</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Opens at</th>
              <th className="px-4 py-3 font-medium">Submissions</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              [0, 1, 2].map((i) => (
                <tr key={i} className="h-[52px] border-b border-hd-border">
                  <td colSpan={7} className="px-4">
                    <div className="h-4 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
                  </td>
                </tr>
              ))}
            {!loading &&
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={`h-[52px] border-b border-hd-border transition-colors hover:bg-hd-hover ${
                    highlightId === row.id ? 'ring-2 ring-inset ring-hd-indigo/50' : ''
                  }`}
                >
                  <td className="px-4">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-left text-[14px] font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
                    >
                      {row.title}
                    </button>
                  </td>
                  <td className="px-4">
                    <span className="inline-flex rounded-full border border-hd-indigo/30 bg-hd-indigo-surface px-2 py-0.5 font-mono text-[11px] text-hd-indigo-tint">
                      {row.category}
                    </span>
                  </td>
                  <td className="px-4">
                    <span className="inline-flex rounded-full border border-hd-border bg-hd-surface px-2 py-0.5 font-mono text-[11px] text-hd-secondary">
                      {row.difficulty}
                    </span>
                  </td>
                  <td className="px-4">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[11px] ${statusPillClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 font-mono text-xs text-hd-muted">
                    {formatOpens(row.opensAt)}
                  </td>
                  <td className="px-4 font-mono text-xs text-hd-text">{row.submissionCount}</td>
                  <td className="px-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(row)}
                        className="rounded-md p-2 text-hd-muted hover:bg-hd-hover hover:text-hd-text"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>
                      {canWrite && (row.status === 'DRAFT' || row.status === 'SCHEDULED') && (
                        <button
                          type="button"
                          title="Publish"
                          onClick={() => void publishOne(row.id)}
                          className="rounded-md p-2 text-hd-muted hover:bg-hd-hover hover:text-hd-emerald"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      )}
                      {canWrite && (row.status === 'DRAFT' || row.status === 'SCHEDULED') && (
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => {
                            if (window.confirm('Soft-delete this challenge?'))
                              void deleteOne(row.id)
                          }}
                          className="rounded-md p-2 text-hd-muted hover:bg-hd-hover hover:text-hd-rose-light"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path d="M3 6h18M8 6V4h8v2M19 6v14H5V6M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      )}
                      {canWrite && row.status === 'ACTIVE' && (
                        <button
                          type="button"
                          title="Close challenge"
                          onClick={() => {
                            if (
                              !window.confirm(
                                'Close this challenge? Submissions will lock and preliminary ranking will run.',
                              )
                            ) {
                              return
                            }
                            void closeChallengeRow(row.id).catch((e) => {
                              const msg = e instanceof Error ? e.message : 'Could not close'
                              toast.push(msg, 'error')
                            })
                          }}
                          className="rounded-md p-2 text-hd-muted hover:bg-hd-hover hover:text-hd-amber"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <rect x="6" y="11" width="12" height="9" rx="1" strokeWidth="2" />
                            <path strokeWidth="2" d="M9 11V8a3 3 0 016 0v3" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                      {canWrite && row.status === 'CLOSED' && (
                        <button
                          type="button"
                          title="Archive"
                          onClick={() => void archiveChallengeRow(row.id)}
                          className="rounded-md p-2 text-hd-muted hover:bg-hd-hover hover:text-hd-text"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeWidth="2"
                              d="M4 7h16M6 7V5h12v2M9 11v6M15 11v6M8 21h8l1-8H7l1 8z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-hd-muted">
                  No challenges in this tab.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="text-sm text-hd-indigo-tint hover:underline"
          >
            Next page
          </button>
        </div>
      )}

      <AdminChallengeEditDrawer
        challengeId={selectedId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedId(null)
        }}
        onSaved={() => void refetch()}
        canWrite={canWrite}
      />

      {genOpen && canWrite && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[170] bg-black/60"
            aria-label="Close"
            onClick={() => !genBusy && setGenOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[180] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[16px] border border-hd-border bg-hd-elevated p-6 shadow-xl">
            <h2 className="text-lg font-medium text-hd-text">Generate draft challenge</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-hd-secondary">
                Theme
                <div className="mt-1">
                  <HdSelect
                    aria-label="Weekly theme"
                    value={genTheme}
                    onChange={(v) => setGenTheme(v)}
                    options={GEN_THEME_OPTIONS}
                    buttonClassName="bg-hd-card"
                  />
                </div>
              </label>
              <label className="block text-sm text-hd-secondary">
                Category
                <div className="mt-1">
                  <HdSelect
                    aria-label="Category"
                    value={genCategory}
                    onChange={(v) => setGenCategory(v as Category)}
                    options={GEN_CATEGORY_OPTIONS}
                    buttonClassName="bg-hd-card"
                  />
                </div>
              </label>
              {genErr && <p className="text-sm text-hd-rose-light">{genErr}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={genBusy}
                onClick={() => setGenOpen(false)}
                className="rounded-full px-4 py-2 text-sm text-hd-muted hover:text-hd-text"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={genBusy}
                onClick={() => {
                  void (async () => {
                    try {
                      const r = await generate(genTheme, genCategory)
                      setGenOpen(false)
                      setTab('DRAFT')
                      setHighlightId(r.id)
                      void refetch()
                      window.setTimeout(() => setHighlightId(null), 4000)
                    } catch {
                      /* genErr set */
                    }
                  })()
                }}
                className="rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover disabled:opacity-40"
              >
                {genBusy ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
