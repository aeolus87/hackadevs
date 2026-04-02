import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { useSaveDraft, type SaveDraftPayload } from '@/hooks/submissions/useSaveDraft'
import { useCompleteFollowUp } from '@/hooks/submissions/useCompleteFollowUp'
import { useSubmitSolution } from '@/hooks/submissions/useSubmitSolution'
import { useVerifySubmission } from '@/hooks/submissions/useVerifySubmission'
import { useWithdrawForRevision } from '@/hooks/submissions/useWithdrawForRevision'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import { apiChallengeToUi } from '@/utils/map-api-challenge'
import { SUBMISSIONS } from '@/utils/api.routes'
import { axiosInstance } from '@/utils/axios.instance'
import { parseAxiosError } from '@/utils/axios-message'
import type { Submission } from '@/types/hackadevs-api.types'
import { normalizeSubmissionLanguage, type SubmitFlowLanguage } from '@/utils/editor-language'
import { SubmitChallengeSpecPanel } from '@/components/challenge/submit-challenge-spec-panel'

const suggestTags = [
  'clean-architecture',
  'O(1)-space',
  'redis-pattern',
  'observability',
  'rollout-safe',
]

const REP_CREDIT_HINT =
  'Rep is credited when this challenge closes; vote bonuses apply after voting ends.'

function rationaleLength(p: RationaleParts): number {
  return `${p.approach}\n${p.tradeoffs}\n${p.scale}`.trim().length
}

