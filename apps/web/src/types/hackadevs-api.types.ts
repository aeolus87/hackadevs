export type Category =
  | 'BACKEND'
  | 'FRONTEND'
  | 'SYSTEM_DESIGN'
  | 'SECURITY'
  | 'DATA_ENGINEERING'
  | 'ML_OPS'
  | 'DEVOPS'
  | 'FULLSTACK'

export type Difficulty = 'BEGINNER' | 'MEDIUM' | 'HARD' | 'LEGENDARY'

export type SubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'EVALUATED'
  | 'PUBLISHED'
  | 'FLAGGED'
  | 'WITHDRAWN'

export type Language = 'JS' | 'TS' | 'PYTHON' | 'GO' | 'RUST' | 'JAVA' | 'CPP' | 'CSHARP' | 'RUBY'

export type Tier =
  | 'NOVICE'
  | 'APPRENTICE'
  | 'ENGINEER'
  | 'SENIOR'
  | 'STAFF'
  | 'PRINCIPAL'
  | 'LEGEND'

export type SelfLevel = 'JUNIOR' | 'MID' | 'SENIOR'

export type VoteValue = 'UP' | 'DOWN'

export interface DevUser {
  id: string
  username: string
  displayName: string
  tagline?: string
  avatarUrl?: string
  githubUrl?: string
  linkedinUrl?: string
  websiteUrl?: string
  twitterUrl?: string
  totalRep: number
  globalRank?: number
  currentStreakDays: number
  tier: Tier
  selfDeclaredLevel: SelfLevel
  weeklyRepDelta: number
  categoryReps: { category: Category; rep: number; rank?: number }[]
  badges: { type: string; awardedAt: string }[]
}

export type SubmissionAuthor = Pick<DevUser, 'id' | 'username' | 'displayName' | 'avatarUrl'>

export interface Challenge {
  id: string
  slug: string
  title: string
  problemStatement: string
  constraints: string[]
  bonusObjective?: string
  exampleInput?: string
  exampleOutput?: string
  tags: string[]
  category: Category
  difficulty: Difficulty
  weekTheme: string
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  opensAt: string
  closesAt: string
  companySource?: string
  submissionCount: number
  visibleTestCases: { input: string; expectedOutput: string }[]
}

export interface Submission {
  id: string
  userId: string
  challengeId: string
  code: string
  language: Language
  rationaleApproach: string
  rationaleTradeoffs: string
  rationaleScale: string
  selfTags: string[]
  selfDifficultyRating: number
  status: SubmissionStatus
  testScore?: number
  rationaleScore?: number
  rationaleSummary?: string
  compositeScore?: number
  preliminaryRank?: number
  finalRank?: number
  repAwarded?: number
  upvoteCount: number
  downvoteCount: number
  voteScore?: number
  submittedAt?: string
  user?: SubmissionAuthor
}

export interface TestRunResult {
  results: { input: string; expected: string; actual: string; passed: boolean }[]
  executionTimeMs: number
}

export type LeaderboardUser = Pick<
  DevUser,
  'id' | 'username' | 'displayName' | 'avatarUrl' | 'totalRep'
>

export interface LeaderboardEntry {
  rank: number
  weeklyRankDelta: number
  user: LeaderboardUser
  challengesSolved: number
  bestCategory: Category
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ActivityEvent {
  type: string
  summary: string
  createdAt: string
  meta?: Record<string, unknown>
}

export type AuthTokenResponse = {
  accessToken?: string
  token?: string
  user: Partial<DevUser> & { id: string; username: string; displayName: string }
}
