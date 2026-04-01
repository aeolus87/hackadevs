import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  AuthLabel,
  AuthPageShell,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/auth-page-shell'
import { InlineError } from '@/components/inline-error'
import { useRegisterPortal } from '@/hooks/portal/useRegisterPortal'
import { readPortalSession, writePortalSession } from '@/lib/portal-storage'

export default function PortalRegisterPage() {
  const existing = readPortalSession()
  const { mutate, loading, error } = useRegisterPortal()
  const [companyName, setCompanyName] = useState('')
  const [domainEmail, setDomainEmail] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [revealed, setRevealed] = useState<{ portalId: string; portalSecret: string } | null>(null)

  if (existing?.portalId && existing?.portalSecret && !revealed) {
    return <Navigate to="/portal/dashboard" replace />
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const r = await mutate({
        companyName,
        domainEmail,
        contactName,
        contactEmail,
        linkedinUrl: linkedinUrl.trim() || undefined,
      })
      setRevealed({ portalId: r.portalId, portalSecret: r.portalSecret })
    } catch {
      return
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }
  }

  const continueToDashboard = () => {
    if (!revealed) return
    writePortalSession({ portalId: revealed.portalId, portalSecret: revealed.portalSecret })
    window.location.assign('/portal/dashboard')
  }

  if (revealed) {
    return (
      <AuthPageShell
        title="Save your portal credentials"
        subtitle="The secret is shown only once. Store it in a password manager before continuing."
        footer={
          <>
            <button
              type="button"
              onClick={continueToDashboard}
              className={authPrimaryButtonClassName}
            >
              I have saved my credentials — continue
            </button>
            <p className="mt-3 text-[12px] text-hd-muted">
              Continuing stores the portal ID and secret in this browser so you can use the company
              portal. Use “Sign out” on the dashboard to clear them.
            </p>
          </>
        }
      >
        <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[12px] text-hd-secondary">
          Anyone with your portal secret can act as your company on this portal. Treat it like a
          password.
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <AuthLabel htmlFor="portal-id">Portal ID</AuthLabel>
            <div className="mt-1 flex gap-2">
              <input
                id="portal-id"
                readOnly
                value={revealed.portalId}
                className={`${authInputClassName} font-mono text-[12px]`}
              />
              <button
                type="button"
                onClick={() => void copy(revealed.portalId)}
                className="shrink-0 rounded-full border border-hd-border px-3 text-[12px] font-medium text-hd-text hover:bg-hd-hover"
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <AuthLabel htmlFor="portal-secret">Portal secret</AuthLabel>
            <div className="mt-1 flex gap-2">
              <input
                id="portal-secret"
                readOnly
                value={revealed.portalSecret}
                className={`${authInputClassName} font-mono text-[11px]`}
              />
              <button
                type="button"
                onClick={() => void copy(revealed.portalSecret)}
                className="shrink-0 rounded-full border border-hd-border px-3 text-[12px] font-medium text-hd-text hover:bg-hd-hover"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell
      title="Company portal"
      subtitle="Register your organization to propose challenges and bookmark solvers."
      footer={
        <>
          Developer?{' '}
          <Link
            to="/feed"
            className="font-medium text-hd-indigo-tint transition-colors hover:text-hd-indigo-hover"
          >
            Back to HackaDevs
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <div>
          <AuthLabel htmlFor="co-name">Company name</AuthLabel>
          <input
            id="co-name"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoComplete="organization"
            className={`mt-1 ${authInputClassName}`}
          />
        </div>
        <div>
          <AuthLabel htmlFor="domain-email">Company / domain email</AuthLabel>
          <input
            id="domain-email"
            type="email"
            required
            value={domainEmail}
            onChange={(e) => setDomainEmail(e.target.value)}
            autoComplete="email"
            className={`mt-1 ${authInputClassName}`}
          />
        </div>
        <div>
          <AuthLabel htmlFor="contact-name">Contact name</AuthLabel>
          <input
            id="contact-name"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            autoComplete="name"
            className={`mt-1 ${authInputClassName}`}
          />
        </div>
        <div>
          <AuthLabel htmlFor="contact-email">Contact email</AuthLabel>
          <input
            id="contact-email"
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            autoComplete="email"
            className={`mt-1 ${authInputClassName}`}
          />
        </div>
        <div>
          <AuthLabel htmlFor="website">Website (optional)</AuthLabel>
          <input
            id="website"
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://"
            className={`mt-1 ${authInputClassName}`}
          />
        </div>
        {error ? <InlineError message={error} /> : null}
        <button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
          {loading ? 'Registering…' : 'Register'}
        </button>
      </form>
    </AuthPageShell>
  )
}
