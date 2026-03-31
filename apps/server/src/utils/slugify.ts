import { customAlphabet } from 'nanoid'

const NON_SLUG = /[^a-z0-9]+/g
const suffix = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6)

export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(NON_SLUG, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'challenge'
}

export function slugify(title: string): string {
  const base = slugifyTitle(title)
  return `${base}-${suffix()}`
}

export function uniqueChallengeSlug(title: string, suffixPart?: string): string {
  const base = slugifyTitle(title)
  if (!suffixPart) return base
  return `${base}-${suffixPart}`
}
