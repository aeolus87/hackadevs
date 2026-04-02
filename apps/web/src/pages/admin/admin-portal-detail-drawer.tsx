import type { AdminPortalDetail } from '@/hooks/admin/useAdminPortalDetail'

type Props = {
  open: boolean
  onClose: () => void
  detail: AdminPortalDetail | null
  loading: boolean
}

function challengeTitle(row: AdminPortalDetail['challenges'][0]): string {
  return (
    row.challenge?.title ?? row.rawProblem.slice(0, 80) + (row.rawProblem.length > 80 ? '…' : '')
  )
}

export function AdminPortalDetailDrawer({ open, onClose, detail, loading }: Props) {
  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col border-l border-hd-border bg-hd-card shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-hd-border px-5 py-4">
          <h2 className="text-base font-medium text-hd-text">Portal detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-hd-muted hover:bg-hd-hover hover:text-hd-text"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm">
          {loading && (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-hd-hover" />
              ))}
            </div>
          )}
          {!loading && detail && (
            <div className="space-y-5 text-hd-secondary">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-hd-muted">Company</p>
                <p className="mt-1 text-hd-text">{detail.companyName}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-hd-muted">Contact</p>
                <p className="mt-1 text-hd-text">{detail.contactName}</p>
                <p className="mt-0.5">{detail.contactEmail}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-hd-muted">
                  Domain email
                </p>
                <p className="mt-1 font-mono text-[13px] text-hd-text">{detail.domainEmail}</p>
              </div>
              {detail.linkedinUrl ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-hd-muted">
                    LinkedIn
                  </p>
                  <a
                    href={detail.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-hd-indigo-tint hover:underline"
                  >
                    {detail.linkedinUrl}
                  </a>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-hd-muted">
                  Approved
                </p>
                <p className="mt-1 text-hd-text">
                  {detail.verifiedAt ? new Date(detail.verifiedAt).toLocaleString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-hd-muted">
                  Bookmarks
                </p>
                <p className="mt-1 text-hd-text">{detail._count.bookmarks}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-hd-muted">
                  Portal ID
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-hd-muted">{detail.id}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-hd-muted">
                  Challenges submitted
                </p>
                <ul className="mt-2 space-y-2">
                  {detail.challenges.length === 0 ? (
                    <li className="text-hd-muted">None yet</li>
                  ) : (
                    detail.challenges.map((c) => (
                      <li
                        key={c.id}
                        className="rounded-lg border border-hd-border bg-hd-surface px-3 py-2"
                      >
                        <p className="font-medium text-hd-text">{challengeTitle(c)}</p>
                        <p className="mt-1 font-mono text-[11px] text-hd-muted">{c.status}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
