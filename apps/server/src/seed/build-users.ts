import type { AvailabilityStatus, SelfDeclaredLevel } from '@prisma/client'
import { FIRST_NAMES, LAST_NAMES, TAGLINES } from './names.js'
import { mulberry32, pick, randInt, shuffleInPlace } from './rng.js'

export const NUM_SYNTHETIC_USERS = 78
export const SEED_RNG_ROOT = 0xfeedface

export type SyntheticUserSpec = {
  username: string
  displayName: string
  email: string
  tagline: string
  selfDeclaredLevel: SelfDeclaredLevel
  currentStreakDays: number
  availabilityStatus: AvailabilityStatus
  submissionSlugs: string[]
  testScores: number[]
  rationaleScores: number[]
}

const LEVELS: SelfDeclaredLevel[] = ['JUNIOR', 'MID', 'SENIOR']
const LEVEL_WEIGHTS = [0.28, 0.52, 0.2]

const AVAIL: AvailabilityStatus[] = [
  'UNSPECIFIED',
  'OPEN_TO_WORK',
  'EMPLOYED',
  'NOT_LOOKING',
  'FREELANCE_OPEN',
]

function pickLevel(rng: () => number): SelfDeclaredLevel {
  const x = rng()
  let acc = 0
  for (let i = 0; i < LEVELS.length; i++) {
    acc += LEVEL_WEIGHTS[i]!
    if (x <= acc) return LEVELS[i]!
  }
  return 'MID'
}

function pickAvail(rng: () => number): AvailabilityStatus {
  return pick(rng, AVAIL)
}

export function buildSyntheticUsers(challengeSlugs: readonly string[]): SyntheticUserSpec[] {
  const rng = mulberry32(SEED_RNG_ROOT)
  const slugPool = shuffleInPlace(rng, [...challengeSlugs])
  const out: SyntheticUserSpec[] = []

  for (let i = 0; i < NUM_SYNTHETIC_USERS; i++) {
    let first: string
    let last: string
    let username: string
    let email: string
    if (i === 0) {
      first = 'Alex'
      last = 'Chen'
      username = 'alex_chen'
      email = 'alex@seed.hackadevs.dev'
    } else {
      first = pick(rng, FIRST_NAMES)
      last = pick(rng, LAST_NAMES)
      username = `${first}_${last}_${i.toString(36)}`.toLowerCase()
      email = `${username}@seed.hackadevs.dev`
    }
    const displayName = `${first} ${last}`
    const tagline = pick(rng, TAGLINES)
    const selfDeclaredLevel = pickLevel(rng)
    const currentStreakDays = randInt(rng, 0, 42)
    const availabilityStatus = pickAvail(rng)

    const nSubs = randInt(rng, 2, 11)
    const shuffled = shuffleInPlace(rng, [...slugPool])
    const submissionSlugs = shuffled.slice(0, Math.min(nSubs, shuffled.length))

    const testScores: number[] = []
    const rationaleScores: number[] = []
    for (let j = 0; j < submissionSlugs.length; j++) {
      testScores.push(randInt(rng, 58, 100))
      rationaleScores.push(randInt(rng, 48, 96))
    }

    out.push({
      username,
      displayName,
      email,
      tagline,
      selfDeclaredLevel,
      currentStreakDays,
      availabilityStatus,
      submissionSlugs,
      testScores,
      rationaleScores,
    })
  }

  return out
}
