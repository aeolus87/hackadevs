import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '@/hooks/auth/useRegister'
import { InlineError } from '@/components/inline-error'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { mutate, loading, error } = useRegister()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await mutate({ username, email, password, displayName })
      navigate('/feed', { replace: true })
    } catch {
      /* surfaced via error state */
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hd-page px-4">
      <div className="w-full max-w-sm rounded-[16px] border border-hd-border bg-hd-card p-6">
        <h1 className="text-lg font-medium text-hd-text">Join HackaDevs</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            required
            className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
          />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            minLength={2}
            className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 font-mono text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 10 characters)"
            className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
          />
          {error && <InlineError message={error} />}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-hd-indigo py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-hd-indigo-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-hd-muted">
          <Link to="/login" className="text-hd-indigo-tint hover:text-hd-indigo-hover">
            Already have an account?
          </Link>
        </p>
      </div>
    </div>
  )
}
