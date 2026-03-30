import { z } from 'zod'

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().url().optional(),
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
