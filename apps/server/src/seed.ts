import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import bcrypt from 'bcryptjs'
import type {
  AvailabilityStatus,
  Categories,
  ChallengeDifficulty,
  SelfDeclaredLevel,
} from '@prisma/client'
import { CHALLENGE_TEST_SUITES } from './challenge-test-suites.js'
import { prisma } from './lib/prisma.js'
import { assignRanks, calculateCompositeScore } from './utils/rankingEngine.js'
import { awardPreliminaryRep, awardRep } from './modules/rep/rep.service.js'
import { createLeaderboardService } from './modules/leaderboard/leaderboard.service.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
config({ path: path.join(repoRoot, '.env') })

const SEED_USERNAMES = [
  'hackadevs_admin',
  'alex_chen',
  'mira_okonkwo',
  'jon_patel',
  'sam_rivera',
  'taylor_kim',
  'casey_wu',
  'priya_shah',
  'marcus_lee',
  'sofia_torres',
  'james_kwon',
] as const

const ADMIN_USERNAME = 'hackadevs_admin'
const DEMO_USERNAMES = SEED_USERNAMES.filter((u) => u !== ADMIN_USERNAME)

type DemoProf = {
  username: string
  displayName: string
  email: string
  selfDeclaredLevel: SelfDeclaredLevel
  currentStreakDays: number
  submissionSlugs: string[]
  testScores: number[]
  rationaleScores: number[]
}

const CHALLENGE_SLUGS = [
  'rate-limiter-redis-failover',
  'react-rerender-audit-invisible-perf',
  'comment-system-10m-dau',
  'express-auth-vulnerabilities-six',
  'postgres-50m-row-zero-downtime',
  'ml-serving-traffic-spikes',
  'dockerfile-monorepo-prod',
  'idempotency-keys-ledger-scale',
  'sum-positive-numbers',
  'fizzbuzz-classic',
  'palindrome-check',
  'merge-two-sorted-arrays',
  'slugify-url-segment',
  'fetch-health-json',
] as const

const DEMO_AVAILABILITY: Record<string, AvailabilityStatus> = {
  alex_chen: 'OPEN_TO_WORK',
  mira_okonkwo: 'EMPLOYED',
  jon_patel: 'FREELANCE_OPEN',
  sam_rivera: 'OPEN_TO_WORK',
  taylor_kim: 'NOT_LOOKING',
  casey_wu: 'EMPLOYED',
  priya_shah: 'OPEN_TO_WORK',
  marcus_lee: 'NOT_LOOKING',
  sofia_torres: 'OPEN_TO_WORK',
  james_kwon: 'EMPLOYED',
}

const SEED_SOLUTION_CODE: Record<string, string> = {
  'sum-positive-numbers': `export function solve(input: string): string {
  const nums = JSON.parse(input) as number[]
  let s = 0
  for (const n of nums) if (n > 0) s += n
  return String(s)
}
`,
  'fizzbuzz-classic': `export function solve(input: string): string {
  const { n } = JSON.parse(input) as { n: number }
  const lines: string[] = []
  for (let i = 1; i <= n; i++) {
    let line = String(i)
    if (i % 15 === 0) line = 'FizzBuzz'
    else if (i % 3 === 0) line = 'Fizz'
    else if (i % 5 === 0) line = 'Buzz'
    lines.push(line)
  }
  return JSON.stringify(lines.join('\\n'))
}
`,
  'palindrome-check': `export function solve(input: string): string {
  const { s } = JSON.parse(input) as { s: string }
  const alnum = s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const ok = alnum === [...alnum].reverse().join('')
  return JSON.stringify(ok)
}
`,
  'merge-two-sorted-arrays': `export function solve(input: string): string {
  const { a, b } = JSON.parse(input) as { a: number[]; b: number[] }
  const out: number[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i]! <= b[j]!) out.push(a[i++]!)
    else out.push(b[j++]!)
  }
  while (i < a.length) out.push(a[i++]!)
  while (j < b.length) out.push(b[j++]!)
  return JSON.stringify(out)
}
`,
  'slugify-url-segment': `export function solve(input: string): string {
  const { title } = JSON.parse(input) as { title: string }
  const s = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return JSON.stringify(s)
}
`,
  'fetch-health-json': `export function solve(input: string): string {
  const { uptimeSec } = JSON.parse(input) as { uptimeSec: number }
  return JSON.stringify({ status: 'ok', uptimeSec })
}
`,
  'rate-limiter-redis-failover': `export function solve(input: string): string {
  return JSON.stringify({ approach: 'seed', slidingWindow: true, input })
}
`,
  'react-rerender-audit-invisible-perf': `export function solve(input: string): string {
  return JSON.stringify({ memo: true, virtualized: true, input })
}
`,
  'comment-system-10m-dau': `export function solve(input: string): string {
  return JSON.stringify({ design: 'seed', cache: 'redis', input })
}
`,
  'express-auth-vulnerabilities-six': `export function solve(input: string): string {
  return JSON.stringify({ findings: 6, input })
}
`,
  'postgres-50m-row-zero-downtime': `export function solve(input: string): string {
  return JSON.stringify({ migration: 'online', input })
}
`,
  'ml-serving-traffic-spikes': `export function solve(input: string): string {
  return JSON.stringify({ batching: true, input })
}
`,
  'dockerfile-monorepo-prod': `export function solve(input: string): string {
  return JSON.stringify({ multiStage: true, input })
}
`,
  'idempotency-keys-ledger-scale': `export function solve(input: string): string {
  return JSON.stringify({ idempotent: true, ledger: true, input })
}
`,
}

