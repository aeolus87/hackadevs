import { z } from 'zod'

export const castVoteSchema = z.object({
  submissionId: z.string().min(1),
  value: z.enum(['UP', 'DOWN']),
})

export type CastVoteBody = z.infer<typeof castVoteSchema>
