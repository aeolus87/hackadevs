import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AuthLabel,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/auth-page-shell'
import { InlineError } from '@/components/inline-error'
import { useSubmitPortalChallenge } from '@/hooks/portal/useSubmitPortalChallenge'

export default function PortalSubmitPage() {
  const navigate = useNavigate()
  const { mutate, loading, error } = useSubmitPortalChallenge()
  const [rawProblem, setRawProblem] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await mutate(rawProblem)
      navigate('/portal/dashboard', { replace: true })
    } catch {
      return
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-hd-page px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.12] via-transparent to-emerald-500/[0.06]" />
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-6">
          <Link
            to="/portal/dashboard"
            className="text-[13px] text-hd-secondary transition-colors hover:text-hd-indigo-tint"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-3 text-xl font-medium text-hd-text">Submit a challenge</h1>
          <p className="mt-1 text-sm text-hd-secondary">
            Paste the full problem statement. Staff will review and may publish it as a challenge.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="rounded-xl border border-hd-border bg-hd-card p-5 shadow-hd-card sm:p-6"
        >
          <div>
            <AuthLabel htmlFor="raw-problem">Problem statement</AuthLabel>
            <textarea
              id="raw-problem"
              required
              rows={14}
              value={rawProblem}
              onChange={(e) => setRawProblem(e.target.value)}
              className={`mt-1 min-h-[200px] resize-y ${authInputClassName}`}
            />
          </div>
          {error ? (
            <div className="mt-3">
              <InlineError message={error} />
            </div>
          ) : null}
          <button type="submit" disabled={loading} className={`mt-4 ${authPrimaryButtonClassName}`}>
            {loading ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  )
}