const SEED_CHALLENGES: {
  slug: string
  category: Categories
  difficulty: ChallengeDifficulty
  title: string
  problemStatement: string
  constraints: string[]
  bonusObjective: string
  tags: string[]
  exampleInput: string
  exampleOutput: string
  companySource?: string
}[] = [
  {
    slug: 'rate-limiter-redis-failover',
    category: 'BACKEND',
    difficulty: 'HARD',
    title: 'Rate limiter that survives a Redis failover',
    companySource: 'Stripe',
    problemStatement:
      "You're the on-call engineer at a fintech startup processing 50k API requests/minute. Your rate limiter relies on a single Redis instance. At 2am, Redis goes down for 4 minutes. Design and implement a distributed rate limiter that degrades gracefully — never fully open, never fully closed — during a backing store outage. Your solution must handle burst recovery when Redis comes back without letting a flood of pent-up requests through.",
    constraints: [
      'Must use sliding window algorithm, not fixed window',
      'P99 latency overhead of the rate limiter itself must stay under 2ms',
      'Must work correctly across 8 horizontally-scaled API server instances',
    ],
    bonusObjective:
      'Implement adaptive rate limiting that automatically tightens limits when error rates spike above 5%',
    tags: ['redis', 'distributed-systems', 'fault-tolerance', 'rate-limiting'],
    exampleInput: 'client_id=acme, window=60s, limit=1000',
    exampleOutput: 'allow: true, remaining: 842, reset_at: unix_ts',
  },
  {
    slug: 'react-rerender-audit-invisible-perf',
    category: 'FRONTEND',
    difficulty: 'BEGINNER',
    title: 'Re-render audit: find the invisible perf killer',
    companySource: 'Linear',
    problemStatement:
      "You've inherited a React dashboard that renders 200+ data rows updating every 2 seconds via WebSocket. Users are reporting choppy scrolling and input lag. Profile the component tree and identify every unnecessary re-render. The codebase uses React 18, Zustand for state, and react-window for virtualisation — but someone has been bypassing the virtualisation in several places. Fix every re-render issue without changing the visible behaviour or the component's public API.",
    constraints: [
      'Cannot use useMemo/useCallback as a blanket fix — only where measurably beneficial',
      'Must maintain WebSocket update latency under 100ms end-to-end',
      'Solution must work with React StrictMode enabled',
    ],
    bonusObjective:
      'Implement a dev-mode re-render counter overlay that shows per-component render counts in real time',
    tags: ['react', 'performance', 'websocket', 'profiling'],
    exampleInput: 'scroll position 1200px, 240 rows mounted',
    exampleOutput: '≤12 React commits per 2s tick, main thread idle > 50%',
  },
  {
    slug: 'comment-system-10m-dau',
    category: 'SYSTEM_DESIGN',
    difficulty: 'MEDIUM',
    title: 'Design a comment system for 10M daily active users',
    companySource: 'Reddit',
    problemStatement:
      "Design a threaded comment system like Reddit's for a platform with 10M DAU. Posts can have up to 100k comments. Users expect: comments to appear within 500ms of posting, infinite nested replies, real-time updates when others comment on a thread they're viewing, vote counts that are eventually consistent (within 10 seconds), and the ability to sort by Hot/New/Top. You don't need to implement it — design the data model, API contracts, caching strategy, and real-time delivery architecture.",
    constraints: [
      'Read:write ratio is 95:5 — optimise for reads',
      'Must support comment trees up to 10 levels deep',
      'Hot sort must update within 10 seconds of a vote',
    ],
    bonusObjective:
      'Design the moderation pipeline: how do you detect and soft-delete toxic comments at scale without human review for every post?',
    tags: ['system-design', 'caching', 'real-time', 'databases'],
    exampleInput: 'post_id, sort=hot, cursor',
    exampleOutput: 'paginated thread slice + websocket channel id',
  },
  {
    slug: 'express-auth-vulnerabilities-six',
    category: 'SECURITY',
    difficulty: 'MEDIUM',
    title: 'Find and fix the auth vulnerabilities in this Express app',
    companySource: 'Snyk',
    problemStatement:
      "You've been handed a Node.js Express API with JWT auth, user roles, and file upload. The code passes its own test suite but has 6 distinct security vulnerabilities ranging from OWASP Top 10 to logic errors. Find all 6, explain each one with a concrete exploit scenario, fix them, and write a test that would have caught each one. The code is provided in the challenge attachment — your solution must include both the vulnerability analysis and the patched code.",
    constraints: [
      'Must find all 6 vulnerabilities — partial credit awarded per finding',
      'Each fix must not break the existing passing test suite',
      'Must include a written exploit scenario for each vulnerability found',
    ],
    bonusObjective:
      'Add a request signing mechanism so that even a stolen JWT cannot be replayed from a different IP without re-authentication',
    tags: ['security', 'jwt', 'express', 'owasp'],
    exampleInput: 'attachment: vulnerable-app.zip',
    exampleOutput: 'report.md + patched src/ + new tests/',
  },
  {
    slug: 'postgres-50m-row-zero-downtime',
    category: 'DATA_ENGINEERING',
    difficulty: 'HARD',
    title: 'Zero-downtime migration on a 50M row Postgres table',
    companySource: 'Snowflake',
    problemStatement:
      'You need to add a non-nullable column with a computed default to a Postgres table that has 50M rows and receives 500 writes/second in production. A naive ALTER TABLE will lock the table for 10+ minutes. Write the complete migration plan and SQL: shadow column, backfill strategy, constraint addition, index creation, and cutover — all without taking the table offline or blocking writes for more than 100ms at any point.',
    constraints: [
      'Total migration must complete within 4 hours on a db.r6g.xlarge RDS instance',
      'Zero tolerance for data inconsistency — every row must have the correct computed value',
      'Must include a rollback plan that also requires no downtime',
    ],
    bonusObjective:
      'Implement the backfill as a resumable job that can pause/resume without re-processing already-migrated rows',
    tags: ['postgres', 'migrations', 'database', 'zero-downtime'],
    exampleInput: 'table events, column risk_score numeric not null',
    exampleOutput: 'ordered SQL + runbook + validation queries',
  },
  {
    slug: 'ml-serving-traffic-spikes',
    category: 'ML_OPS',
    difficulty: 'MEDIUM',
    title: 'Build a model serving layer that handles traffic spikes',
    companySource: 'Hugging Face',
    problemStatement:
      'Your ML team has trained a text classification model (PyTorch, 400MB) that needs to serve 1k predictions/second at peak with P99 latency under 50ms. The model currently takes 180ms for a single prediction on CPU. Design and implement the serving infrastructure: batching strategy, worker pool, request queuing, and autoscaling triggers. You do not need to run the actual model — mock torch.predict() as a function that sleeps for 180ms and returns a label.',
    constraints: [
      'Must achieve 1k RPS with P99 under 50ms using dynamic batching',
      'Worker pool must scale between 2-16 workers based on queue depth',
      'Must handle a 10x traffic spike within 30 seconds without dropping requests',
    ],
    bonusObjective:
      'Add A/B testing support so 10% of traffic goes to model_v2 and results are logged for comparison',
    tags: ['mlops', 'inference', 'batching', 'autoscaling'],
    exampleInput: 'batch inference API spec',
    exampleOutput: 'architecture diagram + pseudo-code scheduler',
  },
  {
    slug: 'dockerfile-monorepo-prod',
    category: 'DEVOPS',
    difficulty: 'BEGINNER',
    title: 'Write the Dockerfile that actually works in prod',
    companySource: 'Vercel',
    problemStatement:
      'You have a Node.js monorepo (pnpm workspaces) with a Next.js frontend and a Fastify API. The current Docker setup works locally but the production image is 2.1GB, cold starts take 45 seconds, and it leaks environment variables into the image layers. Fix it: write a proper multi-stage Dockerfile for each app, optimise for layer caching, minimise final image size, and ensure no secrets appear in any layer even in docker history. Include a docker-compose.yml for local dev that hot-reloads both apps.',
    constraints: [
      'Production images must be under 300MB each',
      'pnpm install must be cached correctly — a change to app code must not re-run install',
      'Must work on linux/amd64 and linux/arm64 (Apple Silicon)',
    ],
    bonusObjective:
      'Add a GitHub Actions workflow that builds, scans with trivy, and pushes to GHCR on merge to main',
    tags: ['docker', 'devops', 'ci-cd', 'monorepo'],
    exampleInput: 'repo layout: apps/web, apps/api',
    exampleOutput: 'Dockerfile.web + Dockerfile.api + compose + workflow yaml',
  },
  {
    slug: 'idempotency-keys-ledger-scale',
    category: 'FULLSTACK',
    difficulty: 'HARD',
    title: 'Idempotency keys at ledger scale',
    companySource: 'Plaid',
    problemStatement:
      "You're building the payments API for a fintech. Network retries mean the same payment request can arrive 2-5 times within a 30-second window. Implement an idempotency key system that guarantees exactly-once processing across your entire payments pipeline: API layer, queue consumer, and ledger write. The system must handle concurrent duplicate requests (two identical requests arriving within 10ms of each other) without creating duplicate ledger entries. Use any stack you're comfortable with.",
    constraints: [
      'Must handle concurrent duplicates — optimistic locking alone is not sufficient',
      'Idempotency keys must expire after 24 hours to prevent the keys table growing unbounded',
      'The solution must work correctly even if the API server crashes mid-request',
    ],
    bonusObjective:
      'Implement a reconciliation job that detects and alerts on any ledger entries created without a corresponding idempotency key',
    tags: ['payments', 'idempotency', 'distributed-systems', 'ledger'],
    exampleInput: 'POST /pay Idempotency-Key: uuid',
    exampleOutput: 'single ledger row per key, 409 on replay after completion',
  },
  {
    slug: 'sum-positive-numbers',
    category: 'BACKEND',
    difficulty: 'BEGINNER',
    title: 'Sum positive numbers',
    problemStatement:
      'Given a JSON array of integers, return the sum of every number strictly greater than zero. An empty array should sum to 0.',
    constraints: ['O(n) is enough', 'Treat the input as a JSON array of integers'],
    bonusObjective: 'Note in your rationale how you handle empty input',
    tags: ['arrays', 'warmup', 'beginner'],
    exampleInput: '[2, -1, 3]',
    exampleOutput: '5',
  },
  {
    slug: 'fizzbuzz-classic',
    category: 'BACKEND',
    difficulty: 'BEGINNER',
    title: 'FizzBuzz',
    problemStatement:
      'For integers 1 through n inclusive, produce one line each: "Fizz" if divisible by 3, "Buzz" if by 5, "FizzBuzz" if both, else the number. Return lines joined with newline characters.',
    constraints: ['1 ≤ n ≤ 30 for this challenge', 'Use \\n between lines, no trailing newline'],
    bonusObjective: 'Extend to arbitrary divisors in your write-up',
    tags: ['loops', 'warmup', 'beginner'],
    exampleInput: 'n=4',
    exampleOutput: '1\\n2\\nFizz\\n4',
  },
  {
    slug: 'palindrome-check',
    category: 'BACKEND',
    difficulty: 'BEGINNER',
    title: 'Palindrome check',
    problemStatement:
      'Given a string, return whether it reads the same forwards and backwards after lowercasing and removing all non-alphanumeric characters.',
    constraints: ['Empty string is a palindrome', 'Case-insensitive'],
    bonusObjective: 'Mention time and space complexity',
    tags: ['strings', 'warmup', 'beginner'],
    exampleInput: '"A man, a plan, a canal: Panama"',
    exampleOutput: 'true',
  },
  {
    slug: 'merge-two-sorted-arrays',
    category: 'BACKEND',
    difficulty: 'BEGINNER',
    title: 'Merge two sorted arrays',
    problemStatement:
      'Given two sorted ascending arrays of integers, merge them into one sorted ascending array. Duplicates are allowed.',
    constraints: [
      'Do not use the built-in sort if your language provides merge — implement merge logic',
    ],
    bonusObjective: 'Handle one array being empty',
    tags: ['arrays', 'two-pointers', 'beginner'],
    exampleInput: '[1,3,5] and [2,4,6]',
    exampleOutput: '[1,2,3,4,5,6]',
  },
  {
    slug: 'slugify-url-segment',
    category: 'FRONTEND',
    difficulty: 'BEGINNER',
    title: 'Slugify a title',
    problemStatement:
      'Turn a display string into a URL slug: lowercase, trim, replace spaces with hyphens, remove characters that are not letters, numbers, or hyphens, collapse repeated hyphens.',
    constraints: [
      'Leading and trailing hyphens must be stripped',
      'Empty input becomes empty string',
    ],
    bonusObjective: 'Strip common punctuation like apostrophes',
    tags: ['strings', 'warmup', 'beginner'],
    exampleInput: '"  Hello World!!  "',
    exampleOutput: '"hello-world"',
  },
  {
    slug: 'fetch-health-json',
    category: 'FULLSTACK',
    difficulty: 'BEGINNER',
    title: 'Health check JSON',
    problemStatement:
      'Describe in your rationale a tiny HTTP GET /health that returns JSON `{ "status": "ok", "uptimeSec": <number> }`. For the automated check, assume the service exposes uptime as a non-negative integer seconds value.',
    constraints: ['status must be exactly "ok" when healthy', 'uptimeSec must be a number'],
    bonusObjective: 'Add a version field in prose only',
    tags: ['http', 'json', 'beginner'],
    exampleInput: 'uptimeSec=42',
    exampleOutput: '{"status":"ok","uptimeSec":42}',
  },
]

