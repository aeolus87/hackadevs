import type { ChallengeCategory } from '@/types/hackadevs'

const order: ChallengeCategory[] = [
  'Backend',
  'Frontend',
  'System Design',
  'Security',
  'Data Engineering',
  'ML Ops',
  'DevOps',
]

const barColor: Record<ChallengeCategory, string> = {
  Backend: 'bg-hd-indigo',
  Frontend: 'bg-hd-amber',
  'System Design': 'bg-hd-emerald',
  Security: 'bg-hd-rose',
  'Data Engineering': 'bg-hd-indigo-hover',
  'ML Ops': 'bg-hd-secondary',
  DevOps: 'bg-hd-indigo',
}

type SkillBarChartProps = {
  skills: Partial<Record<ChallengeCategory, number>>
  categoryRanks?: Partial<Record<ChallengeCategory, number>>
}

export function SkillBarChart({ skills, categoryRanks }: SkillBarChartProps) {
  return (
    <div className="space-y-3">
      {order.map((cat) => {
        const pct = skills[cat] ?? 0
        const rank = categoryRanks?.[cat]
        return (
          <div key={cat}>
            <div className="mb-1">
              <span className="text-[13px] font-normal text-hd-text">{cat}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-[8px] bg-hd-elevated">
              <div
                className={`h-full rounded-[8px] ${barColor[cat]} transition-[width] duration-200 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 flex justify-end gap-3">
              {rank != null && (
                <span className="font-mono text-[11px] text-hd-indigo">
                  {cat} #{rank}
                </span>
              )}
              <span className="font-mono text-[12px] tabular-nums text-hd-muted">{pct}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
