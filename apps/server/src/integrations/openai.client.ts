import OpenAI from 'openai'
import { z } from 'zod'
import type { Categories, ChallengeDifficulty } from '@prisma/client'

const GENERATION_MODEL = 'gpt-4o'
const SCORING_MODEL = 'gpt-4o-mini'

const ChallengeOutputSchema = z.object({
  title: z.string().min(10).max(120),
  problemStatement: z.string().min(100),
  constraints: z.array(z.string()).length(3),
  bonusObjective: z.string(),
  exampleInput: z.string(),
  exampleOutput: z.string(),
  tags: z.array(z.string()).min(3).max(5),
  estimatedDifficulty: z.enum(['BEGINNER', 'MEDIUM', 'HARD', 'LEGENDARY']),
})

const RationaleOutputSchema = z.object({
  clarity: z.number().int().min(0).max(25),
  depth: z.number().int().min(0).max(25),
  honesty: z.number().int().min(0).max(25),
  scalability: z.number().int().min(0).max(25),
  summary: z.string().max(200),
  flags: z.array(z.string()),
})

const FollowUpOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        prompt: z.string().min(20).max(600),
      }),
    )
    .length(2),
})

const VerificationScoreSchema = z.object({
  score: z.number(),
  feedback: z.string(),
})

export type FollowUpQuestionItem = { id: string; prompt: string }

export type ChallengeGenerationResult = z.infer<typeof ChallengeOutputSchema> & {
  estimatedDifficulty: ChallengeDifficulty
}

export type RationaleScoreResult = z.infer<typeof RationaleOutputSchema>

const FALLBACK_SCORE: RationaleScoreResult = {
  clarity: 0,
  depth: 0,
  honesty: 0,
  scalability: 0,
  summary: 'scoring_failed',
  flags: ['score_failed'],
}

const FALLBACK_FOLLOWUP: FollowUpQuestionItem[] = [
  {
    id: 'q1',
    prompt:
      'Point to the part of your code that enforces the main correctness constraint from the problem, and explain in one or two sentences why it cannot produce an invalid result for valid inputs.',
  },
  {
    id: 'q2',
    prompt:
      'If the input size grew by roughly 1000×, what would become the first bottleneck in your solution, and which function or block would you change first?',
  },
]

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

export async function generateChallenge(
  theme: string,
  category: Categories,
): Promise<ChallengeGenerationResult> {
  const client = getOpenAI()
  if (!client) {
    throw Object.assign(new Error('OpenAI not configured'), { statusCode: 503 })
  }
  const label = category.replaceAll('_', ' ').toLowerCase()
  const response = await client.chat.completions.create({
    model: GENERATION_MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content:
          'You are a staff engineer at a top-tier tech company. Create realistic, production-grade engineering challenges. Return only valid JSON.',
      },
      {
        role: 'user',
        content: `Create a senior-level engineering challenge.
Theme: ${theme}
Category: ${label}

Requirements:
- Solvable in 2-4 hours by an experienced engineer
- No single correct answer — architectural judgment and tradeoffs matter
- Based on a realistic production scenario with real constraints and numbers
- Must challenge the engineer to think about failure modes and scale

Return JSON with exactly these fields:
{
  "title": "punchy, specific title (not generic)",
  "problemStatement": "detailed problem description with context, at least 200 words",
  "constraints": ["constraint 1", "constraint 2", "constraint 3"],
  "bonusObjective": "significantly harder optional extension",
  "exampleInput": "concrete example input",
  "exampleOutput": "what a good solution produces for that input",
  "tags": ["tag1", "tag2", "tag3"],
  "estimatedDifficulty": "BEGINNER|MEDIUM|HARD|LEGENDARY"
}`,
      },
    ],
  })
  const raw = response.choices[0]?.message?.content
  if (!raw) throw new Error('Empty OpenAI response')
  const parsed = JSON.parse(raw) as unknown
  const out = ChallengeOutputSchema.parse(parsed)
  return out as ChallengeGenerationResult
}

