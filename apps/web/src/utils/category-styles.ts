import type { ChallengeCategory } from '@/types/hackadevs'

export function categoryPillClass(cat: ChallengeCategory): string {
  switch (cat) {
    case 'Backend':
      return 'bg-hd-indigo-surface text-hd-indigo-tint border-hd-indigo/40'
    case 'Frontend':
      return 'bg-hd-amber/10 text-hd-amber-light border-hd-amber/35'
    case 'System Design':
      return 'bg-hd-emerald/10 text-hd-emerald-light border-hd-emerald/35'
    case 'Security':
      return 'bg-hd-rose/10 text-hd-rose-light border-hd-rose/35'
    case 'Data Engineering':
      return 'bg-hd-indigo-surface text-hd-secondary border-hd-border-hover'
    case 'ML Ops':
      return 'bg-hd-muted/20 text-hd-secondary border-hd-border-hover'
    case 'DevOps':
      return 'bg-hd-indigo-surface text-hd-indigo-hover border-hd-indigo/30'
    default:
      return 'bg-hd-card text-hd-secondary border-hd-border'
  }
}

export function avatarRingClass(cat: ChallengeCategory): string {
  switch (cat) {
    case 'Backend':
      return 'ring-hd-indigo'
    case 'Frontend':
      return 'ring-hd-amber'
    case 'System Design':
    case 'Security':
    case 'Data Engineering':
    case 'ML Ops':
    case 'DevOps':
      return 'ring-hd-emerald'
    default:
      return 'ring-hd-border-hover'
  }
}
