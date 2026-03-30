export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[12px] border border-hd-border bg-hd-card p-4">
      <div className="mb-3 flex gap-2">
        <div className="h-5 w-16 rounded-full bg-hd-elevated" />
        <div className="h-5 flex-1 rounded bg-hd-elevated" />
      </div>
      <div className="mb-2 h-4 w-3/4 rounded bg-hd-elevated" />
      <div className="mb-2 h-4 w-full rounded bg-hd-elevated" />
      <div className="h-4 w-2/3 rounded bg-hd-elevated" />
    </div>
  )
}
