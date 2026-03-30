import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type ToastKind = 'info' | 'success' | 'error'

type Toast = {
  id: string
  message: string
  kind: ToastKind
}

type ToastContextValue = {
  push: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const border: Record<ToastKind, string> = {
  info: 'border-l-hd-indigo',
  success: 'border-l-hd-emerald',
  error: 'border-l-hd-rose',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, message, kind }])
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 4000)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border border-hd-border border-l-4 bg-hd-elevated px-4 py-3 text-sm text-hd-text shadow-[var(--shadow-hd-card)] transition-[opacity,transform] duration-200 ease-out ${border[t.kind]}`}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast requires ToastProvider')
  return ctx
}
