import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  AuthLabel,
  AuthPageShell,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/auth-page-shell'
import { useRegister } from '@/hooks/auth/useRegister'
import { InlineError } from '@/components/inline-error'
import { safeReturnTo, type AuthReturnState } from '@/utils/login-path'

export default function RegisterPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const returnTo =
    safeReturnTo(searchParams.get('returnTo')) ??
    safeReturnTo((location.state as AuthReturnState | null)?.returnTo)
  const { mutate, loading, error } = useRegister()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await mutate({ username, email, password, displayName, returnTo })
    } catch {
      return
    }
  }

  return (
    <AuthPageShell
      title="Create account"
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            state={returnTo ? { returnTo } : undefined}
            className="font-medium text-hd-indigo-tint transition-colors hover:text-hd-indigo-hover"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <div>
          <AuthLabel htmlFor="register-display">Display name</AuthLabel>
          <input
            id="register-display"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ada Lovelace"
            required
            autoComplete="name"
            className={`mt-1 ${authInputClassName}`}
          />
        </div>
        <div>
          <AuthLabel htmlFor="register-username">Username</AuthLabel>
          <input
            id="register-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ada_dev"
            required
            minLength={2}
            autoComplete="username"
            className={`mt-1 font-mono ${authInputClassName}`}
          />
        </div>
        <div>
          <AuthLabel htmlFor="register-email">Email</AuthLabel>
          <input
            id="register-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={`mt-1 ${authInputClassName}`}
          />
        </div>
        <div>
          <AuthLabel htmlFor="register-password">Password</AuthLabel>
          <input
            id="register-password"
            type="password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 10 characters"
            autoComplete="new-password"
            className={`mt-1 ${authInputClassName}`}
          />
          <p className="mt-1 font-mono text-[10px] text-hd-muted">Minimum 10 characters</p>
        </div>
        {error ? <InlineError message={error} /> : null}
        <button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthPageShell>
  )
}
