import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { safeReturnTo } from '@/utils/login-path'

export const authInputClassName =
  'w-full rounded-md border border-hd-border bg-hd-surface px-2.5 py-2 text-[13px] leading-snug text-hd-text placeholder:text-hd-muted transition-[border-color,box-shadow] duration-150 focus:border-hd-indigo/45 focus:outline-none focus:ring-1 focus:ring-hd-indigo/25'

export const authPrimaryButtonClassName =
  'w-full rounded-full bg-hd-indigo py-2.5 text-sm font-medium text-white shadow-[0_0_16px_rgba(99,102,241,0.14)] transition-[background-color,opacity,box-shadow] duration-150 hover:bg-hd-indigo-hover hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none'

export function AuthLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-mono text-[10px] uppercase tracking-wide text-hd-muted"
    >
      {children}
    </label>
  )
}

type AuthPageShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  footer: ReactNode
}

export function AuthPageShell({ title, subtitle, children, footer }: AuthPageShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-hd-page">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.12] via-transparent to-emerald-500/[0.06]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_75%_at_50%_-35%,rgba(99,102,241,0.28),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_100%_15%,rgba(129,140,248,0.14),transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_0%_95%,rgba(16,185,129,0.1),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_85%_85%,rgba(245,158,11,0.07),transparent_45%)]" />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-6 sm:py-8">
        <div className="mb-4 flex w-full max-w-[20rem] justify-start sm:mb-5">
          <Link
            to="/feed"
            className="inline-flex items-center gap-1.5 text-[13px] text-hd-secondary transition-colors duration-150 hover:text-hd-indigo-tint"
          >
            <span aria-hidden className="text-hd-muted">
              ←
            </span>
            Home
          </Link>
        </div>
        <div className="w-full max-w-[20rem] rounded-xl border border-hd-border border-l-4 border-l-hd-indigo bg-hd-card p-5 shadow-hd-card sm:p-6">
          <h1 className="text-lg font-medium tracking-tight text-hd-text">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 text-[13px] leading-snug text-hd-secondary">{subtitle}</p>
          ) : null}
          <div className="mt-5">{children}</div>
          <div className="mt-5 border-t border-hd-border pt-4 text-center text-[13px] text-hd-secondary">
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-hd-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-hd-card px-2 font-mono text-[9px] uppercase tracking-wider text-hd-muted">
          {label}
        </span>
      </div>
    </div>
  )
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

type AuthGitHubButtonProps = {
  href: string
  returnToPersist?: string | null
}

export function AuthGitHubButton({ href, returnToPersist }: AuthGitHubButtonProps) {
  return (
    <a
      href={href}
      onClick={() => {
        try {
          const dest = safeReturnTo(returnToPersist ?? null) ?? '/feed'
          localStorage.setItem('hackadevs.returnTo', dest)
        } catch {
          return
        }
      }}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-hd-border bg-hd-elevated py-2.5 text-[13px] font-medium text-hd-text shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition-[border-color,background-color] duration-150 hover:border-hd-border-hover hover:bg-hd-hover"
    >
      <GitHubMark className="h-4 w-4 shrink-0 text-hd-text" />
      Continue with GitHub
    </a>
  )
}
