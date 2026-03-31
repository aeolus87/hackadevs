import { z } from 'zod'

const testCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isVisible: z.boolean(),
})

export const createChallengeSchema = z.object({
  title: z.string().min(1),
  problemStatement: z.string().min(1),
  constraints: z.array(z.string()).min(1),
  bonusObjective: z.string().optional(),
  tags: z.array(z.string()).min(1),
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
  difficulty: z.enum(['BEGINNER', 'MEDIUM', 'HARD', 'LEGENDARY']),
  weekTheme: z.string().min(1),
  opensAt: z.string().datetime(),
  closesAt: z.string().datetime(),
  companySource: z.string().optional(),
  testSuite: z.array(testCaseSchema).min(1),
})

export const updateChallengeSchema = createChallengeSchema.partial()

export const listChallengesSchema = z.object({
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
  category: createChallengeSchema.shape.category.optional(),
  difficulty: createChallengeSchema.shape.difficulty.optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>
export type ListChallengesQuery = z.infer<typeof listChallengesSchema>
