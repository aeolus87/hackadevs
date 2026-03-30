type StreakHeatmapProps = {
  days: boolean[]
}

export function StreakHeatmap({ days }: StreakHeatmapProps) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {days.map((on, i) => (
        <div
          key={i}
          className={`h-2.5 w-2.5 rounded-[2px] ${on ? 'bg-hd-emerald' : 'bg-hd-elevated'}`}
          title={on ? 'Submitted' : 'No submission'}
        />
      ))}
    </div>
  )
}
