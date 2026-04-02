import { useEffect, useState } from 'react'
import type { AdminPatchChallengeBody } from '@hackadevs/core'
import { HdSelect } from '@/components/ui/hd-select'
import type { Category, ChallengeStatus } from '@/types/hackadevs-api.types'
import { useToast } from '@/contexts/toast-context'
import { useAdminChallenge } from '@/hooks/admin/useAdminChallenge'
import { useArchiveChallenge } from '@/hooks/admin/useArchiveChallenge'
import { useCloseChallenge } from '@/hooks/admin/useCloseChallenge'
import { useUpdateChallenge } from '@/hooks/admin/useUpdateChallenge'
import { usePublishChallenge } from '@/hooks/admin/usePublishChallenge'
import { parseAxiosError } from '@/utils/axios-message'

const CATEGORIES: Category[] = [
  'BACKEND',
  'FRONTEND',
  'SYSTEM_DESIGN',
  'SECURITY',
  'DATA_ENGINEERING',
  'ML_OPS',
  'DEVOPS',
  'FULLSTACK',
]

const DIFFS = ['BEGINNER', 'MEDIUM', 'HARD', 'LEGENDARY'] as const

const CATEGORY_SELECT_OPTIONS = CATEGORIES.map((c) => ({
  value: c,
  label: c.replace(/_/g, ' '),
}))

const DIFF_SELECT_OPTIONS = DIFFS.map((d) => ({
  value: d,
  label: d.charAt(0) + d.slice(1).toLowerCase(),
}))

