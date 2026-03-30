type RepScoreProps = {
  value: number
  className?: string
}

export function RepScore({ value, className = '' }: RepScoreProps) {
  return (
    <span className={`font-mono text-hd-text font-medium tabular-nums ${className}`}>
      {value.toLocaleString()}
    </span>
  )
}
