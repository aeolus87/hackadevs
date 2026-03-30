import type { Category } from '@/types/hackadevs-api.types'
import type { ChallengeCategory } from '@/types/hackadevs'

const API_TO_UI: Record<Category, ChallengeCategory> = {
  BACKEND: 'Backend',
  FRONTEND: 'Frontend',
  SYSTEM_DESIGN: 'System Design',
  SECURITY: 'Security',
  DATA_ENGINEERING: 'Data Engineering',
  ML_OPS: 'ML Ops',
  DEVOPS: 'DevOps',
  FULLSTACK: 'Backend',
}

const UI_LABEL_TO_API: Record<string, Category> = {
  Backend: 'BACKEND',
  Frontend: 'FRONTEND',
  'System Design': 'SYSTEM_DESIGN',
  Security: 'SECURITY',
  'Data Engineering': 'DATA_ENGINEERING',
  'ML Ops': 'ML_OPS',
  DevOps: 'DEVOPS',
}

export function apiCategoryToUi(c: Category): ChallengeCategory {
  return API_TO_UI[c] ?? 'Backend'
}

export function uiTabLabelToApiCategory(label: string): Category | undefined {
  return UI_LABEL_TO_API[label]
}