const DEMO_PROFILES: DemoProf[] = [
  {
    username: 'alex_chen',
    displayName: 'Alex Chen',
    email: 'alex@demo.hackadevs.dev',
    selfDeclaredLevel: 'SENIOR',
    currentStreakDays: 14,
    submissionSlugs: ['sum-positive-numbers', 'fizzbuzz-classic', 'merge-two-sorted-arrays'],
    testScores: [88, 92, 85],
    rationaleScores: [78, 82, 74],
  },
  {
    username: 'mira_okonkwo',
    displayName: 'Mira Okonkwo',
    email: 'mira@demo.hackadevs.dev',
    selfDeclaredLevel: 'SENIOR',
    currentStreakDays: 22,
    submissionSlugs: ['palindrome-check', 'slugify-url-segment', 'fetch-health-json'],
    testScores: [95, 72, 90],
    rationaleScores: [88, 70, 85],
  },
  {
    username: 'jon_patel',
    displayName: 'Jon Patel',
    email: 'jon@demo.hackadevs.dev',
    selfDeclaredLevel: 'MID',
    currentStreakDays: 7,
    submissionSlugs: [
      'dockerfile-monorepo-prod',
      'idempotency-keys-ledger-scale',
      'rate-limiter-redis-failover',
    ],
    testScores: [81, 76, 79],
    rationaleScores: [72, 68, 75],
  },
  {
    username: 'sam_rivera',
    displayName: 'Sam Rivera',
    email: 'sam@demo.hackadevs.dev',
    selfDeclaredLevel: 'MID',
    currentStreakDays: 3,
    submissionSlugs: ['fizzbuzz-classic', 'palindrome-check'],
    testScores: [91, 87],
    rationaleScores: [80, 77],
  },
  {
    username: 'taylor_kim',
    displayName: 'Taylor Kim',
    email: 'taylor@demo.hackadevs.dev',
    selfDeclaredLevel: 'JUNIOR',
    currentStreakDays: 0,
    submissionSlugs: [
      'comment-system-10m-dau',
      'ml-serving-traffic-spikes',
      'dockerfile-monorepo-prod',
    ],
    testScores: [74, 82, 78],
    rationaleScores: [62, 70, 65],
  },
  {
    username: 'casey_wu',
    displayName: 'Casey Wu',
    email: 'casey@demo.hackadevs.dev',
    selfDeclaredLevel: 'SENIOR',
    currentStreakDays: 30,
    submissionSlugs: ['fetch-health-json', 'fizzbuzz-classic'],
    testScores: [68, 94],
    rationaleScores: [64, 90],
  },
  {
    username: 'priya_shah',
    displayName: 'Priya Shah',
    email: 'priya@demo.hackadevs.dev',
    selfDeclaredLevel: 'MID',
    currentStreakDays: 11,
    submissionSlugs: ['palindrome-check', 'merge-two-sorted-arrays', 'rate-limiter-redis-failover'],
    testScores: [86, 89, 83],
    rationaleScores: [76, 81, 79],
  },
  {
    username: 'marcus_lee',
    displayName: 'Marcus Lee',
    email: 'marcus@demo.hackadevs.dev',
    selfDeclaredLevel: 'MID',
    currentStreakDays: 5,
    submissionSlugs: ['slugify-url-segment', 'sum-positive-numbers'],
    testScores: [93, 85],
    rationaleScores: [84, 72],
  },
  {
    username: 'sofia_torres',
    displayName: 'Sofia Torres',
    email: 'sofia@demo.hackadevs.dev',
    selfDeclaredLevel: 'JUNIOR',
    currentStreakDays: 1,
    submissionSlugs: ['fetch-health-json', 'merge-two-sorted-arrays', 'fizzbuzz-classic'],
    testScores: [77, 71, 69],
    rationaleScores: [60, 58, 55],
  },
  {
    username: 'james_kwon',
    displayName: 'James Kwon',
    email: 'james@demo.hackadevs.dev',
    selfDeclaredLevel: 'SENIOR',
    currentStreakDays: 18,
    submissionSlugs: ['palindrome-check', 'sum-positive-numbers'],
    testScores: [97, 90],
    rationaleScores: [92, 86],
  },
]

