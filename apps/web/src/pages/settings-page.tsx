import { useEffect, useState } from 'react'
import { useAuthUser } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { useUpdateProfile } from '@/hooks/users/useUpdateProfile'
import type { SelfLevel } from '@/types/hackadevs-api.types'

export default function SettingsPage() {
  const { user } = useAuthUser()
  const { mutate, loading, error } = useUpdateProfile()
  const toast = useToast()
  const [displayName, setDisplayName] = useState('')
  const [tagline, setTagline] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [selfDeclaredLevel, setSelfDeclaredLevel] = useState<SelfLevel>('MID')

  useEffect(() => {
    if (!user) return
    setDisplayName(user.displayName ?? '')
    setTagline(user.tagline ?? '')
    setGithubUrl(user.githubUrl ?? '')
    setLinkedinUrl(user.linkedinUrl ?? '')
    setWebsiteUrl(user.websiteUrl ?? '')
    setTwitterUrl(user.twitterUrl ?? '')
    setSelfDeclaredLevel(user.selfDeclaredLevel ?? 'MID')
  }, [user])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await mutate({
        displayName,
        tagline,
        githubUrl,
        linkedinUrl,
        websiteUrl,
        twitterUrl,
        selfDeclaredLevel,
      })
      toast.push('Profile saved', 'success')
    } catch {
      toast.push('Save failed', 'error')
    }
  }

  if (!user) {
    return (
      <p className="text-sm text-hd-secondary">
        <a href="/login" className="text-hd-indigo-tint">
          Sign in
        </a>{' '}
        to edit settings.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-medium text-hd-text">Settings</h1>
      <form onSubmit={save} className="space-y-3">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text"
          placeholder="Display name"
        />
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value.slice(0, 120))}
          className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text"
          placeholder="Tagline"
        />
        <select
          value={selfDeclaredLevel}
          onChange={(e) => setSelfDeclaredLevel(e.target.value as SelfLevel)}
          className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text"
        >
          <option value="JUNIOR">Junior</option>
          <option value="MID">Mid</option>
          <option value="SENIOR">Senior</option>
        </select>
        <input
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text"
          placeholder="GitHub URL"
        />
        <input
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text"
          placeholder="LinkedIn URL"
        />
        <input
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text"
          placeholder="Website URL"
        />
        <input
          value={twitterUrl}
          onChange={(e) => setTwitterUrl(e.target.value)}
          className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text"
          placeholder="Twitter URL"
        />
        {error && <p className="text-sm text-hd-rose">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-hd-indigo px-6 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover disabled:opacity-40"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