function padConstraints(c: string[]): string[] {
  const a = [...c]
  while (a.length < 3) a.push('')
  return a.slice(0, 3)
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

type AdminChallengeEditDrawerProps = {
  challengeId: string | null
  open: boolean
  onClose: () => void
  onSaved: () => void
  canWrite: boolean
}

export function AdminChallengeEditDrawer({
  challengeId,
  open,
  onClose,
  onSaved,
  canWrite,
}: AdminChallengeEditDrawerProps) {
  const { data: detail, loading, refetch } = useAdminChallenge(open ? challengeId : null)
  const { mutate: patch, loading: saving } = useUpdateChallenge(() => {
    onSaved()
    void refetch()
  })
  const toast = useToast()
  const { mutate: publish, loading: publishing } = usePublishChallenge(() => {
    onSaved()
    onClose()
  })
  const { mutate: closeChallenge, loading: closing } = useCloseChallenge(() => {
    toast.push('Challenge closed — preliminary rep awarded, voting window open.', 'success')
    onSaved()
    void refetch()
  })
  const { mutate: archiveChallenge, loading: archiving } = useArchiveChallenge(() => {
    toast.push('Challenge archived.', 'success')
    onSaved()
    void refetch()
  })

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('BACKEND')
  const [difficulty, setDifficulty] = useState<(typeof DIFFS)[number]>('MEDIUM')
  const [weekTheme, setWeekTheme] = useState('')
  const [opensAt, setOpensAt] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [problemStatement, setProblemStatement] = useState('')
  const [constraints, setConstraints] = useState(['', '', ''])
  const [bonusObjective, setBonusObjective] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [companySource, setCompanySource] = useState('')
  const [companyOptIn, setCompanyOptIn] = useState(true)
  const [testSuite, setTestSuite] = useState<
    { input: string; expectedOutput: string; isVisible: boolean }[]
  >([])

  useEffect(() => {
    if (!detail) return
    setTitle(detail.title)
    setCategory(detail.category as Category)
    setDifficulty(detail.difficulty as (typeof DIFFS)[number])
    setWeekTheme(detail.weekTheme)
    setOpensAt(toLocalInput(detail.opensAt))
    setClosesAt(toLocalInput(detail.closesAt))
    setProblemStatement(detail.problemStatement)
    setConstraints(padConstraints(detail.constraints ?? []))
    setBonusObjective(detail.bonusObjective ?? '')
    setTagsRaw((detail.tags ?? []).join(', '))
    setCompanySource(detail.companySource ?? '')
    setCompanyOptIn(detail.companyAttributionOptIn !== false)
    setTestSuite(
      Array.isArray(detail.testSuite) && detail.testSuite.length
        ? detail.testSuite.map((t) => ({
            input: t.input ?? '',
            expectedOutput: t.expectedOutput ?? '',
            isVisible: t.isVisible !== false,
          }))
        : [{ input: '', expectedOutput: '', isVisible: true }],
    )
  }, [detail])

  if (!open || !challengeId) return null

  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const buildBody = (status?: ChallengeStatus): AdminPatchChallengeBody => {
    const cons = constraints.map((c) => c.trim()).filter(Boolean)
    const body: AdminPatchChallengeBody = {
      title,
      category,
      difficulty,
      weekTheme,
      opensAt: new Date(opensAt).toISOString(),
      closesAt: new Date(closesAt).toISOString(),
      problemStatement,
      bonusObjective: bonusObjective.trim() || null,
      companySource: companySource.trim() || null,
      testSuite,
      companyAttributionOptIn: companyOptIn,
    }
    if (cons.length) body.constraints = cons
    if (tags.length) body.tags = tags
    if (status) body.status = status
    return body
  }

  const scheduleDisabled = new Date(opensAt).getTime() <= Date.now()

  return (
    <>
      <button
        type="button"
        aria-label="Close drawer"
        className="fixed inset-0 z-[150] bg-black/50"
        onClick={onClose}
      />
      <div className="fixed bottom-0 right-0 top-0 z-[160] flex w-full max-w-[480px] flex-col border-l border-hd-border bg-hd-elevated shadow-xl">
        <div className="flex items-center justify-between border-b border-hd-border px-4 py-3">
          <h2 className="text-sm font-medium text-hd-text">Edit challenge</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-hd-muted hover:text-hd-text"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!canWrite && (
            <p className="mb-4 rounded-lg border border-hd-amber/30 bg-hd-amber/10 px-3 py-2 text-sm text-hd-amber">
              View only — publishing and edits require an administrator.
            </p>
          )}
          {loading && !detail && <p className="text-sm text-hd-muted">Loading…</p>}
          {detail && (
            <fieldset
              disabled={!canWrite || detail.status === 'ARCHIVED'}
              className="min-h-0 space-y-4 border-0 p-0"
            >
              <label className="block">
                <span className="text-xs text-hd-muted">Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 text-sm text-hd-text"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-hd-muted">Category</span>
                  <div className="mt-1">
                    <HdSelect
                      aria-label="Category"
                      value={category}
                      onChange={(v) => setCategory(v as Category)}
                      options={CATEGORY_SELECT_OPTIONS}
                      buttonClassName="bg-hd-card"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs text-hd-muted">Difficulty</span>
                  <div className="mt-1">
                    <HdSelect
                      aria-label="Difficulty"
                      value={difficulty}
                      onChange={(v) => setDifficulty(v as (typeof DIFFS)[number])}
                      options={DIFF_SELECT_OPTIONS}
                      buttonClassName="bg-hd-card"
                    />
                  </div>
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-hd-muted">Week theme</span>
                <input
                  value={weekTheme}
                  onChange={(e) => setWeekTheme(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 text-sm text-hd-text"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-hd-muted">Opens at</span>
                  <input
                    type="datetime-local"
                    value={opensAt}
                    onChange={(e) => setOpensAt(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-hd-border bg-hd-card px-2 py-2 font-mono text-xs text-hd-text"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-hd-muted">Closes at</span>
                  <input
                    type="datetime-local"
                    value={closesAt}
                    onChange={(e) => setClosesAt(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-hd-border bg-hd-card px-2 py-2 font-mono text-xs text-hd-text"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-hd-muted">Problem statement</span>
                <textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 font-mono text-sm text-hd-text"
                />
              </label>
              {[0, 1, 2].map((i) => (
                <label key={i} className="block">
                  <span className="text-xs text-hd-muted">Constraint {i + 1}</span>
                  <input
                    value={constraints[i] ?? ''}
                    onChange={(e) => {
                      const next = [...constraints]
                      next[i] = e.target.value
                      setConstraints(next)
                    }}
                    className="mt-1 w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 text-sm text-hd-text"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-xs text-hd-muted">Bonus objective</span>
                <input
                  value={bonusObjective}
                  onChange={(e) => setBonusObjective(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 text-sm text-hd-text"
                />
              </label>
              <label className="block">
                <span className="text-xs text-hd-muted">Tags (comma-separated)</span>
                <input
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 text-sm text-hd-text"
                />
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-hd-border bg-hd-surface px-2 py-0.5 font-mono text-[11px] text-hd-secondary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </label>
              <label className="block">
                <span className="text-xs text-hd-muted">Company source (optional)</span>
                <input
                  value={companySource}
                  onChange={(e) => setCompanySource(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 text-sm text-hd-text"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-hd-secondary">
                <input
                  type="checkbox"
                  checked={companyOptIn}
                  onChange={(e) => setCompanyOptIn(e.target.checked)}
                  className="rounded border-hd-border"
                />
                Company attribution opt-in
              </label>
              <div>
                <p className="text-xs text-hd-muted">Test suite</p>
                <div className="mt-2 space-y-2">
                  {testSuite.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 border-b border-hd-border pb-2"
                    >
                      <input
                        value={row.input}
                        onChange={(e) => {
                          const n = [...testSuite]
                          n[idx] = { ...n[idx], input: e.target.value }
                          setTestSuite(n)
                        }}
                        placeholder="Input"
                        className="rounded border border-hd-border bg-hd-card px-2 py-1 font-mono text-[11px] text-hd-text"
                      />
                      <input
                        value={row.expectedOutput}
                        onChange={(e) => {
                          const n = [...testSuite]
                          n[idx] = { ...n[idx], expectedOutput: e.target.value }
                          setTestSuite(n)
                        }}
                        placeholder="Expected output"
                        className="rounded border border-hd-border bg-hd-card px-2 py-1 font-mono text-[11px] text-hd-text"
                      />
                      <label className="flex items-center gap-1 text-[11px] text-hd-muted">
                        <input
                          type="checkbox"
                          checked={row.isVisible}
                          onChange={(e) => {
                            const n = [...testSuite]
                            n[idx] = { ...n[idx], isVisible: e.target.checked }
                            setTestSuite(n)
                          }}
                        />
                        Visible
                      </label>
                      <button
                        type="button"
                        title="Remove row"
                        onClick={() => setTestSuite(testSuite.filter((_, j) => j !== idx))}
                        className="text-hd-rose-light hover:text-hd-rose"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTestSuite([...testSuite, { input: '', expectedOutput: '', isVisible: true }])
                  }
                  className="mt-2 text-xs font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
                >
                  Add test case
                </button>
              </div>
            </fieldset>
          )}
        </div>
        {detail?.status === 'ARCHIVED' ? null : (
          <div className="flex flex-wrap gap-2 border-t border-hd-border p-4">
            <button
              type="button"
              disabled={!canWrite || saving || !detail}
              onClick={() => void patch(challengeId, buildBody()).then(() => refetch())}
              className="rounded-full border border-hd-border px-4 py-2 text-sm text-hd-secondary hover:bg-hd-hover disabled:opacity-40"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={!canWrite || saving || !detail || scheduleDisabled}
              onClick={() => void patch(challengeId, buildBody('SCHEDULED'))}
              className="rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover disabled:opacity-40"
            >
              Save & schedule
            </button>
            <button
              type="button"
              disabled={!canWrite || publishing || !detail}
              onClick={() => void publish(challengeId)}
              className="rounded-full bg-hd-emerald px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              Publish now
            </button>
            {detail?.status === 'ACTIVE' ? (
              <button
                type="button"
                disabled={!canWrite || closing || publishing || saving}
                onClick={() => {
                  if (
                    !window.confirm(
                      'Close this challenge now? New submissions stop, preliminary rep is credited, and the voting phase starts (same as automatic close at deadline).',
                    )
                  ) {
                    return
                  }
                  void closeChallenge(challengeId).catch((e) => {
                    toast.push(parseAxiosError(e).message || 'Could not close challenge', 'error')
                  })
                }}
                className="rounded-full border border-hd-amber/50 bg-hd-amber/15 px-4 py-2 text-sm font-medium text-hd-amber hover:bg-hd-amber/25 disabled:opacity-40"
              >
                {closing ? 'Closing…' : 'Close challenge now'}
              </button>
            ) : null}
            {detail?.status === 'CLOSED' ? (
              <button
                type="button"
                disabled={!canWrite || archiving || saving}
                onClick={() => void archiveChallenge(challengeId)}
                className="rounded-full border border-hd-border px-4 py-2 text-sm font-medium text-hd-text hover:bg-hd-hover disabled:opacity-40"
              >
                {archiving ? 'Archiving…' : 'Archive'}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </>
  )
}
