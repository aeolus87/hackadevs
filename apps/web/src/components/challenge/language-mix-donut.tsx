const LANG_COLORS: Record<string, string> = {
  TS: '#6366f1',
  JS: '#fbbf24',
  PYTHON: '#34d399',
  GO: '#2dd4bf',
  RUST: '#fb7185',
  JAVA: '#60a5fa',
  CPP: '#94a3b8',
  CSHARP: '#a78bfa',
  RUBY: '#f472b6',
}

function colorFor(lang: string): string {
  return LANG_COLORS[lang] ?? '#94a3b8'
}

type Slice = { label: string; percent: number; color: string }

export function LanguageMixDonut({
  slices,
  totalLabel,
  loading,
}: {
  slices: Slice[]
  totalLabel: string
  loading?: boolean
}) {
  const size = 120
  const stroke = 18
  const r = (size - stroke) / 2
  const c = size / 2
  const circumference = 2 * Math.PI * r
  if (loading) {
    return (
      <div
        className="mx-auto h-[120px] w-[120px] animate-pulse rounded-full bg-[rgba(255,255,255,0.06)]"
        aria-hidden
      />
    )
  }
  if (!slices.length) return null
  let acc = 0
  const arcs = slices.map((s) => {
    const len = (s.percent / 100) * circumference
    const dasharray = `${len} ${circumference}`
    const dashoffset = -acc
    acc += len
    return { dasharray, dashoffset, color: s.color, key: s.label }
  })
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={a.dasharray}
              strokeDashoffset={a.dashoffset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-lg font-medium text-hd-text">{totalLabel}</span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-hd-muted">
            solutions
          </span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2 text-[13px]">
            <span className="flex min-w-0 items-center gap-2 text-hd-secondary">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate font-mono">{s.label}</span>
            </span>
            <span className="shrink-0 font-mono text-hd-muted">{s.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function statsToDonutSlices(
  distribution: { language: string; count: number; percentage: number }[],
): Slice[] {
  return distribution.map((d) => ({
    label: d.language,
    percent: d.percentage,
    color: colorFor(d.language),
  }))
}
