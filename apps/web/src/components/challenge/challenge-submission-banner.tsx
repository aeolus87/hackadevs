import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Challenge as ApiChallenge } from '@/types/hackadevs-api.types'
import type { Submission } from '@/types/hackadevs-api.types'
import { useWithdrawForRevision } from '@/hooks/submissions/useWithdrawForRevision'
import { useToast } from '@/contexts/toast-context'
import { parseAxiosError } from '@/utils/axios-message'
import { WithdrawRevisionModal } from '@/components/challenge/withdraw-revision-modal'

function relativeSaved(iso?: string): string {
  if (!iso) return 'recently'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'recently'
  const ms = Date.now() - d.getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function closesAtLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

type ChallengeSubmissionBannerProps = {
  submission: Submission | null
  apiChallenge: ApiChallenge
  challengeSlug: string
  onWithdrawSuccess?: () => void
}

export function ChallengeSubmissionBanner({
  submission,
  apiChallenge,
  challengeSlug,
  onWithdrawSuccess,
}: ChallengeSubmissionBannerProps) {
  const toast = useToast()
  const { withdraw, loading: withdrawBusy } = useWithdrawForRevision()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const now = new Date()
  const chClosed =
    apiChallenge.status === 'CLOSED' ||
    apiChallenge.status === 'ARCHIVED' ||
    (apiChallenge.closesAt != null && new Date(apiChallenge.closesAt) <= now)
  const chActive = apiChallenge.status === 'ACTIVE' && !chClosed

  if (!submission) return null

  const st = submission.status

  if (st === 'DRAFT' && chActive) {
    return (
      <div className="mb-4 flex gap-3 rounded-[12px] border border-hd-amber/35 border-l-4 border-l-hd-amber bg-hd-amber/10 px-4 py-3">
        <span className="mt-0.5 text-hd-amber" aria-hidden>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1 text-sm text-hd-secondary">
          <p className="font-medium text-hd-text">You have a draft in progress</p>
          <p className="mt-1 text-[12px]">Last saved {relativeSaved(submission.updatedAt)}</p>
          <Link
            to={`/challenge/${challengeSlug}/submit`}
            className="mt-2 inline-flex font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
          >
            Resume
          </Link>
        </div>
      </div>
    )
  }

  if (st === 'AWAITING_FOLLOWUP') {
    return (
      <div className="mb-4 flex gap-3 rounded-[12px] border border-hd-amber/35 border-l-4 border-l-hd-amber bg-hd-amber/10 px-4 py-3">
        <span className="mt-0.5 text-hd-amber" aria-hidden>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" d="M12 15v2m0-8v4m0 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <div className="text-sm text-hd-secondary">
          <p className="font-medium text-hd-text">Verification required</p>
          <p className="mt-1 text-[12px]">
            Answer two short questions about your code before your solution is published.{' '}
            <Link
              to={`/challenge/${challengeSlug}/submit`}
              className="font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
            >
              Continue
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (st === 'SUBMITTED') {
    return (
      <div className="mb-4 flex gap-3 rounded-[12px] border border-hd-indigo/35 border-l-4 border-l-hd-indigo bg-hd-indigo-surface px-4 py-3">
        <span className="mt-0.5 shrink-0 text-hd-indigo-tint" aria-hidden>
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </span>
        <div className="text-sm text-hd-secondary">
          <p className="font-medium text-hd-text">Your solution is being evaluated</p>
          <p className="mt-1 text-[12px]">
            Finish verification on the{' '}
            <Link
              to={`/challenge/${challengeSlug}/submit`}
              className="font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
            >
              submit page
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

  if (st === 'FLAGGED') {
    return (
      <div className="mb-4 flex gap-3 rounded-[12px] border border-hd-amber/35 border-l-4 border-l-hd-amber bg-hd-amber/10 px-4 py-3">
        <span className="mt-0.5 text-hd-amber" aria-hidden>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" d="M12 9v2m0 4h.01M12 5l9 16H3l9-16z" />
          </svg>
        </span>
        <div className="text-sm text-hd-secondary">
          <p className="font-medium text-hd-text">Your submission is under review</p>
          <p className="mt-1 text-[12px]">
            Our team is reviewing your solution. Usually resolved within 24 hours.
          </p>
        </div>
      </div>
    )
  }

  if (st === 'PUBLISHED') {
    const revisionOpen =
      chActive && apiChallenge.closesAt != null && new Date(apiChallenge.closesAt) > now
    if (chActive) {
      return (
        <>
          <div className="mb-4 flex gap-3 rounded-[12px] border border-hd-emerald/35 border-l-4 border-l-hd-emerald bg-hd-emerald/10 px-4 py-3">
            <span className="mt-0.5 text-hd-emerald" aria-hidden>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 text-sm text-hd-secondary">
              <p className="font-medium text-hd-text">Your solution is live</p>
              <p className="mt-1 font-mono text-[12px] text-hd-muted">
                {submission.testScore != null && (
                  <span>Tests {Math.round(submission.testScore)}%</span>
                )}
                {submission.rationaleScore != null && (
                  <span>
                    {submission.testScore != null ? ' · ' : ''}Rationale {submission.rationaleScore}
                    /100
                  </span>
                )}
                {submission.compositeScore != null && (
                  <span> · Composite {submission.compositeScore.toFixed(1)}</span>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/challenge/${challengeSlug}/solutions/${submission.id}`}
                  className="inline-flex rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover"
                >
                  View your solution
                </Link>
                {revisionOpen ? (
                  <button
                    type="button"
                    onClick={() => setWithdrawOpen(true)}
                    className="inline-flex rounded-full border border-hd-rose/40 bg-hd-rose/10 px-4 py-2 text-sm font-medium text-hd-rose-light hover:bg-hd-rose/15"
                  >
                    Withdraw to revise
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <WithdrawRevisionModal
            open={withdrawOpen}
            onClose={() => setWithdrawOpen(false)}
            closesAtLabel={
              apiChallenge.closesAt ? closesAtLabel(apiChallenge.closesAt) : 'the deadline'
            }
            busy={withdrawBusy}
            onConfirm={() => {
              void (async () => {
                try {
                  await withdraw(submission.id)
                  setWithdrawOpen(false)
                  toast.push('Solution withdrawn. You can now revise and resubmit.', 'success')
                  onWithdrawSuccess?.()
                } catch (e) {
                  toast.push(parseAxiosError(e).message || 'Could not withdraw', 'error')
                }
              })()
            }}
          />
        </>
      )
    }
    const rank = submission.finalRank
    const total = apiChallenge.submissionCount
    return (
      <div className="mb-4 flex gap-3 rounded-[12px] border border-hd-emerald/35 border-l-4 border-l-hd-emerald bg-hd-emerald/10 px-4 py-3">
        <span className="mt-0.5 text-hd-emerald" aria-hidden>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <div className="min-w-0 flex-1 text-sm text-hd-secondary">
          <p className="font-medium text-hd-text">Your solution is live — challenge closed</p>
          {rank != null && total > 0 ? (
            <p className="mt-1 text-[12px]">
              You ranked #{rank} of {total} submissions
            </p>
          ) : null}
          <Link
            to={`/challenge/${challengeSlug}/solutions/${submission.id}`}
            className="mt-3 inline-flex rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover"
          >
            View your solution
          </Link>
        </div>
      </div>
    )
  }

  if (st === 'WITHDRAWN') {
    return (
      <div className="mb-4 flex gap-3 rounded-[12px] border border-hd-border border-l-4 border-l-hd-muted bg-hd-card px-4 py-3">
        <span className="mt-0.5 text-hd-muted" aria-hidden>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" d="M18 6L6 18M6 6l12 12" />
          </svg>
        </span>
        <div className="text-sm text-hd-secondary">
          <p className="font-medium text-hd-text">You withdrew your solution</p>
          <Link
            to={`/challenge/${challengeSlug}/submit`}
            className="mt-2 inline-flex font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
          >
            Start over
          </Link>
        </div>
      </div>
    )
  }

  return null
}
