import type { LeaderboardRow } from '@/types/hackadevs'
import { RepScore } from '@/components/rep-score'
import { categoryPillClass } from '@/utils/category-styles'
import { UserHoverCard } from '@/components/user-hover-card'

type LeaderboardTableProps = {
  rows: LeaderboardRow[]
  startRank: number
  highlightUsername?: string | null
}

function StreakFlame() {
  return (
    <svg
      className="mr-1 inline-block shrink-0 text-hd-amber"
      width={8}
      height={10}
      viewBox="0 0 8 10"
      fill="currentColor"
      aria-hidden
    >
      <path d="M4 0s1.2 1.4 1.2 2.8c0 .8-.4 1.4-1 1.8.2-.8.1-1.6-.4-2.2C2.8 4.2 2 5.6 2 7c0 1.5 1 2.7 2.3 3 .2-1.1.8-2 1.7-2.5C7.2 6.5 8 5.3 8 4c0-2-1.5-3.2-2.2-4C5.5 1.2 5 2.2 5 3.2 5 3.8 4.6 4.2 4 4.5 3.4 4.5 2.8 4.2 2.2 3.8 1.6 3.2 1.2 2.5.8 1.8.4 1.2 0 4 0z" />
    </svg>
  )
}

export function LeaderboardTable({ rows, startRank, highlightUsername }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto rounded-[12px] border border-hd-border">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-hd-border bg-hd-surface font-mono text-[11px] uppercase tracking-wide text-hd-muted">
            <th className="h-[52px] px-3 py-0 align-middle font-medium">Rank</th>
            <th className="h-[52px] px-3 py-0 align-middle font-medium">Dev</th>
            <th className="h-[52px] px-3 py-0 align-middle font-medium">Rep score</th>
            <th className="h-[52px] px-3 py-0 align-middle font-medium">Challenges solved</th>
            <th className="h-[52px] px-3 py-0 align-middle font-medium">Best category</th>
            <th className="h-[52px] px-3 py-0 align-middle font-medium">Streak</th>
            <th className="h-[52px] px-3 py-0 align-middle font-medium">Weekly delta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rank = startRank + i
            const isSelf = highlightUsername != null && row.username === highlightUsername
            const move = row.rankMovement
            const deltaLabel =
              row.weeklyDelta > 0
                ? `+${row.weeklyDelta} this week`
                : row.weeklyDelta === 0
                  ? '0 this week'
                  : `${row.weeklyDelta} this week`
            const declared = (row.selfDeclaredLevel ?? 'MID').toUpperCase()
            return (
              <tr
                key={row.username}
                className={`h-[52px] border-b border-hd-border transition-colors duration-150 ease-out last:border-0 hover:bg-hd-row-hover ${
                  isSelf ? 'bg-[rgba(99,102,241,0.07)]' : ''
                }`}
              >
                <td
                  className={`h-[52px] px-3 align-middle font-mono text-hd-secondary ${isSelf ? 'border-l-2 border-l-hd-indigo' : ''}`}
                >
                  <span className="tabular-nums text-hd-text">{rank}</span>
                  {move !== 0 && (
                    <span
                      className={`ml-1 text-xs ${move > 0 ? 'text-hd-emerald' : 'text-hd-rose'}`}
                    >
                      {move > 0 ? '↑' : '↓'}
                    </span>
                  )}
                </td>
                <td className="h-[52px] px-3 align-middle">
                  <div className="flex items-center gap-2">
                    <img
                      src={row.avatar}
                      alt=""
                      className="h-8 w-8 rounded-full"
                      width={32}
                      height={32}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <UserHoverCard user={row}>
                          <span className="truncate font-medium text-hd-text">
                            {row.displayName}
                          </span>
                        </UserHoverCard>
                        <span className="rounded-full border border-hd-border bg-hd-surface px-2 py-0.5 text-[10px] text-hd-muted">
                          {declared}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="h-[52px] px-3 align-middle font-mono font-medium tabular-nums">
                  <RepScore value={row.rep} />
                </td>
                <td className="h-[52px] px-3 align-middle font-mono text-hd-secondary tabular-nums">
                  {row.challengesSolved}
                </td>
                <td className="h-[52px] px-3 align-middle">
                  <span
                    className={`inline-flex max-w-full truncate rounded-full border px-2 py-0.5 font-mono text-[12px] font-medium leading-tight ${categoryPillClass(row.topCategory)}`}
                  >
                    {row.topCategory}
                  </span>
                </td>
                <td className="h-[52px] px-3 align-middle font-mono text-hd-amber tabular-nums">
                  <span className="inline-flex items-center">
                    <StreakFlame />
                    {row.streak}
                  </span>
                </td>
                <td className="h-[52px] max-w-[5rem] whitespace-nowrap px-3 align-middle font-mono text-xs">
                  {row.weeklyDelta > 0 && (
                    <span className="text-hd-emerald" title={deltaLabel}>
                      +{row.weeklyDelta}
                    </span>
                  )}
                  {row.weeklyDelta === 0 && (
                    <span className="text-hd-muted" title={deltaLabel}>
                      0
                    </span>
                  )}
                  {row.weeklyDelta < 0 && (
                    <span className="text-hd-rose" title={deltaLabel}>
                      {row.weeklyDelta}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
