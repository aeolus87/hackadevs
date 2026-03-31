import { useMemo, useState } from 'react'
import { ChallengeCard } from '@/components/challenge-card'
import { CategoryTabBar } from '@/components/category-tab-bar'
import { InlineError } from '@/components/inline-error'
import { SkeletonCard } from '@/components/skeleton-card'
import { useChallenges } from '@/hooks/challenges/useChallenges'
import { apiChallengeToUi } from '@/utils/map-api-challenge'
import type { Category } from '@/types/hackadevs-api.types'

const CATEGORY_ORDER: Category[] = [
  'FULLSTACK',
  'BACKEND',
  'FRONTEND',
  'SYSTEM_DESIGN',
  'SECURITY',
  'DATA_ENGINEERING',
  'ML_OPS',
  'DEVOPS',
]

const CATEGORY_TAB_LABEL: Record<Category, string> = {
  BACKEND: 'Backend',
  FRONTEND: 'Frontend',
  SYSTEM_DESIGN: 'System design',
  SECURITY: 'Security',
  DATA_ENGINEERING: 'Data engineering',
  ML_OPS: 'ML ops',
  DEVOPS: 'DevOps',
  FULLSTACK: 'Full stack',
}

export default function ChallengesPage() {
  const [category, setCategory] = useState<Category | 'ALL'>('ALL')

  const tabLabels = useMemo(
    () => ['All', ...CATEGORY_ORDER.map((c) => CATEGORY_TAB_LABEL[c])],
    [],
  )

  const tabValue = category === 'ALL' ? 'All' : CATEGORY_TAB_LABEL[category]

  const listParams = useMemo(
    () => ({
      page: 1,
      limit: 50 as const,
      status: 'ACTIVE' as const,
      ...(category !== 'ALL' ? { category } : {}),
    }),
    [category],
  )

  const { data: listData, loading, error, refetch } = useChallenges(listParams)
  const cards = useMemo(
    () => (listData?.data?.length ? listData.data.map((c) => apiChallengeToUi(c)) : []),
    [listData],
  )

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-medium text-hd-text">Challenge catalog</h1>
        <p className="mt-1 text-sm text-hd-secondary">
          Browse every active prompt by track. For streak, leaderboard, and curated picks, use{' '}
          <span className="text-hd-text">Home</span>.
        </p>
      </div>
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-hd-muted">
          Category
        </p>
        <CategoryTabBar
          tabs={tabLabels}
          value={tabValue}
          onChange={(v) => {
            if (v === 'All') {
              setCategory('ALL')
              return
            }
            const next = (Object.keys(CATEGORY_TAB_LABEL) as Category[]).find(
              (c) => CATEGORY_TAB_LABEL[c] === v,
            )
            setCategory(next ?? 'ALL')
          }}
        />
      </div>
      {error && (
        <div className="pt-2">
          <InlineError message={error} onRetry={() => void refetch()} />
        </div>
      )}
      <div className="space-y-4 pt-2">
        {loading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-[12px] bg-[rgba(255,255,255,0.04)] p-4">
              <SkeletonCard />
            </div>
          ))}
        {!loading && !error && cards.length === 0 && (
          <p className="text-sm text-hd-muted">No challenges in this category yet.</p>
        )}
        {cards.map((c) => (
          <ChallengeCard key={c.slug} challenge={c} />
        ))}
      </div>
    </div>
  )
}
