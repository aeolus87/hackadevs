import type { ReactNode } from 'react'

type HdModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  labelledBy?: string
}

export function HdModal({ open, onClose, title, children, footer, labelledBy }: HdModalProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby={labelledBy ?? 'hd-modal-title'}
        className="relative z-[1] w-full max-w-md rounded-xl border border-hd-border border-l-4 border-l-hd-indigo bg-hd-card p-5 shadow-hd-card sm:p-6"
      >
        <h2 id={labelledBy ?? 'hd-modal-title'} className="text-lg font-medium text-hd-text">
          {title}
        </h2>
        <div className="mt-4 text-sm text-hd-secondary">{children}</div>
        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  )
}
