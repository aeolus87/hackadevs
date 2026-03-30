type Slice = { label: string; percent: number; color: string }

export function RatingDonut({ slices }: { slices: Slice[] }) {
  const r = 36
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex items-center gap-4">
      <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(31 31 37)" strokeWidth="14" />
        {slices.map((s) => {
          const dash = (s.percent / 100) * c
          const circle = (
            <circle
              key={s.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          )
          offset += dash
          return circle
        })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2 text-hd-secondary">
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
            <span className="font-mono tabular-nums text-hd-text">{s.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
