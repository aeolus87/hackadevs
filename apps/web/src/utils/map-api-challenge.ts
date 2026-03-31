import type {
  Challenge as ApiChallenge,
  Difficulty as ApiDifficulty,
} from '@/types/hackadevs-api.types'
import type { Challenge as UiChallenge, Difficulty } from '@/types/hackadevs'
import { apiCategoryToUi } from '@/utils/map-api-category'

const DIFF_TO_UI: Record<ApiDifficulty, Difficulty> = {
  BEGINNER: 'Beginner',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  LEGENDARY: 'Legendary',
}

const HACKADEVS_AVATAR =
  'https://api.dicebear.com/7.x/shapes/svg?seed=hackadevs&backgroundColor=6366f1'

function closesInLabel(closesAt: string): string {
  const end = new Date(closesAt).getTime()
  const t = end - Date.now()
  if (t <= 0) return 'closed'
  const h = Math.floor(t / 3600000)
  if (h < 48) return h <= 0 ? 'soon' : `${h} hours`
  const d = Math.ceil(t / 86400000)
  return `${d} days`
}

export function apiChallengeToUi(c: ApiChallenge): UiChallenge {
  const sponsor = c.companySource?.trim()
  return {
    slug: c.slug,
    title: c.title,
    description: c.problemStatement,
    difficulty: DIFF_TO_UI[c.difficulty] ?? 'Medium',
    category: apiCategoryToUi(c.category),
    tags: c.tags,
    closesIn: closesInLabel(c.closesAt),
    submissionCount: c.submissionCount,
    voteRate: 0,
    company: sponsor ? { name: sponsor } : undefined,
    postedBy: {
      name: sponsor ?? 'HackaDevs',
      avatar: HACKADEVS_AVATAR,
    },
    constraints: c.constraints,
    bonusObjectives: c.bonusObjective ? [c.bonusObjective] : undefined,
    discussCount: 0,
  }
}
