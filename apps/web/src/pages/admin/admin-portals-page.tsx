import { useMemo, useState } from 'react'
import { useAuthUser } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { useAdminPortals, type AdminPortalRow } from '@/hooks/admin/useAdminPortals'
import { useAdminPortalStats } from '@/hooks/admin/useAdminPortalStats'
import { useAdminPortalDetail } from '@/hooks/admin/useAdminPortalDetail'
import { useApprovePortal } from '@/hooks/admin/useApprovePortal'
import { useRejectPortal } from '@/hooks/admin/useRejectPortal'
import { AdminPortalDetailDrawer } from '@/pages/admin/admin-portal-detail-drawer'

const TABS: { label: string; status: 'pending' | 'approved' | 'all' }[] = [
  { label: 'Pending', status: 'pending' },
  { label: 'Approved', status: 'approved' },
  { label: 'All', status: 'all' },
]

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`
  return d.toLocaleDateString()
}

function isRejected(row: AdminPortalRow): boolean {
  return row.rejectedAt != null
}

function isPendingRow(row: AdminPortalRow): boolean {
  return !row.isApproved && !isRejected(row)
}

function isApprovedRow(row: AdminPortalRow): boolean {
  return row.isApproved && !isRejected(row)
}

export default function AdminPortalsPage() {
  const { user } = useAuthUser()
  const canWrite = user?.role === 'ADMIN'
  const toast = useToast()
  const [tab, setTab] = useState<'pending' | 'approved' | 'all'>('pending')
  const [page, setPage] = useState(1)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { pendingCount } = useAdminPortalStats(true)
  const { data, loading, error, refetch } = useAdminPortals({ status: tab, page, limit: 20 })
  const { data: detail, loading: detailLoading } = useAdminPortalDetail(
    drawerOpen ? drawerId : null,
  )

  const { mutate: approve } = useApprovePortal(() => {
    toast.push('Portal approved — confirmation email sent', 'success')
    void refetch()
  })
  const { mutate: reject } = useRejectPortal(() => {
    toast.push('Portal rejected', 'success')
    void refetch()
  })

  const rows = data?.data ?? []
  const total = data?.total ?? 0
  const limit = 20
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const rangeLabel = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

  const openDetail = (id: string) => {
    setDrawerId(id)
    setDrawerOpen(true)
  }

  const copyEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(email).then(() => {
      toast.push('Email copied', 'success')
    })
  }

  return (
    <div className="mx-auto max-w-[1400px] pb-16">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[22px] font-medium text-hd-text">Company portals</h1>
          <p className="mt-1 text-sm text-hd-muted">{rangeLabel}</p>
          {user?.role === 'MODERATOR' && (
            <p className="mt-3 max-w-xl rounded-lg border border-hd-amber/30 bg-hd-amber/10 px-3 py-2 text-sm text-hd-amber">
              You can review portal applications. Approve and reject actions require an
              administrator.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {pendingCount > 0 ? (
            <span className="rounded-full border border-hd-amber/40 bg-hd-amber/15 px-3 py-1 font-mono text-xs text-hd-amber">
              {pendingCount} awaiting review
            </span>
          ) : (
            <span className="rounded-full border border-hd-border bg-hd-surface px-3 py-1 font-mono text-xs text-hd-muted">
              No pending portals
            </span>
          )}
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
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-hd-border text-xs uppercase tracking-wide text-hd-muted">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Challenges</th>
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
              rows.map((row) => {
                const rejected = isRejected(row)
                const pending = isPendingRow(row)
                const approved = isApprovedRow(row)
                return (
                  <tr
                    key={row.id}
                    className={`h-[52px] border-b border-hd-border transition-colors hover:bg-hd-hover ${
                      approved ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (approved) openDetail(row.id)
                    }}
                  >
                    <td className="px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-hd-text">{row.companyName}</span>
                        {row.linkedinUrl ? (
                          <a
                            href={row.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-hd-indigo-tint hover:text-hd-indigo-hover"
                            title="LinkedIn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 text-hd-secondary">{row.contactName}</td>
                    <td className="px-4">
                      <button
                        type="button"
                        title={row.contactEmail}
                        onClick={(e) => copyEmail(row.contactEmail, e)}
                        className="max-w-[200px] truncate text-left font-mono text-[12px] text-hd-indigo-tint hover:underline"
                      >
                        {row.contactEmail}
                      </button>
                    </td>
                    <td className="px-4 font-mono text-[12px] text-hd-muted">{row.domainEmail}</td>
                    <td className="px-4 text-hd-muted">{formatRelative(row.createdAt)}</td>
                    <td className="px-4 font-mono text-hd-text">{row._count.challenges}</td>
                    <td className="px-4">
                      {tab === 'approved' && approved && (
                        <button
                          type="button"
                          title="View"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDetail(row.id)
                          }}
                          className="rounded-md p-2 text-hd-muted hover:bg-hd-hover hover:text-hd-text"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      )}
                      {tab === 'pending' && pending && canWrite && (
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              void approve(row.id)
                            }}
                            className="rounded-full bg-hd-emerald/15 px-2.5 py-1 text-xs font-medium text-hd-emerald hover:bg-hd-emerald/25"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (
                                !window.confirm(
                                  'Reject this portal application? A rejection email will be sent.',
                                )
                              ) {
                                return
                              }
                              void reject(row.id)
                            }}
                            className="rounded-full border border-hd-rose/40 bg-transparent px-2.5 py-1 text-xs font-medium text-hd-rose-light hover:bg-hd-rose/10"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {tab === 'all' && rejected && (
                        <span className="inline-flex rounded-full border border-hd-border bg-hd-surface px-2 py-0.5 font-mono text-[11px] text-hd-muted">
                          Rejected
                        </span>
                      )}
                      {tab === 'all' && pending && canWrite && (
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              void approve(row.id)
                            }}
                            className="rounded-full bg-hd-emerald/15 px-2.5 py-1 text-xs font-medium text-hd-emerald hover:bg-hd-emerald/25"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (
                                !window.confirm(
                                  'Reject this portal application? A rejection email will be sent.',
                                )
                              ) {
                                return
                              }
                              void reject(row.id)
                            }}
                            className="rounded-full border border-hd-rose/40 bg-transparent px-2.5 py-1 text-xs font-medium text-hd-rose-light hover:bg-hd-rose/10"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {tab === 'all' && approved && (
                        <button
                          type="button"
                          title="View"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDetail(row.id)
                          }}
                          className="rounded-md p-2 text-hd-muted hover:bg-hd-hover hover:text-hd-text"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-hd-border px-4 py-1.5 text-sm text-hd-secondary hover:bg-hd-hover disabled:opacity-40"
          >
            Previous
          </button>
          <span className="font-mono text-xs text-hd-muted">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full border border-hd-border px-4 py-1.5 text-sm text-hd-secondary hover:bg-hd-hover disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <AdminPortalDetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setDrawerId(null)
        }}
        detail={detail}
        loading={detailLoading}
      />
    </div>
  )
}