export async function scoreRationale(params: {
  approach: string
  tradeoffs: string
  scale: string
  challengeTitle: string
}): Promise<RationaleScoreResult> {
  const client = getOpenAI()
  if (!client) return FALLBACK_SCORE
  try {
    const response = await client.chat.completions.create({
      model: SCORING_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a staff engineer reviewing solution rationales. Be honest and precise. Return only valid JSON.',
        },
        {
          role: 'user',
          content: `Score this solution rationale for: "${params.challengeTitle}"

APPROACH:
${params.approach}

TRADEOFFS:
${params.tradeoffs}

SCALE CONSIDERATIONS:
${params.scale}

Score each dimension 0-25 (total max 100):
- clarity: Is the approach explained precisely without empty jargon?
- depth: Does the author show genuine understanding of the domain?
- honesty: Are real tradeoffs acknowledged with actual alternatives considered?
- scalability: Is the scale analysis specific with real numbers, not generic?

Check for these flags (include in flags[] array if true):
- "vague_tradeoffs": tradeoffs section names no concrete alternatives or numbers
- "no_concrete_numbers": no metrics, latencies, throughputs, or quantities anywhere in all three sections

Return JSON:
{
  "clarity": int,
  "depth": int,
  "honesty": int,
  "scalability": int,
  "summary": "one sentence summary of the overall quality",
  "flags": []
}`,
        },
      ],
    })
    const text = response.choices[0]?.message?.content
    if (!text) return FALLBACK_SCORE
    return RationaleOutputSchema.parse(JSON.parse(text))
  } catch {
    return FALLBACK_SCORE
  }
}

export async function generateFollowUpQuestions(params: {
  code: string
  language: string
  challengeTitle: string
  rationaleSummary: string
}): Promise<{ questions: FollowUpQuestionItem[] }> {
  const client = getOpenAI()
  const truncated = params.code.slice(0, 12000)
  if (!client) {
    return { questions: FALLBACK_FOLLOWUP }
  }
  try {
    const response = await client.chat.completions.create({
      model: SCORING_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.35,
      messages: [
        {
          role: 'system',
          content:
            'You write exactly two verification questions for a coding submission. Each question must reference concrete structures, algorithms, or complexity tradeoffs suggested by the submitted code—not generic prompts like "explain your approach". Someone who genuinely wrote the code can answer without re-reading documentation. Return only valid JSON.',
        },
        {
          role: 'user',
          content: `Challenge title: ${params.challengeTitle}
Language: ${params.language}
Rationale summary: ${params.rationaleSummary || '(none)'}

Submitted code:
\`\`\`
${truncated}
\`\`\`

Return JSON: { "questions": [ { "id": "q1", "prompt": "..." }, { "id": "q2", "prompt": "..." } ] }
Use ids "q1" and "q2". Each prompt under 600 characters.`,
        },
      ],
    })
    const text = response.choices[0]?.message?.content
    if (!text) return { questions: FALLBACK_FOLLOWUP }
    const parsed = JSON.parse(text) as unknown
    const out = FollowUpOutputSchema.parse(parsed)
    return { questions: out.questions }
  } catch {
    return { questions: FALLBACK_FOLLOWUP }
  }
}

export type VerificationScoreOutcome =
  | { kind: 'ok'; score: number; feedback: string }
  | { kind: 'unavailable'; feedback: string }

export async function scoreVerificationAnswers(params: {
  questions: [string, string]
  answers: [string, string]
  code: string
}): Promise<VerificationScoreOutcome> {
  const client = getOpenAI()
  const truncated = params.code.slice(0, 12000)
  if (!client) {
    return { kind: 'unavailable', feedback: 'verification_unavailable' }
  }
  try {
    const response = await client.chat.completions.create({
      model: SCORING_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'You check whether a developer understands their own code. Be strict but fair. Return only valid JSON.',
        },
        {
          role: 'user',
          content: `Code:
\`\`\`
${truncated}
\`\`\`

Q1: ${params.questions[0]}
A1: ${params.answers[0]}

Q2: ${params.questions[1]}
A2: ${params.answers[1]}

Score the answers 0-100. Passing means the answers show genuine understanding of THIS specific code — not generic algorithm knowledge. Vague answers score below 60.

Return JSON: { "score": number, "feedback": string }`,
        },
      ],
    })
    const text = response.choices[0]?.message?.content
    if (!text) return { kind: 'ok', score: 0, feedback: 'empty_response' }
    const parsed = VerificationScoreSchema.parse(JSON.parse(text))
    return { kind: 'ok', score: parsed.score, feedback: parsed.feedback }
  } catch {
    return { kind: 'ok', score: 0, feedback: 'scoring_failed' }
  }
}
