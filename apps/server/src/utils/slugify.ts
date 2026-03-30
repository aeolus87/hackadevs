const NON_SLUG = /[^a-z0-9]+/g

export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(NON_SLUG, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'challenge'
}

export function uniqueChallengeSlug(title: string, suffix?: string): string {
  const base = slugifyTitle(title)
  if (!suffix) return base
  return `${base}-${suffix}`
}
