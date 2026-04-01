import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RationaleInput, type RationaleParts } from '@/components/rationale-input'
import { SolutionEditor, type TestCaseResult } from '@/components/solution-editor'
import { TagPill } from '@/components/tag-pill'
import { InlineError } from '@/components/inline-error'
import { SkeletonCard } from '@/components/skeleton-card'
import { HdModal } from '@/components/ui/hd-modal'
import { useAuthUser } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { useChallenge } from '@/hooks/challenges/useChallenge'
import { useMe } from '@/hooks/users/useMe'
import { useMySubmission } from '@/hooks/submissions/useMySubmission'
import { useRunTests } from '@/hooks/submissions/useRunTests'
import { useSaveDraft } from '@/hooks/submissions/useSaveDraft'
import { useCompleteFollowUp } from '@/hooks/submissions/useCompleteFollowUp'
import { useSubmitSolution } from '@/hooks/submissions/useSubmitSolution'
import { useWithdrawForRevision } from '@/hooks/submissions/useWithdrawForRevision'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import { apiChallengeToUi } from '@/utils/map-api-challenge'
import { SUBMISSIONS } from '@/utils/api.routes'
import { axiosInstance } from '@/utils/axios.instance'
import { parseAxiosError } from '@/utils/axios-message'
import type { Submission } from '@/types/hackadevs-api.types'

const suggestTags = [
  'clean-architecture',
  'O(1)-space',
  'redis-pattern',
  'observability',
  'rollout-safe',
]

function rationaleLength(p: RationaleParts): number {
  return `${p.approach}\n${p.tradeoffs}\n${p.scale}`.trim().length
}