function publishedSummaryToast(sub: Submission): string {
  const bits: string[] = []
  if (sub.testScore != null) bits.push(`Tests ${Math.round(sub.testScore)}%`)
  if (sub.rationaleScore != null) bits.push(`Rationale ${sub.rationaleScore}/100`)
  const head = bits.length ? `Published · ${bits.join(' · ')}` : 'Published'
  return `${head} — ${REP_CREDIT_HINT}`
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
  const { mutate: saveDraft, loading: saveDraftLoading } = useSaveDraft()
  const { mutate: runTestsApi } = useRunTests()
  const { mutate: submitApi } = useSubmitSolution()
  const { mutate: completeFollowUp, loading: followUpBusy } = useCompleteFollowUp()
  const { withdraw: withdrawForRevision, loading: withdrawBusy } = useWithdrawForRevision()
  const { mutate: verifyAnswers, loading: verifyBusy } = useVerifySubmission()
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
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null)
  const [resumeFlagBusy, setResumeFlagBusy] = useState(false)
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [postVerifyQuestions, setPostVerifyQuestions] = useState<string[] | null>(null)
  const [verifyA0, setVerifyA0] = useState('')
  const [verifyA1, setVerifyA1] = useState('')
  const [verifyRetryHint, setVerifyRetryHint] = useState<string | null>(null)
  const [solutionLanguage, setSolutionLanguage] = useState<SubmitFlowLanguage>('TS')
  const [runFlowBusy, setRunFlowBusy] = useState(false)
  const [submitBusy, setSubmitBusy] = useState(false)

  const verificationActive = (pendingVerification?.length ?? 0) > 0
  const postVerifyOpen = postVerifyQuestions != null && postVerifyQuestions.length === 2

  const markDraftSaved = useCallback(() => {
    setLastDraftSavedAt(Date.now())
  }, [])

  useEffect(() => {
    if (!mine) return
    if (mine.status === 'DRAFT' || mine.status === 'WITHDRAWN') {
      setSubmissionId(mine.id)
      setCode((prev) => mine.code ?? prev)
      setSolutionLanguage(normalizeSubmissionLanguage(mine.language))
      setRationaleParts({
        approach: mine.rationaleApproach ?? '',
        tradeoffs: mine.rationaleTradeoffs ?? '',
        scale: mine.rationaleScale ?? '',
      })
      setTags(mine.selfTags ?? [])
      setDifficultyDots(mine.selfDifficultyRating ?? 3)
      setPendingVerification(null)
      setPostVerifyQuestions(null)
    }
    if (mine.status === 'AWAITING_FOLLOWUP') {
      setSubmissionId(mine.id)
      setCode((prev) => mine.code ?? prev)
      setSolutionLanguage(normalizeSubmissionLanguage(mine.language))
      const q = mine.followUpQuestions
      if (Array.isArray(q) && q.length > 0) {
        setPendingVerification(q as { id: string; prompt: string }[])
      }
      setPostVerifyQuestions(null)
    }
    if (mine.status === 'SUBMITTED') {
      setSubmissionId(mine.id)
      setCode((prev) => mine.code ?? prev)
      setSolutionLanguage(normalizeSubmissionLanguage(mine.language))
      const raw = mine.verificationQuestions
      if (Array.isArray(raw) && raw.length >= 2) {
        const p0 = (raw[0] as { prompt?: string }).prompt
        const p1 = (raw[1] as { prompt?: string }).prompt
        if (p0 && p1) setPostVerifyQuestions([p0, p1])
      }
    }
  }, [mine])

  const buildDraftPayload = useCallback((): SaveDraftPayload => {
    return {
      challengeId,
      code,
      language: solutionLanguage,
      rationaleApproach: rationaleParts.approach,
      rationaleTradeoffs: rationaleParts.tradeoffs,
      rationaleScale: rationaleParts.scale,
      selfTags: tags,
      selfDifficultyRating: difficultyDots,
    }
  }, [
    challengeId,
    code,
    solutionLanguage,
    rationaleParts.approach,
    rationaleParts.tradeoffs,
    rationaleParts.scale,
    tags,
    difficultyDots,
  ])

  const flushDraft = useCallback(async () => {
    const sub = await saveDraft(buildDraftPayload())
    setSubmissionId(sub.id)
    markDraftSaved()
    return sub
  }, [saveDraft, buildDraftPayload, markDraftSaved])

  useEffect(() => {
    if (
      !isAuthenticated ||
      !challengeId ||
      mine?.status === 'AWAITING_FOLLOWUP' ||
      mine?.status === 'SUBMITTED'
    )
      return
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const sub = await saveDraft(buildDraftPayload())
          setSubmissionId(sub.id)
          markDraftSaved()
        } catch (e) {
          toast.push(parseAxiosError(e).message || 'Draft could not be saved', 'error')
        }
      })()
    }, 3000)
    return () => window.clearTimeout(t)
  }, [
    buildDraftPayload,
    challengeId,
    isAuthenticated,
    markDraftSaved,
    mine?.status,
    saveDraft,
    toast,
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
                      toast.push('Solution withdrawn. You can now revise and resubmit.', 'success')
                      void refetchMine()
                      void refetchMe()
                      void refetchCh()
                      navigate(`/challenge/${challenge.slug}/submit`, { replace: true })
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
          Answer two short prompts to publish — same flow for everyone.
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
  const canSubmit = !verificationActive && !postVerifyOpen && testsOk && rationaleOk
  const codeEmpty = !code.trim()
  const submitTip = 'Run tests first and write your rationale.'

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const executeSubmit = async () => {
    if (!canSubmit || submitBusy) return
    setSubmitBusy(true)
    try {
      let row: Submission
      try {
        row = await flushDraft()
      } catch (e) {
        toast.push(parseAxiosError(e).message || 'Could not save draft', 'error')
        return
      }
      setSubmitConfirmOpen(false)
      try {
        const r = await submitApi(row.id, challenge.slug)
        if (
          r &&
          typeof r === 'object' &&
          'status' in r &&
          (r as { status: string }).status === 'AWAITING_VERIFICATION'
        ) {
          const vr = r as { submissionId: string; questions: string[] }
          setSubmissionId(vr.submissionId)
          setPostVerifyQuestions(vr.questions)
          setVerifyA0('')
          setVerifyA1('')
          setVerifyRetryHint(null)
          void refetchMine()
          return
        }
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
            void refetchMe()
            void refetchMine()
            void refetchCh()
            toast.push(publishedSummaryToast(sub), 'success')
            navigate(`/challenge/${challenge.slug}/solutions/${sub.id}`)
          }
        }
      } catch {
        return
      }
    } finally {
      setSubmitBusy(false)
    }
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
      void refetchMe()
      void refetchMine()
      void refetchCh()
      toast.push(publishedSummaryToast(sub), 'success')
      navigate(`/challenge/${challenge.slug}/solutions/${sub.id}`)
    } catch (e) {
      toast.push(parseAxiosError(e).message || 'Could not publish', 'error')
    }
  }

  const submitPostVerify = async () => {
    if (!submissionId || !postVerifyQuestions) return
    const a0 = verifyA0.trim()
    const a1 = verifyA1.trim()
    if (a0.length < 50 || a1.length < 50 || a0.length > 500 || a1.length > 500) {
      toast.push('Each answer must be 50–500 characters.', 'error')
      return
    }
    try {
      const r = await verifyAnswers(submissionId, [a0, a1])
      setVerifyRetryHint(null)
      if (!r.verified && r.unavailable) {
        toast.push(
          r.message ?? 'Verification is temporarily unavailable. Please try again in a moment.',
          'error',
        )
        return
      }
      if (r.verified) {
        void refetchMe()
        void refetchMine()
        void refetchCh()
        toast.push('Solution published!', 'success')
        navigate(`/challenge/${challenge.slug}/solutions/${submissionId}`)
        return
      }
      if (r.canRetry) {
        setVerifyRetryHint('Your answers were not specific enough. Try again.')
        setVerifyA0('')
        setVerifyA1('')
        void refetchMine()
        return
      }
      toast.push(
        r.message ?? 'Submission not verified. Your draft is saved — you can revise and resubmit.',
        'error',
      )
      setPostVerifyQuestions(null)
      void refetchMine()
    } catch {
      return
    }
  }

  const runTests = async () => {
    if (codeEmpty || runFlowBusy) return
    setRunFlowBusy(true)
    try {
      const row = await flushDraft()
      const r = await runTestsApi(row.id)
      const total = r.results.length
      const passed = r.results.filter((x) => x.passed).length
      setTestScorePercent(total ? (passed / total) * 100 : 0)
      setTestResults(
        r.results.map((x, i) => ({
          id: `t${i}`,
          name: `Test ${i + 1}`,
          passed: x.passed,
          detail: x.stderr ?? undefined,
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
    } finally {
      setRunFlowBusy(false)
    }
  }

  return (
    <div className="relative mx-auto max-w-6xl">
      {postVerifyOpen && postVerifyQuestions ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-hd-page/95 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-title"
        >
          <div className="max-h-[min(90dvh,720px)] w-full max-w-lg overflow-y-auto rounded-[16px] border border-hd-border bg-hd-elevated p-6 shadow-xl">
            <h1 id="verify-title" className="text-lg font-medium text-hd-text">
              One last step — prove it&apos;s yours
            </h1>
            <p className="mt-2 text-sm text-hd-secondary">
              Answer 2 quick questions about your code. If you wrote it, you know it.
            </p>
            {verifyRetryHint ? (
              <p className="mt-3 rounded-lg border border-hd-amber/35 bg-hd-amber/10 px-3 py-2 text-sm text-hd-amber">
                {verifyRetryHint}
              </p>
            ) : null}
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[13px] text-hd-secondary" htmlFor="v-a0">
                  {postVerifyQuestions[0]}
                </label>
                <textarea
                  id="v-a0"
                  rows={4}
                  value={verifyA0}
                  onChange={(e) => setVerifyA0(e.target.value)}
                  className="mt-1.5 w-full rounded-[10px] border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text"
                />
              </div>
              <div>
                <label className="text-[13px] text-hd-secondary" htmlFor="v-a1">
                  {postVerifyQuestions[1]}
                </label>
                <textarea
                  id="v-a1"
                  rows={4}
                  value={verifyA1}
                  onChange={(e) => setVerifyA1(e.target.value)}
                  className="mt-1.5 w-full rounded-[10px] border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={
                verifyBusy ||
                verifyA0.trim().length < 50 ||
                verifyA1.trim().length < 50 ||
                verifyA0.trim().length > 500 ||
                verifyA1.trim().length > 500
              }
              onClick={() => void submitPostVerify()}
              className="mt-6 h-11 w-full rounded-full bg-hd-indigo text-sm font-medium text-white hover:bg-hd-indigo-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {verifyBusy ? 'Submitting…' : 'Submit answers'}
            </button>
          </div>
        </div>
      ) : null}
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
      {apiCh ? <SubmitChallengeSpecPanel challenge={apiCh} /> : null}
      <div className="grid min-h-[calc(100dvh-10rem)] gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="flex min-h-[50vh] flex-col lg:min-h-[min(640px,calc(100dvh-10rem))]">
          {!verificationActive && challengeId ? (
            <p className="mb-2 text-xs text-hd-secondary" data-testid="submit-draft-status">
              {saveDraftLoading ? (
                'Saving draft…'
              ) : lastDraftSavedAt != null ? (
                <>
                  Last saved{' '}
                  {new Date(lastDraftSavedAt).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  . Run tests when ready.
                </>
              ) : submissionId ? (
                'Draft on your account. Run tests when ready.'
              ) : (
                'Your draft saves automatically a few seconds after you edit. Run tests once it exists.'
              )}
            </p>
          ) : null}
          {verificationActive && pendingVerification && pendingVerification.length > 0 ? (
            <div className="mb-4 rounded-[12px] border border-hd-indigo/35 bg-hd-indigo-surface px-4 py-4">
              <p className="text-sm font-medium text-hd-text">Verification</p>
              <p className="mt-1 text-[13px] text-hd-secondary">Two short answers, then publish.</p>
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
              language={solutionLanguage}
              onLanguageChange={setSolutionLanguage}
              runDisabled={codeEmpty || verificationActive}
              runPending={runFlowBusy}
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
            disabled={!canSubmit || verificationActive || submitBusy}
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
            {submitBusy ? 'Submitting…' : 'Submit solution'}
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
              disabled={submitBusy}
              onClick={() => void executeSubmit()}
              className="rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitBusy ? 'Submitting…' : 'Submit'}
            </button>
          </>
        }
      >
        <p>
          You can't edit code or rationale after submit. You may get one or two verification
          questions first.
        </p>
        <p className="mt-3 text-hd-muted">{REP_CREDIT_HINT}</p>
      </HdModal>
    </div>
  )
}
