export const DICEBEAR_STYLES = ['avataaars', 'notionists', 'bottts', 'fun-emoji', 'lorelei'] as const

export type DicebearStyle = (typeof DICEBEAR_STYLES)[number]

export function dicebearAvatarUrl(style: string, seed: string): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}
