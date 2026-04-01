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
  | 'AWAITING_FOLLOWUP'
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

export type AvailabilityStatus =
  | 'UNSPECIFIED'
  | 'OPEN_TO_WORK'
  | 'EMPLOYED'
  | 'NOT_LOOKING'
  | 'FREELANCE_OPEN'

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR'

export type VoteValue = 'UP' | 'DOWN'

export interface ProfilePinnedSubmission {
  id: string
  challengeSlug: string
  challengeTitle: string
  finalRank: number | null
  preliminaryRank: number | null
  upvoteCount: number
  downvoteCount: number
  rationaleExcerpt: string
  submittedAt: string | null
}

export interface DevUser {
  id: string
  username: string
  displayName: string
  role?: UserRole
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
  availabilityStatus?: AvailabilityStatus
  pinnedSubmissions?: ProfilePinnedSubmission[]
  viewerFollows?: boolean
}

export type SubmissionAuthor = Pick<DevUser, 'id' | 'username' | 'displayName' | 'avatarUrl'>

export type ChallengeStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'

export interface GlobalSearchChallengeHit {
  slug: string
  title: string
  category: Category
}

export interface GlobalSearchUserHit {
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface GlobalSearchResponse {
  challenges: GlobalSearchChallengeHit[]
  users: GlobalSearchUserHit[]
}

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
  status: ChallengeStatus
  opensAt: string
  closesAt: string
  companySource?: string
  submissionCount: number
  votingSettled?: boolean
  companyAttributionOptIn?: boolean
  visibleTestCases: { input: string; expectedOutput: string }[]
}

export interface Submission {
  id: string
  userId: string
  challengeId: string
  challenge?: { slug: string; title: string; category: Category }
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
  followUpQuestions?: { id: string; prompt: string }[]
  followUpAnswers?: { id: string; text: string }[]
  user?: SubmissionAuthor
}

export interface TestRunResult {
  results: { input: string; expected: string; actual: string; passed: boolean }[]
  executionTimeMs: number
}

export interface LeaderboardEntry {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  totalRep: number
  globalRank: number | null
  tier: Tier
  weeklyRepDelta: number
  currentStreakDays: number
  bestCategory: Category | null
  categoryRank: number | null
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
  refreshToken?: string
  user: Partial<DevUser> & { id: string; username: string; displayName: string }
}
