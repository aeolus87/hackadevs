import { z } from 'zod'

export const globalSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  limitChallenges: z.coerce.number().int().min(1).max(10).optional().default(5),
  limitUsers: z.coerce.number().int().min(1).max(10).optional().default(5),
})

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>
