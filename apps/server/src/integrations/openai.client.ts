import OpenAI from 'openai'
import { z } from 'zod'

const rationaleSchema = z.object({
  clarity: z.number().min(0).max(100),
  depth: z.number().min(0).max(100),
  honesty: z.number().min(0).max(100),
  scalability: z.number().min(0).max(100),
  summary: z.string(),
  flags: z.array(z.string()),
})

export type RationaleScoreResult = z.infer<typeof rationaleSchema> & {
  rationaleScore: number
}

export function createOpenAIClient(apiKey: string) {
  const client = new OpenAI({ apiKey })

  async function scoreRationale(
    approach: string,
    tradeoffs: string,
    scale: string,
    model: string,
  ): Promise<RationaleScoreResult | null> {
    const userContent = `Approach:\n${approach}\n\nTradeoffs:\n${tradeoffs}\n\nAt scale:\n${scale}`
    const parse = async () => {
      const res = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You grade engineering rationale. Return JSON only: {clarity,depth,honesty,scalability} each 0-100, summary string, flags string[] (e.g. likely_ai_generated, vague_tradeoffs). honesty must penalize generic fluff without concrete metrics or decisions.',
          },
          { role: 'user', content: userContent },
        ],
      })
      const text = res.choices[0]?.message?.content
      if (!text) return null
      const raw = JSON.parse(text) as unknown
      return rationaleSchema.safeParse(raw)
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const parsed = await parse()
        if (!parsed || !parsed.success) continue
        const v = parsed.data
        const rationaleScore = Math.round((v.clarity + v.depth + v.honesty + v.scalability) / 4)
        const out: RationaleScoreResult = {
          clarity: v.clarity,
          depth: v.depth,
          honesty: v.honesty,
          scalability: v.scalability,
          summary: v.summary,
          flags: v.flags,
          rationaleScore,
        }
        return out
      } catch {
        /* retry */
      }
    }
    return null
  }

  async function generateChallengeJson(prompt: string, model: string): Promise<unknown> {
    const res = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You produce challenge specs as JSON: title, problemStatement, constraints[], bonusObjective?, tags[], category, difficulty, weekTheme, testSuite: [{input,expectedOutput,isVisible}].',
        },
        { role: 'user', content: prompt },
      ],
    })
    const text = res.choices[0]?.message?.content
    if (!text) throw new Error('Empty OpenAI response')
    return JSON.parse(text) as unknown
  }

  return { scoreRationale, generateChallengeJson }
}
