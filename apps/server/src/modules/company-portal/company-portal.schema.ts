import { z } from 'zod'

export const registerPortalSchema = z.object({
  companyName: z.string().min(1),
  domainEmail: z.string().email(),
  linkedinUrl: z.string().url().optional(),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
})

export const submitChallengeSchema = z.object({
  rawProblem: z.string().min(1),
})

export type RegisterPortalBody = z.infer<typeof registerPortalSchema>
export type SubmitChallengeBody = z.infer<typeof submitChallengeSchema>
