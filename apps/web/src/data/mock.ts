import type {
  ActivityItem,
  Challenge,
  DevUser,
  LeaderboardRow,
  PinnedSolution,
  TopSolutionMini,
} from '@/types/hackadevs'

export const mockCurrentUser: DevUser = {
  username: 'you',
  displayName: 'Alex Chen',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
  tagline: 'Backend at day, distributed systems at heart.',
  rep: 12840,
  rankPercentile: 'Top 2%',
  tier: 'Senior',
  selfDeclaredLevel: 'SENIOR',
  platformTier: 'SENIOR',
  topCategory: 'Backend',
  streak: 14,
  weeklyDelta: 340,
  rankMovement: 2,
  challengesSolved: 89,
  githubUrl: 'https://github.com',
  linkedinUrl: 'https://linkedin.com',
  portfolioUrl: 'https://example.com',
  twitterUrl: 'https://x.com',
  skills: {
    Backend: 82,
    Frontend: 41,
    'System Design': 76,
    Security: 55,
    'Data Engineering': 48,
    'ML Ops': 22,
    DevOps: 63,
  },
  categoryRanks: {
    Backend: 4,
    Frontend: 112,
    'System Design': 18,
    Security: 45,
    'Data Engineering': 67,
    'ML Ops': 210,
    DevOps: 31,
  },
}

