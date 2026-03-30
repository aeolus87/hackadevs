import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '@/hooks/auth/useLogin'
import { InlineError } from '@/components/inline-error'

export default function LoginPage() {
  const navigate = useNavigate()
  const { mutate, loading, error } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await mutate({ email, password })
      navigate('/feed', { replace: true })
    } catch {
      /* surfaced via error state */
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hd-page px-4">
      <div className="w-full max-w-sm rounded-[16px] border border-hd-border bg-hd-card p-6">
        <h1 className="text-lg font-medium text-hd-text">Sign in to HackaDevs</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
          />
          {error && <InlineError message={error} />}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-hd-indigo py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-hd-indigo-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-hd-muted">
          <Link to="/register" className="text-hd-indigo-tint hover:text-hd-indigo-hover">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
