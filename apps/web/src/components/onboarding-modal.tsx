import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useActiveChallenges } from '@/hooks/challenges/useActiveChallenges'
import { useUpdateProfile } from '@/hooks/users/useUpdateProfile'
import { mockChallenges } from '@/data/mock'
import { apiChallengeToUi } from '@/utils/map-api-challenge'

const STACK = ['Backend', 'Frontend', 'Systems', 'Data', 'Security', 'DevOps', 'ML'] as const

const STORAGE_KEY = 'hackadevs-onboarding-done'

export function OnboardingModal() {
  const { mutate: updateProfile } = useUpdateProfile()
  const { data: activeChallenges } = useActiveChallenges()
  const [done, setDone] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return true
    }
  })
  const [step, setStep] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [tagline, setTagline] = useState('')
  const [gh, setGh] = useState('')
  const [li, setLi] = useState('')
  const [site, setSite] = useState('')
  const [usernameOk, setUsernameOk] = useState(false)

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setDone(true)
  }

  if (done) return null

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const checkUser = () => {
    if (username.trim().length >= 3) setUsernameOk(true)
  }

  const tailored =
    activeChallenges && activeChallenges.length > 0
      ? activeChallenges.slice(0, 3).map((c) => apiChallengeToUi(c))
      : mockChallenges.slice(0, 3)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[16px] border border-hd-border bg-hd-elevated p-6 shadow-[var(--shadow-hd-card)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onb-title"
      >
        {step === 0 && (
          <>
            <h2 id="onb-title" className="text-lg font-medium text-hd-text">
              What&apos;s your stack?
            </h2>
            <p className="mt-1 text-sm text-hd-secondary">
              Multi-select. We use this to tune your feed.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {STACK.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out ${
                    tags.includes(t)
                      ? 'border-hd-indigo bg-hd-indigo text-white'
                      : 'border-hd-border bg-hd-card text-hd-secondary hover:border-hd-border-hover'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-6 text-sm text-hd-muted underline-offset-2 hover:text-hd-secondary hover:underline"
            >
              Skip for now
            </button>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-hd-indigo-hover"
              >
                Continue
              </button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 id="onb-title" className="text-lg font-medium text-hd-text">
              Set your public identity
            </h2>
            <div className="mt-4 space-y-3">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setUsernameOk(false)
                  }}
                  placeholder="@username"
                  className="flex-1 rounded-lg border border-hd-border bg-hd-card px-3 py-2 font-mono text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
                />
                <button
                  type="button"
                  onClick={checkUser}
                  className="rounded-lg border border-hd-border px-3 py-2 text-sm text-hd-secondary hover:border-hd-border-hover"
                >
                  Check
                </button>
                {usernameOk && <span className="self-center text-hd-emerald">✓</span>}
              </div>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value.slice(0, 80))}
                placeholder="Tagline (80 chars)"
                maxLength={80}
                className="w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
              />
              <input
                value={gh}
                onChange={(e) => setGh(e.target.value)}
                placeholder="GitHub URL"
                className="w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
              />
              <input
                value={li}
                onChange={(e) => setLi(e.target.value)}
                placeholder="LinkedIn URL"
                className="w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
              />
              <input
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="Portfolio URL"
                className="w-full rounded-lg border border-hd-border bg-hd-card px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none"
              />
            </div>
            <div className="mt-6 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-sm text-hd-muted hover:text-hd-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    try {
                      await updateProfile({
                        displayName: displayName || username,
                        tagline,
                        githubUrl: gh || undefined,
                        linkedinUrl: li || undefined,
                        websiteUrl: site || undefined,
                      })
                    } catch {
                      /* ignore */
                    }
                    setStep(2)
                  })()
                }}
                disabled={!username.trim()}
                className="rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-hd-indigo-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 id="onb-title" className="text-lg font-medium text-hd-text">
              Your first challenge
            </h2>
            <p className="mt-1 text-sm text-hd-secondary">
              Pick one to start. You can change later.
            </p>
            <div className="mt-4 space-y-3">
              {tailored.map((c) => (
                <div key={c.slug} className="rounded-[12px] border border-hd-border bg-hd-card p-3">
                  <p className="text-sm font-medium text-hd-text">{c.title}</p>
                  <Link
                    to={`/challenge/${c.slug}`}
                    onClick={finish}
                    className="mt-2 inline-flex rounded-full bg-hd-indigo px-3 py-1.5 text-xs font-medium text-white hover:bg-hd-indigo-hover"
                  >
                    Start with this one
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-hd-muted hover:text-hd-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={finish}
                className="text-sm text-hd-muted hover:text-hd-secondary"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
