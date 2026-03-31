import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthUser } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { useUpdateProfile } from '@/hooks/users/useUpdateProfile'
import type { AvailabilityStatus, SelfLevel } from '@/types/hackadevs-api.types'
import { HdSelect, type HdSelectOption } from '@/components/ui/hd-select'
import {
  DICEBEAR_STYLES,
  dicebearAvatarUrl,
  type DicebearStyle,
} from '@/utils/avatar-dicebear'

const SELF_LEVEL_OPTIONS: HdSelectOption[] = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid' },
  { value: 'SENIOR', label: 'Senior' },
]

const AVAILABILITY_OPTIONS: HdSelectOption[] = [
  { value: 'UNSPECIFIED', label: 'Work status — not shown' },
  { value: 'OPEN_TO_WORK', label: 'Open to work' },
  { value: 'EMPLOYED', label: 'Employed' },
  { value: 'NOT_LOOKING', label: 'Not looking' },
  { value: 'FREELANCE_OPEN', label: 'Open to freelance / contract' },
]

const DICEBEAR_OPTIONS: HdSelectOption[] = DICEBEAR_STYLES.map((s) => ({
  value: s,
  label: s,
}))

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
  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus>('UNSPECIFIED')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [diceStyle, setDiceStyle] = useState<DicebearStyle>('notionists')

  useEffect(() => {
    if (!user) return
    setDisplayName(user.displayName ?? '')
    setTagline(user.tagline ?? '')
    setGithubUrl(user.githubUrl ?? '')
    setLinkedinUrl(user.linkedinUrl ?? '')
    setWebsiteUrl(user.websiteUrl ?? '')
    setTwitterUrl(user.twitterUrl ?? '')
    setSelfDeclaredLevel(user.selfDeclaredLevel ?? 'MID')
    setAvailabilityStatus(user.availabilityStatus ?? 'UNSPECIFIED')
    setAvatarUrl(user.avatarUrl ?? '')
  }, [user])

  const previewSrc = useMemo(() => {
    const t = avatarUrl.trim()
    if (t !== '') return t
    return dicebearAvatarUrl('avataaars', user?.username ?? 'user')
  }, [avatarUrl, user?.username])

  const pickRandomAvatar = () => {
    setAvatarUrl(dicebearAvatarUrl(diceStyle, crypto.randomUUID()))
  }

  const onAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      toast.push('Choose an image file', 'error')
      e.target.value = ''
      return
    }
    if (f.size > 120_000) {
      toast.push('Image too large (max 120KB)', 'error')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const s = String(reader.result)
      if (s.length > 180_000) {
        toast.push('Image too large after encoding', 'error')
        return
      }
      setAvatarUrl(s)
    }
    reader.readAsDataURL(f)
    e.target.value = ''
  }

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
        availabilityStatus,
        avatarUrl: avatarUrl.trim() === '' ? null : avatarUrl.trim(),
      })
      toast.push('Profile saved', 'success')
    } catch {
      toast.push('Save failed', 'error')
    }
  }

  if (!user) {
    return (
      <p className="text-sm text-hd-secondary">
        <Link to="/login" state={{ returnTo: '/settings' }} className="text-hd-indigo-tint">
          Sign in
        </Link>{' '}
        to edit settings.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-medium text-hd-text">Settings</h1>
      <form onSubmit={save} className="space-y-5">
        <div className="rounded-xl border border-hd-border bg-hd-card p-4">
          <p className="text-sm font-medium text-hd-text">Profile photo</p>
          <p className="mt-1 text-xs text-hd-secondary">
            Image URL, a generated avatar, or a small image file from your device.
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
            <img
              src={previewSrc}
              alt=""
              className="h-20 w-20 shrink-0 rounded-full bg-hd-surface object-cover ring-1 ring-hd-border"
              width={80}
              height={80}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text"
                placeholder="https://… or paste image URL"
                spellCheck={false}
              />
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[10rem] max-w-[14rem]">
                  <HdSelect
                    aria-label="Random avatar style"
                    size="sm"
                    value={diceStyle}
                    onChange={(v) => setDiceStyle(v as DicebearStyle)}
                    options={DICEBEAR_OPTIONS}
                  />
                </div>
                <button
                  type="button"
                  onClick={pickRandomAvatar}
                  className="rounded-full border border-hd-border bg-hd-surface px-3 py-1.5 text-xs font-medium text-hd-text hover:bg-hd-hover"
                >
                  Random avatar
                </button>
                <label className="cursor-pointer rounded-full border border-hd-border bg-hd-surface px-3 py-1.5 text-xs font-medium text-hd-text hover:bg-hd-hover">
                  Upload
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={onAvatarFile} />
                </label>
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-hd-muted hover:text-hd-secondary"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

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
        <HdSelect
          aria-label="Level"
          value={selfDeclaredLevel}
          onChange={(v) => setSelfDeclaredLevel(v as SelfLevel)}
          options={SELF_LEVEL_OPTIONS}
        />
        <HdSelect
          aria-label="Work status"
          value={availabilityStatus}
          onChange={(v) => setAvailabilityStatus(v as AvailabilityStatus)}
          options={AVAILABILITY_OPTIONS}
        />
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
