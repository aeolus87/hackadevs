import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  AuthDivider,
  AuthGitHubButton,
  AuthLabel,
  AuthPageShell,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/auth-page-shell'
import { useLogin } from '@/hooks/auth/useLogin'
import { InlineError } from '@/components/inline-error'
import { AUTH, BASE_URL } from '@/utils/api.routes'
import { safeReturnTo, type AuthReturnState } from '@/utils/login-path'

const githubOAuthUrl = `${BASE_URL}${AUTH.GITHUB()}`

export default function LoginPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const stateReturn = safeReturnTo((location.state as AuthReturnState | null)?.returnTo)
  const queryReturn = safeReturnTo(searchParams.get('returnTo'))
  const returnTo = queryReturn ?? stateReturn
  const { mutate, loading, error } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await mutate({ email, password, returnTo })
    } catch {
      return
    }
  }

  return (
    <AuthPageShell
      title="Sign in"
      footer={
        <>
          New here?{' '}
          <Link
            to="/register"
            state={returnTo ? { returnTo } : undefined}
            className="font-medium text-hd-indigo-tint transition-colors hover:text-hd-indigo-hover"
          >
            Create an account
          </Link>
        </>
      }
    >
      <AuthGitHubButton href={githubOAuthUrl} />
      <AuthDivider label="or email" />
      <form onSubmit={submit} className="space-y-3">
        <div>
          <AuthLabel htmlFor="login-email">Email</AuthLabel>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`mt-1 ${authInputClassName}`}
          />
        </div>
        <div>
          <AuthLabel htmlFor="login-password">Password</AuthLabel>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`mt-1 ${authInputClassName}`}
          />
        </div>
        {error ? <InlineError message={error} /> : null}
        <button
          type="submit"
          disabled={loading}
          className={authPrimaryButtonClassName}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthPageShell>
  )
}
