import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthUser } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { useLogout } from '@/hooks/auth/useLogout'
import { useUpdateProfile } from '@/hooks/users/useUpdateProfile'
import { useUploadAvatar } from '@/hooks/users/useUploadAvatar'
import type { AvailabilityStatus, SelfLevel } from '@/types/hackadevs-api.types'
import { HdSelect, type HdSelectOption } from '@/components/ui/hd-select'
import { DICEBEAR_STYLES, dicebearAvatarUrl, type DicebearStyle } from '@/utils/avatar-dicebear'

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

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

function initialsFrom(name: string): string {
  const p = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
  return p.toUpperCase() || '?'
}

export default function SettingsPage() {
  const { user } = useAuthUser()
  const { mutate, loading, error } = useUpdateProfile()
  const {
    upload: uploadAvatar,
    loading: avatarUploading,
    error: avatarUploadError,
  } = useUploadAvatar()
  const { mutate: signOut, loading: signingOut } = useLogout()
  const toast = useToast()
  const [displayName, setDisplayName] = useState('')
  const [tagline, setTagline] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [selfDeclaredLevel, setSelfDeclaredLevel] = useState<SelfLevel>('MID')
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('UNSPECIFIED')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [diceStyle, setDiceStyle] = useState<DicebearStyle>('notionists')
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null)

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

  useEffect(() => {
    return () => {
      if (localAvatarPreview) URL.revokeObjectURL(localAvatarPreview)
    }
  }, [localAvatarPreview])

  const displayAvatarUrl = useMemo(() => {
    const t = avatarUrl.trim()
    return t !== '' ? t : null
  }, [avatarUrl])

  const pickRandomAvatar = () => {
    setAvatarUrl(dicebearAvatarUrl(diceStyle, crypto.randomUUID()))
  }

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(f.type)) {
      toast.push('Use JPEG, PNG, WebP, or GIF', 'error')
      return
    }
    if (f.size > MAX_AVATAR_BYTES) {
      toast.push('Image too large (max 5MB)', 'error')
      return
    }
    const blobUrl = URL.createObjectURL(f)
    setLocalAvatarPreview(blobUrl)
    try {
      await uploadAvatar(f)
      toast.push('Avatar updated', 'success')
      setLocalAvatarPreview(null)
      URL.revokeObjectURL(blobUrl)
    } catch {
      setLocalAvatarPreview(null)
      URL.revokeObjectURL(blobUrl)
    }
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
      <div className="mx-auto max-w-lg">
        <p className="text-sm text-hd-secondary">
          <Link to="/login" state={{ returnTo: '/settings' }} className="text-hd-indigo-tint">
            Sign in
          </Link>{' '}
          to edit settings.
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-lg border border-hd-border bg-hd-surface px-3 py-2.5 text-sm text-hd-text'

  return (
    <div className="mx-auto w-full max-w-lg space-y-8 lg:max-w-5xl xl:max-w-6xl">
      <div>
        <h1 className="text-xl font-medium text-hd-text lg:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-hd-secondary lg:text-[15px]">
          Profile and links shown on your public developer page.
        </p>
      </div>
      <form onSubmit={save} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5">
            <div className="rounded-xl border border-hd-border bg-hd-card p-5 lg:p-6">
              <p className="text-sm font-medium text-hd-text">Profile photo</p>
              <p className="mt-1 text-xs text-hd-secondary lg:text-[13px]">
                Upload a photo (max 5MB), paste an image URL, or pick a generated avatar.
              </p>
              <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="relative h-24 w-24 shrink-0 lg:h-28 lg:w-28">
                  {localAvatarPreview || displayAvatarUrl ? (
                    <img
                      src={localAvatarPreview ?? displayAvatarUrl!}
                      alt=""
                      className="h-full w-full rounded-full bg-hd-surface object-cover ring-1 ring-hd-border"
                      width={112}
                      height={112}
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center rounded-full bg-hd-indigo-surface text-lg font-semibold text-hd-indigo-tint ring-1 ring-hd-border lg:text-xl"
                      aria-hidden
                    >
                      {initialsFrom(displayName || user?.username || '')}
                    </div>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-hd-text/40">
                      <svg
                        className="h-8 w-8 animate-spin text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-hd-border bg-hd-card text-hd-text shadow-sm hover:bg-hd-hover">
                    <span className="sr-only">Change avatar</span>
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => void onAvatarFile(e)}
                    />
                  </label>
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className={inputClass}
                    placeholder="https://… or paste image URL"
                    spellCheck={false}
                  />
                  {avatarUploadError ? (
                    <p className="text-sm text-hd-rose-light">{avatarUploadError}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-[11rem] flex-1 sm:max-w-[16rem] lg:max-w-none lg:flex-1">
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
            <div className="rounded-xl border border-hd-border bg-hd-card p-5 lg:p-6">
              <p className="text-sm font-medium text-hd-text">Profile</p>
              <div className="mt-4 space-y-4">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                  placeholder="Display name"
                />
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value.slice(0, 120))}
                  className={inputClass}
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
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div className="rounded-xl border border-hd-border bg-hd-card p-5 lg:p-6">
              <p className="text-sm font-medium text-hd-text">Links</p>
              <p className="mt-1 text-xs text-hd-secondary lg:text-[13px]">
                Optional URLs for your profile and applications.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className={inputClass}
                  placeholder="GitHub URL"
                />
                <input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className={inputClass}
                  placeholder="LinkedIn URL"
                />
                <input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className={inputClass}
                  placeholder="Website URL"
                />
                <input
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  className={inputClass}
                  placeholder="Twitter URL"
                />
              </div>
            </div>
            <div className="rounded-xl border border-hd-border bg-hd-card p-5 lg:p-6">
              <p className="text-sm font-medium text-hd-text">Account</p>
              <p className="mt-1 text-xs text-hd-secondary lg:text-[13px]">
                End your session on this device.
              </p>
              <button
                type="button"
                disabled={signingOut}
                onClick={() => void signOut()}
                className="mt-4 rounded-full border border-hd-border px-4 py-2 text-sm font-medium text-hd-secondary hover:bg-hd-hover hover:text-hd-text disabled:opacity-40"
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-hd-rose">{error}</p>}
        <div className="flex flex-col gap-3 border-t border-hd-border pt-6 sm:flex-row sm:items-center sm:justify-between lg:border-0 lg:pt-0">
          <p className="text-xs text-hd-muted lg:text-sm">
            Changes apply to your profile immediately after save.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-hd-indigo px-8 py-2.5 text-sm font-medium text-white hover:bg-hd-indigo-hover disabled:opacity-40 sm:shrink-0"
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
