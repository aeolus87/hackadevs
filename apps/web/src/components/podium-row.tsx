import type { LeaderboardRow } from '@/types/hackadevs'
import { RepScore } from '@/components/rep-score'
import { categoryPillClass } from '@/utils/category-styles'

const medal = {
  1: { fill: '#F59E0B', label: '1' },
  2: { fill: '#A1A1AA', label: '2' },
  3: { fill: '#B45309', label: '3' },
} as const

function Medal({ rank }: { rank: 1 | 2 | 3 }) {
  const m = medal[rank]
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] font-medium text-hd-page"
      style={{ backgroundColor: m.fill }}
    >
      {m.label}
    </div>
  )
}

export function PodiumRow({ rows }: { rows: [LeaderboardRow, LeaderboardRow, LeaderboardRow] }) {
  const [second, first, third] = rows
  const cards: {
    row: LeaderboardRow
    rank: 1 | 2 | 3
    tall?: boolean
    order: string
  }[] = [
    { row: second, rank: 2, order: 'order-2 sm:order-1' },
    { row: first, rank: 1, tall: true, order: 'order-1 sm:order-2' },
    { row: third, rank: 3, order: 'order-3 sm:order-3' },
  ]

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-center">
      {cards.map(({ row, rank, tall, order }) => (
        <div
          key={row.username}
          className={`${order} relative w-full shrink-0 rounded-[12px] border bg-hd-card p-4 pt-11 sm:max-w-[220px] sm:flex-1 ${
            tall ? 'border-2 border-hd-indigo sm:pb-8' : 'border-hd-border'
          }`}
        >
          <div className="absolute left-3 top-3">
            <Medal rank={rank} />
          </div>
          <div className="absolute right-3 top-3 max-w-[calc(100%-5rem)]">
            <span
              className={`inline-flex max-w-full truncate rounded-full border px-2 py-0.5 font-mono text-[12px] font-medium leading-tight ${categoryPillClass(row.topCategory)}`}
            >
              {row.topCategory}
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <img
              src={row.avatar}
              alt=""
              className="mb-2 h-12 w-12 rounded-full"
              width={48}
              height={48}
            />
            <p className="font-medium text-hd-text">{row.displayName}</p>
            <p className="mb-2 font-mono text-xs text-hd-muted">@{row.username}</p>
            <RepScore value={row.rep} className="text-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
