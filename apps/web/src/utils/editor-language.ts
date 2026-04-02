import type { Language } from '@/types/hackadevs-api.types'

export const SUBMIT_FLOW_LANGUAGES = [
  'TS',
  'JS',
  'PYTHON',
  'RUST',
] as const satisfies readonly Language[]

export type SubmitFlowLanguage = (typeof SUBMIT_FLOW_LANGUAGES)[number]

export function isSubmitFlowLanguage(l: Language): l is SubmitFlowLanguage {
  return (SUBMIT_FLOW_LANGUAGES as readonly string[]).includes(l)
}

export function normalizeSubmissionLanguage(l: Language | undefined | null): SubmitFlowLanguage {
  if (l && isSubmitFlowLanguage(l)) return l
  return 'TS'
}

export function languageToHighlightId(lang: SubmitFlowLanguage): 'ts' | 'js' | 'py' | 'rs' {
  if (lang === 'TS') return 'ts'
  if (lang === 'JS') return 'js'
  if (lang === 'PYTHON') return 'py'
  return 'rs'
}
