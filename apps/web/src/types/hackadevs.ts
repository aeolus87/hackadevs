export type Difficulty = 'Beginner' | 'Medium' | 'Hard' | 'Legendary'

export type ChallengeCategory =
  | 'Backend'
  | 'Frontend'
  | 'System Design'
  | 'Security'
  | 'Data Engineering'
  | 'ML Ops'
  | 'DevOps'

export type Challenge = {
  slug: string
  title: string
  description: string
  difficulty: Difficulty
  category: ChallengeCategory
  tags: string[]
  closesIn: string
  submissionCount: number
  voteRate: number
  company?: { name: string; favicon?: string }
  postedBy: { name: string; avatar: string }
  statementHtml?: string
  constraints?: string[]
  bonusObjectives?: string[]
  discussCount?: number
}

export type SelfDeclaredLevel = 'JUNIOR' | 'MID' | 'SENIOR'

export type AvailabilityStatusUi =
  | 'UNSPECIFIED'
  | 'OPEN_TO_WORK'
  | 'EMPLOYED'
  | 'NOT_LOOKING'
  | 'FREELANCE_OPEN'

export type PlatformTier =
  | 'NOVICE'
  | 'APPRENTICE'
  | 'ENGINEER'
  | 'SENIOR'
  | 'STAFF'
  | 'PRINCIPAL'
  | 'LEGEND'

export type DevTier = 'Senior' | 'Mid' | 'Junior'

export type DevUser = {
  username: string
  displayName: string
  avatar: string
  tagline: string
  rep: number
  rankPercentile: string
  tier: DevTier
  selfDeclaredLevel?: SelfDeclaredLevel
  availabilityStatus?: AvailabilityStatusUi
  platformTier: PlatformTier
  staff?: boolean
  topCategory: ChallengeCategory
  streak: number
  weeklyDelta: number
  rankMovement: number
  challengesSolved: number
  githubUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  twitterUrl?: string
  skills: Partial<Record<ChallengeCategory, number>>
  categoryRanks?: Partial<Record<ChallengeCategory, number>>
}

export type LeaderboardRow = DevUser & {
  rank: number
}

export type SolutionRatingSlice = {
  label: string
  percent: number
  color: string
}

export type TopSolutionMini = {
  id: string
  solver: Pick<DevUser, 'username' | 'displayName' | 'avatar'>
  votes: number
}

export type PinnedSolution = {
  challengeSlug: string
  challengeTitle: string
  rank: number
  total: number
  rationaleExcerpt: string
  votes: number
  date: string
}

export type ActivityKind = 'solve' | 'follow' | 'badge' | 'default'

export type ActivityItem = {
  id: string
  text: string
  time: string
  kind?: ActivityKind
}