export const mockChallenges: Challenge[] = [
  {
    slug: 'idempotency-keys-ledger-scale',
    title: 'Idempotency keys at ledger scale',
    description:
      'Design how you would make payment retries safe when your ledger spans regions and partial failures are normal.',
    difficulty: 'Hard',
    category: 'Backend',
    tags: ['distributed-systems', 'postgres', 'redis', 'idempotency'],
    closesIn: '3d 14h',
    submissionCount: 480,
    voteRate: 89,
    company: {
      name: 'Stripe',
      favicon: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=32',
    },
    postedBy: {
      name: 'Stripe Eng',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stripe',
    },
    discussCount: 124,
    constraints: [
      'Assume HTTP APIs only; no magic RPC.',
      'Must survive duplicate client retries for 24h.',
    ],
    bonusObjectives: [
      'Sketch how you would observe duplicate replay attempts in production.',
      'Discuss tradeoffs vs exactly-once semantics.',
    ],
  },
  {
    slug: 'linear-realtime-inbox',
    title: 'Realtime inbox without melting the client',
    description:
      'Your issue tracker has 50k teams. How do you keep inbox counts fresh without polling the world?',
    difficulty: 'Medium',
    category: 'Frontend',
    tags: ['react', 'websocket', 'virtualization', 'state'],
    closesIn: '5d 2h',
    submissionCount: 312,
    voteRate: 91,
    company: {
      name: 'Linear',
      favicon: 'https://www.google.com/s2/favicons?domain=linear.app&sz=32',
    },
    postedBy: { name: 'Linear', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linear' },
    discussCount: 67,
    constraints: ['Mobile web must stay under 2MB initial JS.'],
    bonusObjectives: ['Offline-first sketch for read path.'],
  },
  {
    slug: 'shopify-checkout-extensions',
    title: 'Checkout extensions that cannot brick prod',
    description:
      'Third-party code runs beside core checkout. How do you isolate, version, and roll back?',
    difficulty: 'Legendary',
    category: 'System Design',
    tags: ['sandboxing', 'wasm', 'cdn', 'rollouts'],
    closesIn: '1d 8h',
    submissionCount: 156,
    voteRate: 84,
    company: {
      name: 'Shopify',
      favicon: 'https://www.google.com/s2/favicons?domain=shopify.com&sz=32',
    },
    postedBy: {
      name: 'Shopify',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shopify',
    },
    discussCount: 203,
    constraints: ['P99 checkout latency budget: 120ms added.'],
    bonusObjectives: ['Threat model for malicious extension authors.'],
  },
  {
    slug: 'cache-stampede-basics',
    title: 'Cache stampede at 10k RPS',
    description:
      'A hot key kills your origin every deploy. Fix it with primitives you would actually run.',
    difficulty: 'Beginner',
    category: 'Backend',
    tags: ['redis', 'caching', 'ttl'],
    closesIn: '6d 0h',
    submissionCount: 890,
    voteRate: 94,
    postedBy: {
      name: 'DevRank',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=devrank',
    },
    discussCount: 45,
    constraints: ['No unbounded memory tricks.'],
    bonusObjectives: ['Single-flight vs probabalistic early refresh.'],
  },
]

export const weekTheme = {
  title: 'Reliability under retry storms',
  body: 'This week we focus on idempotency, backoff, and observable failure modes — the kind of work that shows up in postmortems.',
}

export const mockTopSolversWeek: {
  user: Pick<DevUser, 'displayName' | 'avatar' | 'username'>
  delta: number
}[] = [
  {
    user: {
      displayName: 'Mira Okonkwo',
      username: 'mira',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mira',
    },
    delta: 420,
  },
  {
    user: {
      displayName: 'Jon Patel',
      username: 'jonp',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jon',
    },
    delta: 390,
  },
  {
    user: {
      displayName: 'Sam Rivera',
      username: 'samr',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam',
    },
    delta: 355,
  },
]

export const streakHeatmapDays: boolean[] = Array.from(
  { length: 30 },
  (_, i) => i % 3 !== 0 || i % 7 === 0,
)

export function getChallengeBySlug(slug: string): Challenge | undefined {
  return mockChallenges.find((c) => c.slug === slug)
}

export const mockRatingDonut: { label: string; percent: number; color: string }[] = [
  { label: 'Elegant', percent: 42, color: '#6366F1' },
  { label: 'Functional', percent: 48, color: '#10B981' },
  { label: 'Incomplete', percent: 10, color: '#52525B' },
]

export const mockTopSolutionsMini: TopSolutionMini[] = [
  {
    id: 's1',
    solver: {
      username: 'mira',
      displayName: 'Mira Okonkwo',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mira',
    },
    votes: 412,
  },
  {
    id: 's2',
    solver: {
      username: 'jonp',
      displayName: 'Jon Patel',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jon',
    },
    votes: 301,
  },
  {
    id: 's3',
    solver: {
      username: 'samr',
      displayName: 'Sam Rivera',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam',
    },
    votes: 288,
  },
]

export function buildLeaderboard(): LeaderboardRow[] {
  const base: Omit<LeaderboardRow, 'rank'>[] = [
    {
      ...mockCurrentUser,
      username: 'mira',
      displayName: 'Mira Okonkwo',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mira',
      rep: 48210,
      tier: 'Senior',
      selfDeclaredLevel: 'SENIOR',
      platformTier: 'STAFF',
      topCategory: 'Backend',
      streak: 28,
      weeklyDelta: 420,
      rankMovement: 1,
      challengesSolved: 210,
      rankPercentile: 'Top 0.1%',
      tagline: 'Writes postmortems for fun.',
      skills: mockCurrentUser.skills,
    },
    {
      ...mockCurrentUser,
      username: 'jonp',
      displayName: 'Jon Patel',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jon',
      rep: 47102,
      tier: 'Senior',
      selfDeclaredLevel: 'SENIOR',
      platformTier: 'PRINCIPAL',
      topCategory: 'System Design',
      streak: 12,
      weeklyDelta: 390,
      rankMovement: -1,
      challengesSolved: 198,
      rankPercentile: 'Top 0.2%',
      tagline: 'Interfaces and incidents.',
      skills: mockCurrentUser.skills,
    },
    {
      ...mockCurrentUser,
      username: 'samr',
      displayName: 'Sam Rivera',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam',
      rep: 46540,
      tier: 'Mid',
      selfDeclaredLevel: 'MID',
      platformTier: 'ENGINEER',
      topCategory: 'Frontend',
      streak: 9,
      weeklyDelta: 355,
      rankMovement: 2,
      challengesSolved: 176,
      rankPercentile: 'Top 0.3%',
      tagline: 'Perf budgets are promises.',
      skills: mockCurrentUser.skills,
    },
    {
      ...mockCurrentUser,
      rep: 12840,
      weeklyDelta: 340,
      rankMovement: 2,
      challengesSolved: 89,
      selfDeclaredLevel: 'SENIOR',
      platformTier: 'SENIOR',
    },
    {
      ...mockCurrentUser,
      username: 'taylor',
      displayName: 'Taylor Kim',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taylor',
      rep: 11200,
      tier: 'Mid',
      selfDeclaredLevel: 'MID',
      platformTier: 'ENGINEER',
      topCategory: 'Security',
      streak: 4,
      weeklyDelta: 0,
      rankMovement: 0,
      challengesSolved: 72,
      rankPercentile: 'Top 4%',
      tagline: '',
      skills: mockCurrentUser.skills,
    },
    {
      ...mockCurrentUser,
      username: 'casey',
      displayName: 'Casey Wu',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=casey',
      rep: 10820,
      tier: 'Junior',
      selfDeclaredLevel: 'JUNIOR',
      platformTier: 'APPRENTICE',
      topCategory: 'Data Engineering',
      streak: 2,
      weeklyDelta: -40,
      rankMovement: -3,
      challengesSolved: 54,
      rankPercentile: 'Top 5%',
      tagline: '',
      skills: mockCurrentUser.skills,
    },
  ]
  return base.map((row, i) => ({ ...row, rank: i + 1 }))
}

export const categorySpotlight = {
  category: 'Backend' as const,
  devs: buildLeaderboard().slice(0, 5),
}

export const mockProfileUser = (username: string): DevUser | undefined => {
  const board = buildLeaderboard()
  const row = board.find((r) => r.username === username)
  if (row) return row
  if (username === mockCurrentUser.username) return mockCurrentUser
  return undefined
}

export const mockPinned: PinnedSolution[] = [
  {
    challengeSlug: 'idempotency-keys-ledger-scale',
    challengeTitle: 'Idempotency keys at ledger scale',
    rank: 1,
    total: 480,
    rationaleExcerpt:
      'I treated the idempotency record as the source of truth for side effects, with a narrow transactional boundary…',
    votes: 412,
    date: 'Mar 12, 2026',
  },
  {
    challengeSlug: 'linear-realtime-inbox',
    challengeTitle: 'Realtime inbox without melting the client',
    rank: 3,
    total: 312,
    rationaleExcerpt:
      'Fan-out via incremental sync channels; collapse counts server-side with CRDT-inspired merges…',
    votes: 198,
    date: 'Feb 28, 2026',
  },
  {
    challengeSlug: 'cache-stampede-basics',
    challengeTitle: 'Cache stampede at 10k RPS',
    rank: 12,
    total: 890,
    rationaleExcerpt:
      'Single-flight plus jittered TTL; origin shield only when key cardinality is bounded…',
    votes: 76,
    date: 'Jan 15, 2026',
  },
]

export const mockActivity: ActivityItem[] = [
  { id: '1', kind: 'solve', text: 'Solved Idempotency keys — rank #4 of 480', time: '3 days ago' },
  { id: '2', kind: 'follow', text: 'Followed @jonp', time: '5 days ago' },
  { id: '3', kind: 'badge', text: 'Earned badge: Streak Guardian', time: '1 week ago' },
]

export const mockSolutionViewer = {
  id: 's-view-1',
  challengeSlug: 'idempotency-keys-ledger-scale',
  challengeTitle: 'Idempotency keys at ledger scale',
  solver: {
    username: 'mira',
    displayName: 'Mira Okonkwo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mira',
  },
  rank: 1,
  total: 480,
  submittedAt: 'Mar 10, 2026',
  language: 'TypeScript',
  code: `async function withIdempotency<T>(
  key: string,
  run: () => Promise<T>,
): Promise<T> {
  const existing = await store.get(key)
  if (existing?.status === "complete") return existing.result as T
  return store.singleFlight(key, async () => {
    const result = await run()
    await store.commit(key, result)
    return result
  })
}`,
  rationale: {
    approach:
      'I modeled idempotency keys as durable records with a strict state machine: pending → committed | failed. Side effects attach only after commit.',
    tradeoffs:
      'Strong consistency per key costs latency on the hot path; I accept that for payments. For read-heavy derived state I would async project.',
    scale:
      'Shard the key space by tenant; use a narrow Redis lease for single-flight with Postgres as source of truth for commit logs.',
  },
  upvotes: 412,
  downvotes: 18,
}

export const mockComments: {
  id: string
  author: { name: string; username: string; avatar: string; rank: number }
  body: string
  time: string
  replies?: {
    id: string
    author: { name: string; username: string; avatar: string; rank: number }
    body: string
    time: string
  }[]
}[] = [
  {
    id: 'c1',
    author: {
      name: 'Jon Patel',
      username: 'jonp',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jon',
      rank: 2,
    },
    body: 'Clean boundary on commit vs side effect. Would you use outbox here?',
    time: '2d ago',
    replies: [
      {
        id: 'c1r1',
        author: {
          name: 'Mira Okonkwo',
          username: 'mira',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mira',
          rank: 1,
        },
        body: 'Yes — outbox for anything that crosses network boundaries.',
        time: '1d ago',
      },
    ],
  },
]
