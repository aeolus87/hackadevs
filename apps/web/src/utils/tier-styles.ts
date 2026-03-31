import type { PlatformTier, SelfDeclaredLevel } from '@/types/hackadevs'

export function selfDeclaredLevelPillClass(level: SelfDeclaredLevel): string {
  switch (level) {
    case 'SENIOR':
      return 'border-hd-indigo/40 bg-hd-indigo-surface text-hd-indigo-tint'
    case 'MID':
      return 'border-[rgba(96,165,250,0.4)] bg-[rgba(96,165,250,0.1)] text-[#BFDBFE]'
    case 'JUNIOR':
      return 'border-hd-border bg-hd-card text-hd-secondary'
  }
}

export function platformTierPillClass(tier: PlatformTier): string {
  switch (tier) {
    case 'NOVICE':
    case 'APPRENTICE':
      return 'border-hd-border bg-hd-elevated text-hd-secondary'
    case 'ENGINEER':
      return 'border-[rgba(96,165,250,0.4)] bg-[rgba(96,165,250,0.1)] text-[#BFDBFE]'
    case 'SENIOR':
    case 'STAFF':
      return 'border-hd-indigo/40 bg-hd-indigo-surface text-hd-indigo-tint'
    case 'PRINCIPAL':
      return 'border-[rgba(167,139,250,0.4)] bg-[rgba(167,139,250,0.1)] text-[#DDD6FE]'
    case 'LEGEND':
      return 'border-hd-amber/40 bg-hd-amber/10 text-hd-amber-light'
    default:
      return 'border-hd-border bg-hd-surface text-hd-secondary'
  }
}
