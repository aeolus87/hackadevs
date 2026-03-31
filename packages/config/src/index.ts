import { z } from 'zod'

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(8).optional(),
  JUDGE0_API_URL: z.string().url().optional(),
  JUDGE0_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().optional(),
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_R2_BUCKET: z.string().optional(),
  CLOUDFLARE_R2_PUBLIC_URL: z.string().url().optional(),
  WEEKLY_CHALLENGE_CRON: z.string().default('0 0 * * 1'),
  CHALLENGE_PUBLISH_CRON: z.string().default('0 9 * * 1'),
  STREAK_CHECK_CRON: z.string().default('1 0 * * *'),
  REP_DECAY_CRON: z.string().default('0 2 * * 1'),
  RANK_RECOMPUTE_CRON: z.string().default('0 3 * * *'),
  WEEKLY_DIGEST_CRON: z.string().default('0 20 * * 0'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

function formatEnvIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : '(root)'
      return `  • ${path}: ${issue.message}`
    })
    .join('\n')
}

export function parseServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  const result = serverEnvSchema.safeParse(env)
  if (!result.success) {
    throw new Error(`Invalid server environment:\n${formatEnvIssues(result.error)}`)
  }
  return result.data
}
