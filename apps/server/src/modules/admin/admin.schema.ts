import { z } from 'zod'

export const moderationPatchSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED', 'WARNED', 'BANNED', 'ESCALATED', 'APPEALED']),
  reason: z.string().min(1),
  note: z.string().optional(),
})

export const generateChallengeSchema = z.object({
  theme: z.string().min(1),
  category: z.enum([
    'BACKEND',
    'FRONTEND',
    'SYSTEM_DESIGN',
    'SECURITY',
    'DATA_ENGINEERING',
    'ML_OPS',
    'DEVOPS',
    'FULLSTACK',
  ]),
})

const adminTestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isVisible: z.boolean(),
})

export const adminPatchChallengeSchema = z
  .object({
    title: z.string().min(1).optional(),
    problemStatement: z.string().min(1).optional(),
    constraints: z.array(z.string()).min(1).optional(),
    bonusObjective: z.string().nullable().optional(),
    tags: z.array(z.string()).min(1).optional(),
    category: generateChallengeSchema.shape.category.optional(),
    difficulty: z.enum(['BEGINNER', 'MEDIUM', 'HARD', 'LEGENDARY']).optional(),
    weekTheme: z.string().min(1).optional(),
    opensAt: z.string().datetime().optional(),
    closesAt: z.string().datetime().optional(),
    companySource: z.string().nullable().optional(),
    testSuite: z.array(adminTestCaseSchema).optional(),
    companyAttributionOptIn: z.boolean().optional(),
    status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
  })
  .strict()

export type ModerationPatchBody = z.infer<typeof moderationPatchSchema>
export type GenerateChallengeBody = z.infer<typeof generateChallengeSchema>
export type AdminPatchChallengeBody = z.infer<typeof adminPatchChallengeSchema>