async function wipeSeedScope() {
  const slugList = [...CHALLENGE_SLUGS]
  const challenges = await prisma.challenge.findMany({
    where: { slug: { in: slugList }, deletedAt: null },
    select: { id: true },
  })
  const challengeIds = challenges.map((c) => c.id)
  if (challengeIds.length === 0) {
    const seedUsers = await prisma.user.findMany({
      where: { username: { in: [...SEED_USERNAMES] } },
      select: { id: true },
    })
    const userIds = seedUsers.map((u) => u.id)
    if (userIds.length) {
      await prisma.repEvent.deleteMany({ where: { userId: { in: userIds } } })
      await prisma.categoryRep.deleteMany({ where: { userId: { in: userIds } } })
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { totalRep: 0, weeklyRepDelta: 0, globalRank: null, tier: 'NOVICE' },
      })
    }
    return
  }

  const subs = await prisma.submission.findMany({
    where: { challengeId: { in: challengeIds }, deletedAt: null },
    select: { id: true },
  })
  const subIds = subs.map((s) => s.id)

  const seedUsers = await prisma.user.findMany({
    where: { username: { in: [...SEED_USERNAMES] } },
    select: { id: true },
  })
  const seedUserIds = seedUsers.map((u) => u.id)

  if (subIds.length) {
    await prisma.vote.deleteMany({ where: { submissionId: { in: subIds } } })
    await prisma.repEvent.deleteMany({ where: { submissionId: { in: subIds } } })
    await prisma.submission.deleteMany({ where: { id: { in: subIds } } })
  }

  await prisma.repEvent.deleteMany({
    where: {
      userId: { in: seedUserIds },
      submissionId: null,
    },
  })

  await prisma.challenge.deleteMany({ where: { id: { in: challengeIds } } })

  await prisma.categoryRep.deleteMany({ where: { userId: { in: seedUserIds } } })

  await prisma.user.updateMany({
    where: { id: { in: seedUserIds } },
    data: { totalRep: 0, weeklyRepDelta: 0, globalRank: null, tier: 'NOVICE' },
  })
}