export default function SubmitSolutionPage() {
  const { isAuthenticated } = useAuthUser()
  const navigate = useNavigate()
  const { slug = '' } = useParams()
  const { data: apiCh, loading: chLoading, error: chError, refetch: refetchCh } = useChallenge(slug)
  const challenge = useMemo(() => (apiCh ? apiChallengeToUi(apiCh) : null), [apiCh])
  const challengeId = apiCh?.id ?? ''
  const { data: mine, loading: mineLoading, refetch: refetchMine } = useMySubmission(challengeId)
  const { refetch: refetchMe } = useMe()
  const { mutate: saveDraft } = useSaveDraft()
  const { mutate: runTestsApi } = useRunTests()
  const { mutate: submitApi } = useSubmitSolution()
  const { mutate: completeFollowUp, loading: followUpBusy } = useCompleteFollowUp()
  const { withdraw: withdrawForRevision, loading: withdrawBusy } = useWithdrawForRevision()
  const toast = useToast()
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [code, setCode] = useState(`// ${challenge?.title ?? 'Challenge'}\n\n`)
  const [rationaleParts, setRationaleParts] = useState<RationaleParts>({
    approach: '',
    tradeoffs: '',
    scale: '',
  })
  const [testScorePercent, setTestScorePercent] = useState<number | null>(null)
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null)
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [difficultyDots, setDifficultyDots] = useState(3)
  const [pendingVerification, setPendingVerification] = useState<
    { id: string; prompt: string }[] | null
  >(null)
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({})
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)
  const [submitResult, setSubmitResult] = useState<Submission | null>(null)
  const [resumeFlagBusy, setResumeFlagBusy] = useState(false)
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)

  const verificationActive = (pendingVerification?.length ?? 0) > 0

  useEffect(() => {
    if (!mine) return
    if (mine.status === 'DRAFT') {
      setSubmissionId(mine.id)
      setCode((prev) => mine.code ?? prev)
      setRationaleParts({
        approach: mine.rationaleApproach ?? '',
        tradeoffs: mine.rationaleTradeoffs ?? '',
        scale: mine.rationaleScale ?? '',
      })
      setTags(mine.selfTags ?? [])
      setDifficultyDots(mine.selfDifficultyRating ?? 3)
      setPendingVerification(null)
    }
    if (mine.status === 'AWAITING_FOLLOWUP') {
      setSubmissionId(mine.id)
      setCode((prev) => mine.code ?? prev)
      const q = mine.followUpQuestions
      if (Array.isArray(q) && q.length > 0) {
        setPendingVerification(q as { id: string; prompt: string }[])
      }
    }
  }, [mine])

  useEffect(() => {
    if (!isAuthenticated || !challengeId || mine?.status === 'AWAITING_FOLLOWUP') return
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const sub = await saveDraft({
            challengeId,
            code,
            language: 'TS',
            rationaleApproach: rationaleParts.approach,
            rationaleTradeoffs: rationaleParts.tradeoffs,
            rationaleScale: rationaleParts.scale,
            selfTags: tags,
            selfDifficultyRating: difficultyDots,
          })
          setSubmissionId(sub.id)
        } catch (e) {
          toast.push(parseAxiosError(e).message || 'Draft could not be saved', 'error')
        }
      })()
    }, 3000)
    return () => window.clearTimeout(t)
  }, [
    challengeId,
    code,
    rationaleParts.approach,
    rationaleParts.tradeoffs,
    rationaleParts.scale,
    tags,
    difficultyDots,
    saveDraft,
    isAuthenticated,
    mine?.status,
  ])

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-[16px] border border-hd-border bg-hd-card p-8">
        <h1 className="text-xl font-medium text-hd-text">Sign in to submit</h1>
        <p className="text-sm text-hd-secondary">
          Saving drafts and running tests need an account. Sign in or register to continue working
          on this challenge.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/login"
            state={{ returnTo: slug ? `/challenge/${slug}/submit` : '/feed' }}
            className="inline-flex rounded-full bg-hd-indigo px-5 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex rounded-full border border-hd-border px-5 py-2 text-sm font-medium text-hd-text hover:border-hd-border-hover"
          >
            Create account
          </Link>
        </div>
        <Link
          to={slug ? `/challenge/${slug}` : '/feed'}
          className="text-sm text-hd-indigo-tint hover:underline"
        >
          ← Back to challenge
        </Link>
      </div>
    )
  }

  if (chLoading && !apiCh) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <SkeletonCard />
      </div>
    )
  }

  if (chError && !apiCh) {
    return (
      <div className="mx-auto max-w-lg">
        <InlineError message={chError} onRetry={() => void refetchCh()} />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="mx-auto max-w-lg text-sm text-hd-secondary">
        Challenge not found.{' '}
        <Link to="/feed" className="font-medium text-hd-indigo-tint hover:text-hd-indigo-hover">
          Home
        </Link>
      </div>
    )
  }

  if (challengeId && mineLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <SkeletonCard />
      </div>
    )
  }

  if (mine?.status === 'PUBLISHED' && mine.id) {
    const revisionWindowOpen =
      apiCh?.status === 'ACTIVE' && apiCh.closesAt != null && new Date(apiCh.closesAt) > new Date()
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-[16px] border border-hd-border bg-hd-card p-8">
        <h1 className="text-xl font-medium text-hd-text">Already submitted</h1>
        <p className="text-sm text-hd-secondary">
          Your solution is published. You can open it read-only, or while the challenge is still
          open you can withdraw it and work on a new attempt (tests and rationale run again on
          submit).
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/challenge/${challenge.slug}/solutions/${mine.id}`}
            className="inline-flex rounded-full bg-hd-indigo px-5 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover"
          >
            View your solution
          </Link>
          {revisionWindowOpen ? (
            <button
              type="button"
              disabled={withdrawBusy}
              onClick={() => setWithdrawConfirmOpen(true)}
              className="inline-flex rounded-full border border-hd-amber/50 bg-hd-amber/10 px-5 py-2 text-sm font-medium text-hd-amber hover:bg-hd-amber/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {withdrawBusy ? 'Working…' : 'Revise & resubmit'}
            </button>
          ) : null}
          <Link
            to={`/challenge/${challenge.slug}`}
            className="inline-flex rounded-full border border-hd-border px-5 py-2 text-sm font-medium text-hd-text hover:border-hd-border-hover"
          >
            Back to challenge
          </Link>
        </div>
        {!revisionWindowOpen && (
          <p className="text-xs text-hd-muted">
            This challenge is closed or no longer active, so published solutions cannot be taken
            back for editing.
          </p>
        )}
        <HdModal
          open={withdrawConfirmOpen}
          onClose={() => setWithdrawConfirmOpen(false)}
          title="Withdraw and edit again?"
          footer={
            <>
              <button
                type="button"
                onClick={() => setWithdrawConfirmOpen(false)}
                className="rounded-full border border-hd-border px-4 py-2 text-sm font-medium text-hd-text hover:bg-hd-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={withdrawBusy}
                onClick={() => {
                  void (async () => {
                    try {
                      await withdrawForRevision(mine.id)
                      setWithdrawConfirmOpen(false)
                      toast.push('Back to draft — you can edit and submit again.', 'success')
                      void refetchMine()
                      void refetchMe()
                      void refetchCh()
                    } catch (e) {
                      const msg = parseAxiosError(e).message
                      if (msg.includes('revision_window_closed')) {
                        toast.push('The challenge is no longer open for revisions.', 'error')
                      } else {
                        toast.push(msg || 'Could not withdraw', 'error')
                      }
                    }
                  })()
                }}
                className="rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                Withdraw to draft
              </button>
            </>
          }
        >
          <p>
            Your entry will leave the public solutions list until you publish again. Any rep already
            tied to this submission for this challenge will be reversed. Your code stays in the
            editor as a starting point.
          </p>
        </HdModal>
      </div>
    )
  }

  if (mine?.status === 'EVALUATED') {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-[16px] border border-hd-border bg-hd-card p-8">
        <h1 className="text-xl font-medium text-hd-text">Not published</h1>
        <p className="text-sm text-hd-secondary">
          Your run did not meet the publish threshold for this challenge. Resubmission is not
          allowed.
        </p>
        <Link
          to={`/challenge/${challenge.slug}`}
          className="inline-flex rounded-full border border-hd-border px-5 py-2 text-sm font-medium text-hd-text hover:border-hd-border-hover"
        >
          Back to challenge
        </Link>
      </div>
    )
  }

  if (mine?.status === 'FLAGGED' && mine.id) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-[16px] border border-hd-border bg-hd-card p-8">
        <h1 className="text-xl font-medium text-hd-text">Verification next</h1>
        <p className="text-sm text-hd-secondary">
          Your tests and rationale are already scored. Finish by answering two short questions about
          your own code — same flow as everyone else, no manual queue.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={resumeFlagBusy}
            onClick={() => {
              void (async () => {
                setResumeFlagBusy(true)
                try {
                  const res = await axiosInstance.post(SUBMISSIONS.RESUME_FOLLOWUP(mine.id))
                  unwrapSuccessData(res.data)
                  await refetchMine()
                } catch (e) {
                  toast.push(parseAxiosError(e).message || 'Could not continue', 'error')
                } finally {
                  setResumeFlagBusy(false)
                }
              })()
            }}
            className="inline-flex rounded-full bg-hd-indigo px-5 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {resumeFlagBusy ? 'Loading…' : 'Continue to verification'}
          </button>
          <Link
            to={`/challenge/${challenge.slug}`}
            className="inline-flex rounded-full border border-hd-border px-5 py-2 text-sm font-medium text-hd-text hover:border-hd-border-hover"
          >
            Back to challenge
          </Link>
        </div>
      </div>
    )
  }

  const rationaleOk = rationaleLength(rationaleParts) >= 100
  const testsOk = testScorePercent != null && testScorePercent >= 50
  const canSubmit = !verificationActive && testsOk && rationaleOk
  const codeEmpty = !code.trim()
  const submitTip = 'Run tests first and write your rationale.'

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const executeSubmit = async () => {
    if (!canSubmit) return
    setSubmitConfirmOpen(false)
    if (submissionId) {
      try {
        const r = await submitApi(submissionId, challenge.slug)
        if (
          r &&
          typeof r === 'object' &&
          'status' in r &&
          (r as { status: string }).status === 'AWAITING_FOLLOWUP'
        ) {
          const af = r as { followUpQuestions: { id: string; prompt: string }[] }
          setPendingVerification(af.followUpQuestions)
          setFollowUpAnswers({})
          void refetchMine()
          return
        }
        if (r && typeof r === 'object' && 'id' in r && 'status' in r) {
          const sub = r as Submission
          if (sub.status === 'PUBLISHED') {
            setSubmitResult(sub)
            void refetchMe()
            void refetchMine()
            void refetchCh()
          }
        }
      } catch {
        return
      }
      return
    }
    toast.push('Save a draft first (wait for auto-save)', 'error')
  }

  const finalizeVerification = async () => {
    if (!submissionId || !pendingVerification?.length) return
    const answers = pendingVerification.map((q) => ({
      id: q.id,
      text: (followUpAnswers[q.id] ?? '').trim(),
    }))
    if (answers.some((a) => a.text.length < 15)) {
      toast.push('Each answer must be at least 15 characters.', 'error')
      return
    }
    try {
      const sub = await completeFollowUp(submissionId, answers)
      setSubmitResult(sub)
      void refetchMe()
      void refetchMine()
      void refetchCh()
    } catch {
      return
    }
  }

  const runTests = async () => {
    if (codeEmpty) return
    if (!submissionId) {
      toast.push(
        'Save your draft first. Your work saves automatically every few seconds; run tests once a draft exists.',
        'error',
      )
      return
    }
    try {
      const r = await runTestsApi(submissionId)
      const total = r.results.length
      const passed = r.results.filter((x) => x.passed).length
      setTestScorePercent(total ? (passed / total) * 100 : 0)
      setTestResults(
        r.results.map((x, i) => ({
          id: `t${i}`,
          name: `Test ${i + 1}`,
          passed: x.passed,
        })),
      )
      setExecutionTimeMs(r.executionTimeMs)
      toast.push(
        passed === total ? 'All tests passed' : 'Some tests failed',
        passed === total ? 'success' : 'error',
      )
    } catch (e) {
      const { message, status } = parseAxiosError(e)
      if (
        status === 422 ||
        message.toLowerCase().includes('visible test') ||
        message.toLowerCase().includes('draft runs')
      ) {
        toast.push(
          'This challenge has no visible tests for draft runs. An admin needs to mark at least one case as visible in the test suite.',
          'error',
        )
      } else {
        toast.push(message || 'Run failed', 'error')
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          to={`/challenge/${challenge.slug}`}
          className="text-sm font-medium text-[rgba(255,255,255,0.6)] transition-colors duration-150 hover:text-hd-text"
        >
          <span className="text-[rgba(255,255,255,0.35)]" aria-hidden>
            ←{' '}
          </span>
          {challenge.title}
        </Link>
      </div>
      <div className="grid min-h-[calc(100dvh-10rem)] gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="flex min-h-[50vh] flex-col lg:min-h-[min(640px,calc(100dvh-10rem))]">
          {challengeId && !submissionId && (
            <p className="mb-2 text-xs text-hd-secondary">
              Your draft saves automatically. Run tests after a draft exists (usually a few
              seconds).
            </p>
          )}
          {verificationActive && pendingVerification && pendingVerification.length > 0 ? (
            <div className="mb-4 rounded-[12px] border border-hd-indigo/35 bg-hd-indigo-surface px-4 py-4">
              <p className="text-sm font-medium text-hd-text">Verification</p>
              <p className="mt-1 text-[13px] text-hd-secondary">
                Short answers about your own code — required before your solution is published and
                earns recognition.
              </p>
              <div className="mt-4 space-y-4">
                {pendingVerification.map((q) => (
                  <div key={q.id}>
                    <label className="text-[13px] text-hd-secondary" htmlFor={`fu-${q.id}`}>
                      {q.prompt}
                    </label>
                    <textarea
                      id={`fu-${q.id}`}
                      rows={4}
                      value={followUpAnswers[q.id] ?? ''}
                      onChange={(e) =>
                        setFollowUpAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="mt-1.5 w-full rounded-[10px] border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-indigo/45 focus:outline-none focus:ring-1 focus:ring-hd-indigo/25"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={followUpBusy}
                onClick={() => void finalizeVerification()}
                className="mt-4 h-11 w-full rounded-full bg-hd-indigo text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-hd-indigo-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {followUpBusy ? 'Publishing…' : 'Publish solution'}
              </button>
            </div>
          ) : null}
          <div
            className={verificationActive ? 'pointer-events-none opacity-50' : undefined}
            aria-hidden={verificationActive}
          >
            <SolutionEditor
              value={code}
              onChange={setCode}
              runDisabled={codeEmpty || !submissionId || verificationActive}
              testResults={testResults}
              executionTimeMs={executionTimeMs}
              onRunTests={() => void runTests()}
            />
          </div>
        </div>
        <div className="flex min-h-0 flex-col gap-6 lg:min-h-[min(640px,calc(100dvh-10rem))]">
          <div
            className={`min-h-0 flex-1 space-y-6 overflow-y-auto ${verificationActive ? 'pointer-events-none opacity-50' : ''}`}
          >
            <RationaleInput parts={rationaleParts} onChange={setRationaleParts} minChars={100} />
            <div className="rounded-[12px] border border-hd-border bg-hd-card p-4">
              <p className="mb-2 text-sm font-medium text-hd-text">Tags</p>
              <div className="flex flex-wrap gap-2">
                {suggestTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`rounded-full border px-2 py-1 font-mono text-[12px] transition-colors duration-150 ${
                      tags.includes(t)
                        ? 'border-hd-indigo bg-hd-indigo-surface text-hd-indigo-tint'
                        : 'border-hd-border text-hd-secondary hover:border-hd-border-hover'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <TagPill key={t}>{t}</TagPill>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-[12px] border border-hd-border bg-hd-card p-4">
              <p className="mb-3 text-sm font-medium text-hd-text">How hard was this for you?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} of 5`}
                    onClick={() => setDifficultyDots(n)}
                    className={`h-3 w-3 rounded-full transition-colors duration-150 ${
                      n <= difficultyDots ? 'bg-hd-indigo' : 'bg-hd-elevated'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={!canSubmit || verificationActive}
            title={
              verificationActive
                ? 'Complete verification questions first'
                : !canSubmit
                  ? submitTip
                  : undefined
            }
            onClick={() => setSubmitConfirmOpen(true)}
            className="h-11 w-full shrink-0 rounded-full bg-hd-indigo text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-hd-indigo-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit solution
          </button>
        </div>
      </div>

      <HdModal
        open={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
        title="Submit this solution?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSubmitConfirmOpen(false)}
              className="rounded-full border border-hd-border px-4 py-2 text-sm font-medium text-hd-text hover:bg-hd-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void executeSubmit()}
              className="rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover"
            >
              Submit
            </button>
          </>
        }
      >
        <p>
          You will not be able to edit your code or rationale after this. You may need to answer a
          couple of short verification questions before your score is finalized.
        </p>
      </HdModal>

      <HdModal
        open={submitResult !== null}
        onClose={() => {
          if (!submitResult) return
          setSubmitResult(null)
          navigate(`/challenge/${challenge.slug}/solutions/${submitResult.id}`)
        }}
        title="You are in"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                if (!submitResult) return
                setSubmitResult(null)
                navigate(`/challenge/${challenge.slug}`)
              }}
              className="rounded-full border border-hd-border px-4 py-2 text-sm font-medium text-hd-text hover:bg-hd-hover"
            >
              Challenge page
            </button>
            <button
              type="button"
              onClick={() => {
                if (!submitResult) return
                const id = submitResult.id
                setSubmitResult(null)
                navigate(`/challenge/${challenge.slug}/solutions/${id}`)
              }}
              className="rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover"
            >
              View solution
            </button>
          </>
        }
      >
        {submitResult ? (
          <div className="space-y-3 text-hd-text">
            <p className="text-[13px] text-hd-secondary">
              Scores below are from this submission. Profile rep updates as challenges close and
              votes roll in.
            </p>
            <ul className="space-y-2 font-mono text-[13px]">
              <li className="flex justify-between gap-4">
                <span className="text-hd-muted">Tests</span>
                <span>
                  {submitResult.testScore != null ? `${Math.round(submitResult.testScore)}%` : '—'}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-hd-muted">Rationale</span>
                <span>
                  {submitResult.rationaleScore != null ? `${submitResult.rationaleScore}/100` : '—'}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-hd-muted">Composite</span>
                <span>
                  {submitResult.compositeScore != null
                    ? submitResult.compositeScore.toFixed(1)
                    : '—'}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-hd-muted">Rep from this solve</span>
                <span>{submitResult.repAwarded != null ? `+${submitResult.repAwarded}` : '—'}</span>
              </li>
            </ul>
          </div>
        ) : null}
      </HdModal>
    </div>
  )
}
