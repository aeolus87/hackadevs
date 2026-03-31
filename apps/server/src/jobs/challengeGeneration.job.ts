import type { Categories } from '@prisma/client'
import type { Redis } from 'ioredis'
import { prisma } from '../lib/prisma.js'
import { generateChallenge } from '../integrations/openai.client.js'
import { slugify } from '../utils/slugify.js'

const WEEKLY_THEMES = [
  'resilience patterns',
  'query optimisation',
  'API design',
  'concurrency',
  'security hardening',
  'caching strategies',
  'observability',
  'data pipelines',
  'distributed consensus',
  'rate limiting',
]

const CATEGORIES: Categories[] = [
  'BACKEND',
  'FRONTEND',
  'SYSTEM_DESIGN',
  'SECURITY',
  'DATA_ENGINEERING',
  'ML_OPS',
  'DEVOPS',
  'FULLSTACK',
]

function nextMondayWindowUtc(from: Date) {
  const d = new Date(from)
  const dow = d.getUTCDay()
  const daysUntilMonday = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow
  d.setUTCDate(d.getUTCDate() + daysUntilMonday)
  d.setUTCHours(9, 0, 0, 0)
  const opensAt = new Date(d)
  const closesAt = new Date(opensAt)
  closesAt.setUTCDate(closesAt.getUTCDate() + 7)
  closesAt.setUTCHours(8, 59, 0, 0)
  return { opensAt, closesAt }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function runChallengeGenerationJob(redis: Redis | null = null) {
  let nextIdx = 0
  if (redis) {
    const idx = await redis.get('hackadevs:theme_index')
    nextIdx = ((parseInt(idx ?? '0', 10) || 0) + 1) % WEEKLY_THEMES.length
    await redis.set('hackadevs:theme_index', String(nextIdx))
  } else {
    const day = Math.floor(Date.now() / 86400000)
    nextIdx = Math.floor(day / 7) % WEEKLY_THEMES.length
  }
  const theme = WEEKLY_THEMES[nextIdx]
  const { opensAt, closesAt } = nextMondayWindowUtc(new Date())
  const placeholderTests = [{ input: '', expectedOutput: '', isVisible: true }]
  for (const category of CATEGORIES) {
    const gen = await generateChallenge(theme, category)
    await prisma.challenge.create({
      data: {
        slug: slugify(gen.title),
        title: gen.title,
        problemStatement: gen.problemStatement,
        constraints: [...gen.constraints],
        bonusObjective: gen.bonusObjective,
        exampleInput: gen.exampleInput,
        exampleOutput: gen.exampleOutput,
        tags: gen.tags,
        category,
        difficulty: gen.estimatedDifficulty,
        weekTheme: theme,
        opensAt,
        closesAt,
        testSuite: placeholderTests,
        status: 'SCHEDULED',
      },
    })
    await sleep(3000)
  }
}