async function upsertAdmin(adminIdHolder: { id: string }) {
  const hash = await bcrypt.hash('changeme123', 12)
  await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    create: {
      username: ADMIN_USERNAME,
      email: 'admin@hackadevs.dev',
      passwordHash: hash,
      displayName: 'HackaDevs Admin',
      role: 'ADMIN',
      tier: 'LEGEND',
      totalRep: 0,
    },
    update: {
      passwordHash: hash,
      displayName: 'HackaDevs Admin',
      role: 'ADMIN',
      tier: 'LEGEND',
    },
  })
  const admin = await prisma.user.findFirstOrThrow({
    where: { username: ADMIN_USERNAME, deletedAt: null },
  })
  adminIdHolder.id = admin.id
  await prisma.repEvent.deleteMany({
    where: { userId: admin.id, note: 'seed_admin_total' },
  })
  const current = admin.totalRep
  if (current !== 999999) {
    const delta = 999999 - current
    if (delta !== 0) {
      await awardRep(prisma, admin.id, 'MANUAL_ADJUSTMENT', delta, { note: 'seed_admin_total' })
    }
  }
}

async function upsertDemoUsers() {
  const hash = await bcrypt.hash('demo1234', 12)
  for (const p of DEMO_PROFILES) {
    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(p.username)}`
    await prisma.user.upsert({
      where: { username: p.username },
      create: {
        username: p.username,
        email: p.email,
        passwordHash: hash,
        displayName: p.displayName,
        avatarUrl,
        selfDeclaredLevel: p.selfDeclaredLevel,
        currentStreakDays: p.currentStreakDays,
        role: 'USER',
        availabilityStatus: DEMO_AVAILABILITY[p.username] ?? 'UNSPECIFIED',
      },
      update: {
        passwordHash: hash,
        displayName: p.displayName,
        avatarUrl,
        selfDeclaredLevel: p.selfDeclaredLevel,
        currentStreakDays: p.currentStreakDays,
        role: 'USER',
        availabilityStatus: DEMO_AVAILABILITY[p.username] ?? 'UNSPECIFIED',
      },
    })
  }
}

async function upsertChallenges(adminId: string) {
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const t0 = Date.now()
  const n = SEED_CHALLENGES.length
  for (let i = 0; i < n; i++) {
    const ch = SEED_CHALLENGES[i]
    const opensAt = new Date(t0 - (n - 1 - i) * 60 * 60 * 1000)
    const closesAt = new Date(opensAt.getTime() + weekMs)
    const testSuite = CHALLENGE_TEST_SUITES[ch.slug] ?? []
    await prisma.challenge.upsert({
      where: { slug: ch.slug },
      create: {
        slug: ch.slug,
        title: ch.title,
        problemStatement: ch.problemStatement,
        constraints: ch.constraints,
        bonusObjective: ch.bonusObjective,
        exampleInput: ch.exampleInput,
        exampleOutput: ch.exampleOutput,
        tags: ch.tags,
        category: ch.category,
        difficulty: ch.difficulty,
        companySource: ch.companySource ?? null,
        weekTheme: 'cold start',
        status: 'ACTIVE',
        opensAt,
        closesAt,
        testSuite,
        submissionCount: 0,
        createdByAdminId: adminId,
      },
      update: {
        title: ch.title,
        problemStatement: ch.problemStatement,
        constraints: ch.constraints,
        bonusObjective: ch.bonusObjective,
        exampleInput: ch.exampleInput,
        exampleOutput: ch.exampleOutput,
        tags: ch.tags,
        category: ch.category,
        difficulty: ch.difficulty,
        companySource: ch.companySource ?? null,
        weekTheme: 'cold start',
        status: 'ACTIVE',
        opensAt,
        closesAt,
        testSuite,
        createdByAdminId: adminId,
      },
    })
  }
}

async function seedSubmissionsAndRep() {
  const slugToChallenge = new Map(
    (
      await prisma.challenge.findMany({
        where: { slug: { in: [...CHALLENGE_SLUGS] }, deletedAt: null },
      })
    ).map((c) => [c.slug, c]),
  )

  const usernameToId = new Map(
    (
      await prisma.user.findMany({
        where: { username: { in: [...DEMO_USERNAMES] }, deletedAt: null },
      })
    ).map((u) => [u.username, u.id]),
  )

  const streakByUserId: Record<string, number> = {}
  for (const p of DEMO_PROFILES) {
    const uid = usernameToId.get(p.username)
    if (uid) streakByUserId[uid] = p.currentStreakDays
  }

  const submittedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

  for (const p of DEMO_PROFILES) {
    const userId = usernameToId.get(p.username)
    if (!userId) continue
    for (let i = 0; i < p.submissionSlugs.length; i++) {
      const slug = p.submissionSlugs[i]
      const ch = slugToChallenge.get(slug)
      if (!ch) continue
      const testScore = p.testScores[i] ?? 80
      const rationaleScore = p.rationaleScores[i] ?? 70
      const composite = calculateCompositeScore(testScore, rationaleScore, 50)
      const code = SEED_SOLUTION_CODE[slug] ?? `// seed:${p.username}:${slug}\n`
      await prisma.submission.upsert({
        where: { userId_challengeId: { userId, challengeId: ch.id } },
        create: {
          userId,
          challengeId: ch.id,
          code,
          language: 'TS',
          rationaleApproach: `Approach for ${ch.title}: structured breakdown of requirements and implementation plan.`,
          rationaleTradeoffs: `Tradeoffs: latency vs consistency; cost vs reliability for ${ch.category}.`,
          rationaleScale: `Scale: horizontal sharding, caching, and backpressure for ${ch.category} workloads.`,
          selfTags: ['seed'],
          selfDifficultyRating: 3,
          status: 'PUBLISHED',
          testScore,
          testsPassedCount: Math.round((testScore / 100) * 5),
          testsTotalCount: 5,
          rationaleScore,
          rationaleClarity: Math.round(rationaleScore / 4),
          rationaleDepth: Math.round(rationaleScore / 4),
          rationaleHonesty: Math.round(rationaleScore / 4),
          rationaleScalability: rationaleScore - 3 * Math.round(rationaleScore / 4),
          rationaleSummary: 'Seed rationale summary.',
          rationaleFlags: [],
          voteScore: 50,
          submittedAt,
          compositeScore: composite,
        },
        update: {
          code,
          language: 'TS',
          rationaleApproach: `Approach for ${ch.title}: structured breakdown of requirements and implementation plan.`,
          rationaleTradeoffs: `Tradeoffs: latency vs consistency; cost vs reliability for ${ch.category}.`,
          rationaleScale: `Scale: horizontal sharding, caching, and backpressure for ${ch.category} workloads.`,
          selfTags: ['seed'],
          selfDifficultyRating: 3,
          status: 'PUBLISHED',
          testScore,
          testsPassedCount: Math.round((testScore / 100) * 5),
          testsTotalCount: 5,
          rationaleScore,
          rationaleClarity: Math.round(rationaleScore / 4),
          rationaleDepth: Math.round(rationaleScore / 4),
          rationaleHonesty: Math.round(rationaleScore / 4),
          rationaleScalability: rationaleScore - 3 * Math.round(rationaleScore / 4),
          rationaleSummary: 'Seed rationale summary.',
          rationaleFlags: [],
          voteScore: 50,
          submittedAt,
          compositeScore: composite,
          deletedAt: null,
        },
      })
    }
  }

  for (const ch of slugToChallenge.values()) {
    const rows = await prisma.submission.findMany({
      where: { challengeId: ch.id, status: 'PUBLISHED', deletedAt: null },
      select: {
        id: true,
        userId: true,
        testScore: true,
        rationaleScore: true,
        compositeScore: true,
        submittedAt: true,
      },
    })
    if (!rows.length) continue
    for (const r of rows) {
      const comp =
        r.compositeScore ?? calculateCompositeScore(r.testScore ?? 0, r.rationaleScore ?? 0, 50)
      await prisma.submission.update({
        where: { id: r.id },
        data: { compositeScore: comp },
      })
    }
    const ranked = await prisma.submission.findMany({
      where: { challengeId: ch.id, status: 'PUBLISHED', deletedAt: null },
      select: {
        id: true,
        compositeScore: true,
        rationaleScore: true,
        submittedAt: true,
        userId: true,
        testScore: true,
      },
    })
    const rankMap = assignRanks(
      ranked.map((r) => ({
        id: r.id,
        compositeScore: r.compositeScore ?? 0,
        rationaleScore: r.rationaleScore ?? 0,
        submittedAt: r.submittedAt ?? new Date(),
      })),
    )
    for (const r of ranked) {
      const fr = rankMap.get(r.id)
      if (fr != null) {
        await prisma.submission.update({
          where: { id: r.id },
          data: { preliminaryRank: fr, finalRank: fr },
        })
      }
    }
    const awardRows = ranked.map((r) => ({
      id: r.id,
      userId: r.userId,
      rank: rankMap.get(r.id) ?? 1,
      difficulty: ch.difficulty,
      submittedAt: r.submittedAt ?? submittedAt,
      testScore: r.testScore ?? 0,
      rationaleScore: r.rationaleScore ?? 0,
    }))
    await awardPreliminaryRep(
      prisma,
      awardRows,
      { id: ch.id, opensAt: ch.opensAt, category: ch.category },
      streakByUserId,
    )
  }

  for (const ch of slugToChallenge.values()) {
    const n = await prisma.submission.count({
      where: { challengeId: ch.id, deletedAt: null, status: 'PUBLISHED' },
    })
    await prisma.challenge.update({
      where: { id: ch.id },
      data: { submissionCount: n },
    })
  }
}

async function main() {
  const reset = process.argv.includes('--reset')
  if (reset) {
    console.info('seed:reset — wiping seed scope')
  }
  await wipeSeedScope()

  const adminIdHolder = { id: '' }
  await upsertAdmin(adminIdHolder)
  await upsertDemoUsers()
  await upsertChallenges(adminIdHolder.id)
  await seedSubmissionsAndRep()

  const lb = createLeaderboardService(prisma)
  await lb.recomputeGlobalRanks()

  console.info('Seed completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
