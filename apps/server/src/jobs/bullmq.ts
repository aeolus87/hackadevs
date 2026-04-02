import { Queue, Worker } from 'bullmq'
import type { ServerEnv } from '@hackadevs/config'
import { createRedisConnection } from '../config/redis.js'
import { runChallengeCloseJob } from './challengeClose.job.js'
import { runChallengePublishJob } from './challengePublish.job.js'
import { runVotingCloseJob } from './votingClose.job.js'
import { runRepDecayJob } from './repDecay.job.js'
import { runRankRecomputeJob } from './rankRecompute.job.js'
import { runChallengeGenerationJob } from './challengeGeneration.job.js'
import { runStreakCheckerJob } from './streakChecker.job.js'
import { runWeeklyDigestJob } from './weeklyDigest.job.js'
import { runStreakAtRiskJob } from './streakAtRisk.job.js'

const QUEUE = 'hackadevs'

export async function startBackgroundJobs(redisUrl: string, env: ServerEnv) {
  const connection = createRedisConnection(redisUrl)
  const queue = new Queue(QUEUE, { connection })

  await queue.add(
    'challenge-close',
    {},
    { repeat: { every: 300000 }, jobId: 'challenge-close-repeat' },
  )
  await queue.add('voting-close', {}, { repeat: { every: 300000 }, jobId: 'voting-close-repeat' })
  await queue.add(
    'challenge-publish',
    {},
    { repeat: { pattern: env.CHALLENGE_PUBLISH_CRON }, jobId: 'challenge-publish-cron' },
  )
  await queue.add(
    'challenge-generation',
    {},
    { repeat: { pattern: env.WEEKLY_CHALLENGE_CRON }, jobId: 'challenge-generation-cron' },
  )
  await queue.add(
    'rep-decay',
    {},
    { repeat: { pattern: env.REP_DECAY_CRON }, jobId: 'rep-decay-cron' },
  )
  await queue.add(
    'rank-recompute',
    {},
    { repeat: { pattern: env.RANK_RECOMPUTE_CRON }, jobId: 'rank-recompute-cron' },
  )
  await queue.add(
    'streak-check',
    {},
    { repeat: { pattern: env.STREAK_CHECK_CRON }, jobId: 'streak-check-cron' },
  )
  await queue.add(
    'weekly-digest',
    {},
    { repeat: { pattern: env.WEEKLY_DIGEST_CRON }, jobId: 'weekly-digest-cron' },
  )
  await queue.add(
    'streak-at-risk',
    {},
    { repeat: { pattern: env.STREAK_AT_RISK_CRON }, jobId: 'streak-at-risk-cron' },
  )

  const worker = new Worker(
    QUEUE,
    async (job) => {
      switch (job.name) {
        case 'challenge-close':
          await runChallengeCloseJob()
          break
        case 'voting-close':
          await runVotingCloseJob()
          break
        case 'challenge-publish':
          await runChallengePublishJob()
          break
        case 'challenge-generation':
          if (env.OPENAI_API_KEY) {
            await runChallengeGenerationJob(connection)
          }
          break
        case 'rep-decay':
          await runRepDecayJob()
          break
        case 'rank-recompute':
          await runRankRecomputeJob()
          break
        case 'streak-check':
          await runStreakCheckerJob()
          break
        case 'weekly-digest':
          await runWeeklyDigestJob(
            env.RESEND_API_KEY,
            env.RESEND_FROM ?? 'noreply@hackadevs.dev',
            env.FRONTEND_URL,
          )
          break
        case 'streak-at-risk':
          await runStreakAtRiskJob(
            env.RESEND_API_KEY,
            env.RESEND_FROM ?? 'noreply@hackadevs.dev',
            env.FRONTEND_URL,
          )
          break
        default:
          break
      }
    },
    { connection },
  )

  worker.on('failed', (job, err) => {
    console.error('Job failed', job?.name, err)
  })

  return { queue, worker, connection }
}
