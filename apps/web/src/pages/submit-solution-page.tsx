import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RationaleInput, type RationaleParts } from '@/components/rationale-input'
import { SolutionEditor, type TestCaseResult } from '@/components/solution-editor'
import { TagPill } from '@/components/tag-pill'
import { useAuthUser } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { useChallenge } from '@/hooks/challenges/useChallenge'
import { useMySubmission } from '@/hooks/submissions/useMySubmission'
import { useRunTests } from '@/hooks/submissions/useRunTests'
import { useSaveDraft } from '@/hooks/submissions/useSaveDraft'
import { useSubmitSolution } from '@/hooks/submissions/useSubmitSolution'
import { getChallengeBySlug } from '@/data/mock'
import { apiChallengeToUi } from '@/utils/map-api-challenge'

const suggestTags = [
  'clean-architecture',
  'O(1)-space',
  'redis-pattern',
  'observability',
  'rollout-safe',
]

const MOCK_TEST_RESULTS: TestCaseResult[] = [
  { id: 't1', name: 'Rejects duplicate idempotency key replay', passed: true },
  { id: 't2', name: 'Commits side effect only after durable record', passed: true },
  { id: 't3', name: 'Survives 24h retry window (simulated)', passed: true },
]

function rationaleLength(p: RationaleParts): number {
  return `${p.approach}\n${p.tradeoffs}\n${p.scale}`.trim().length
}

export default function SubmitSolutionPage() {
  useAuthUser()
  const { slug = '' } = useParams()
  const { data: apiCh } = useChallenge(slug)
  const mockCh = getChallengeBySlug(slug)
  const challenge = apiCh ? apiChallengeToUi(apiCh) : mockCh
  const challengeId = apiCh?.id ?? ''
  const { data: mine } = useMySubmission(challengeId)
  const { mutate: saveDraft } = useSaveDraft()
  const { mutate: runTestsApi } = useRunTests()
  const { mutate: submitApi } = useSubmitSolution()
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

  useEffect(() => {
    if (!mine || mine.status !== 'DRAFT') return
    setSubmissionId(mine.id)
    setCode((prev) => mine.code ?? prev)
    setRationaleParts({
      approach: mine.rationaleApproach ?? '',
      tradeoffs: mine.rationaleTradeoffs ?? '',
      scale: mine.rationaleScale ?? '',
    })
    setTags(mine.selfTags ?? [])
    setDifficultyDots(mine.selfDifficultyRating ?? 3)
  }, [mine])

  useEffect(() => {
    if (!challengeId) return
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
        } catch {
          /* network */
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
  ])

  if (!challenge) {
    return (
      <div className="mx-auto max-w-lg text-sm text-hd-secondary">
        Challenge not found.{' '}
        <Link to="/feed" className="font-medium text-hd-indigo-tint hover:text-hd-indigo-hover">
          Feed
        </Link>
      </div>
    )
  }

  const rationaleOk = rationaleLength(rationaleParts) >= 100
  const testsOk = testScorePercent != null && testScorePercent >= 50
  const canSubmit = testsOk && rationaleOk
  const codeEmpty = !code.trim()
  const submitTip = 'Run tests first and write your rationale.'

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const submit = async () => {
    if (!canSubmit) return
    if (!window.confirm('Submit your solution? You cannot edit after submit.')) return
    if (submissionId) {
      try {
        await submitApi(submissionId, challenge.slug)
      } catch {
        /* toast inside hook */
      }
      return
    }
    toast.push('Save a draft first (wait for auto-save)', 'error')
  }

  const runTests = async () => {
    if (codeEmpty) return
    if (submissionId) {
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
      } catch {
        toast.push('Run failed', 'error')
      }
      return
    }
    setTestResults(MOCK_TEST_RESULTS)
    setExecutionTimeMs(842)
    const ok = MOCK_TEST_RESULTS.every((r) => r.passed)
    setTestScorePercent(ok ? 100 : 40)
    toast.push(
      ok ? 'Tests passed (local mock — save draft for API run)' : 'Some tests failed',
      ok ? 'success' : 'error',
    )
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
          <SolutionEditor
            value={code}
            onChange={setCode}
            runDisabled={codeEmpty}
            testResults={testResults}
            executionTimeMs={executionTimeMs}
            onRunTests={() => void runTests()}
          />
        </div>
        <div className="flex min-h-0 flex-col gap-6 lg:min-h-[min(640px,calc(100dvh-10rem))]">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto">
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
            disabled={!canSubmit}
            title={!canSubmit ? submitTip : undefined}
            onClick={() => void submit()}
            className="h-11 w-full shrink-0 rounded-full bg-hd-indigo text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-hd-indigo-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit solution
          </button>
        </div>
      </div>
    </div>
  )
}
