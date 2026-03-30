type InlineErrorProps = {
  message: string
  label?: string
  onRetry?: () => void
}

export function InlineError({ message, label = 'Try again', onRetry }: InlineErrorProps) {
  return (
    <div className="rounded-[12px] border border-hd-border border-l-4 border-l-hd-rose bg-hd-card p-4 text-sm text-hd-secondary">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
        >
          {label}
        </button>
      )}
    </div>
  )
}
