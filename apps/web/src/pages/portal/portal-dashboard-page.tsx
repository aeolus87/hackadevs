import { Link } from 'react-router-dom'
import { authPrimaryButtonClassName } from '@/components/auth-page-shell'
import { InlineError } from '@/components/inline-error'
import { usePortalBookmarks } from '@/hooks/portal/usePortalBookmarks'
import { usePortalChallenges } from '@/hooks/portal/usePortalChallenges'
import { clearPortalSession } from '@/lib/portal-storage'
import type { PortalCompanyChallenge } from '@/types/portal.types'

function statusLabel(s: PortalCompanyChallenge['status']) {
  switch (s) {
    case 'PENDING':
      return 'pending'
    case 'SANITISING':
      return 'processing'
    case 'APPROVED':
      return 'active'
    case 'REJECTED':
      return 'rejected'
    default:
      return s
  }
}

export default function PortalDashboardPage() {
  const { data: challenges, loading: chLoading, error: chError, refetch } = usePortalChallenges()
  const { data: bookmarks, loading: bmLoading, error: bmError } = usePortalBookmarks()

  const pendingApproval = chError === 'portal_not_approved' || bmError === 'portal_not_approved'

  const signOut = () => {
    clearPortalSession()
    window.location.assign('/portal/register')
  }

  if (pendingApproval) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-hd-page px-4 py-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.12] via-transparent to-emerald-500/[0.06]" />
        <div className="relative mx-auto max-w-lg rounded-xl border border-hd-border border-l-4 border-l-amber-500 bg-hd-card p-6 shadow-hd-card">
          <h1 className="text-lg font-medium text-hd-text">Pending approval</h1>
          <p className="mt-2 text-sm text-hd-secondary">
            Your company registration is waiting for staff approval. You will be able to submit
            challenges and manage bookmarks once approved.
          </p>
          <button type="button" onClick={signOut} className={`mt-6 ${authPrimaryButtonClassName}`}>
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-hd-page px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.12] via-transparent to-emerald-500/[0.06]" />
      <div className="relative mx-auto max-w-3xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-medium text-hd-text">Company portal</h1>
            <p className="mt-1 text-sm text-hd-secondary">
              Submitted challenges and saved solvers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/portal/submit"
              className="inline-flex items-center justify-center rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover"
            >
              Submit a challenge
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-hd-border px-4 py-2 text-sm font-medium text-hd-text hover:bg-hd-hover"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="rounded-xl border border-hd-border bg-hd-card p-5 shadow-hd-card">
          <h2 className="text-sm font-medium text-hd-text">Your challenges</h2>
          {chError && chError !== 'portal_not_approved' ? (
            <div className="mt-3">
              <InlineError message={chError} onRetry={() => void refetch()} />
            </div>
          ) : null}
          {chLoading && !challenges ? <p className="mt-3 text-sm text-hd-muted">Loading…</p> : null}
          {!chLoading && challenges && challenges.length === 0 ? (
            <p className="mt-3 text-sm text-hd-muted">No submissions yet.</p>
          ) : null}
          {challenges && challenges.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {challenges.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-hd-border/80 bg-hd-surface/40 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-hd-muted">
                      {c.id.slice(0, 12)}…
                    </span>
                    <span className="rounded-full border border-hd-border px-2 py-0.5 font-mono text-[10px] uppercase text-hd-secondary">
                      {statusLabel(c.status)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-hd-secondary">{c.rawProblem}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="rounded-xl border border-hd-border bg-hd-card p-5 shadow-hd-card">
          <h2 className="text-sm font-medium text-hd-text">Bookmarked solvers</h2>
          {bmError && bmError !== 'portal_not_approved' ? (
            <p className="mt-3 text-sm text-hd-rose">{bmError}</p>
          ) : null}
          {bmLoading && !bookmarks ? <p className="mt-3 text-sm text-hd-muted">Loading…</p> : null}
          {!bmLoading && bookmarks && bookmarks.length === 0 ? (
            <p className="mt-3 text-sm text-hd-muted">No bookmarks yet.</p>
          ) : null}
          {bookmarks && bookmarks.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {bookmarks.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-hd-border/80 bg-hd-surface/40 px-3 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/u/${b.submission.user.username}`}
                      className="font-medium text-hd-text hover:text-hd-indigo-tint"
                    >
                      {b.submission.user.displayName || b.submission.user.username}
                    </Link>
                    <span className="text-hd-muted"> · </span>
                    <span className="text-sm text-hd-secondary">
                      {b.submission.challenge.title}
                    </span>
                  </div>
                  <Link
                    to={`/challenge/${b.submission.challenge.slug}`}
                    className="shrink-0 text-sm font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
                  >
                    Challenge
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <p className="text-center text-[13px] text-hd-muted">
          <Link to="/feed" className="text-hd-indigo-tint hover:text-hd-indigo-hover">
            HackaDevs home
          </Link>
        </p>
      </div>
    </div>
  )
}
