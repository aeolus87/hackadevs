type TagPillProps = {
  children: string
  className?: string
}

export function TagPill({ children, className = '' }: TagPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-hd-border bg-hd-surface px-2 py-0.5 font-mono text-[12px] text-hd-secondary ${className}`}
    >
      {children}
    </span>
  )
}
