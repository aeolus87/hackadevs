import { z } from 'zod'
import {
  adminPatchChallengeSchema,
  generateChallengeCategorySchema,
  type AdminPatchChallengeBody,
} from '@hackadevs/core'

export const moderationPatchSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED', 'WARNED', 'BANNED', 'ESCALATED', 'APPEALED']),
  reason: z.string().min(1),
  note: z.string().optional(),
})

export const generateChallengeSchema = z.object({
  theme: z.string().min(1),
  category: generateChallengeCategorySchema,
})

export { adminPatchChallengeSchema, type AdminPatchChallengeBody }

export type ModerationPatchBody = z.infer<typeof moderationPatchSchema>
export type GenerateChallengeBody = z.infer<typeof generateChallengeSchema>
