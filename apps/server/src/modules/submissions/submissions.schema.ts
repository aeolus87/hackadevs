import { z } from 'zod'

export const saveDraftSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().min(1),
  language: z.enum(['JS', 'TS', 'PYTHON', 'GO', 'RUST', 'JAVA', 'CPP', 'CSHARP', 'RUBY']),
  rationaleApproach: z.string().default(''),
  rationaleTradeoffs: z.string().default(''),
  rationaleScale: z.string().default(''),
  selfTags: z.array(z.string()).default([]),
  selfDifficultyRating: z.number().int().min(1).max(5),
})

export type SaveDraftBody = z.infer<typeof saveDraftSchema>
