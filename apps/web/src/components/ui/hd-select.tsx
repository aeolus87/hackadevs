import type { CSSProperties } from 'react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type HdSelectOption = { value: string; label: string }

type HdSelectProps = {
  value: string
  onChange: (value: string) => void
  options: HdSelectOption[]
  size?: 'sm' | 'md'
  className?: string
  buttonClassName?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <span
      className={`pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center text-hd-muted transition-transform duration-200 ease-out ${
        open ? '-rotate-180' : ''
      }`}
      aria-hidden
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="block h-4 w-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 7.5l5 5 5-5" />
      </svg>
    </span>
  )
}

export function HdSelect({
  value,
  onChange,
  options,
  size = 'md',
  className = '',
  buttonClassName = '',
  disabled = false,
  id,
  'aria-label': ariaLabel,
}: HdSelectProps) {
  const autoId = useId()
  const listId = `${autoId}-list`
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  const selected = options.find((o) => o.value === value) ?? options[0]

  const sizeClasses =
    size === 'sm'
      ? 'min-h-[2.25rem] px-2 py-1.5 text-xs font-mono leading-normal'
      : 'min-h-[2.75rem] px-3 py-2 text-sm leading-normal'

  const optionSizeClass = size === 'sm' ? 'text-xs font-mono' : 'text-sm'

  const updatePosition = () => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gap = 4
    setPanelStyle({
      position: 'fixed',
      left: r.left,
      top: r.bottom + gap,
      width: r.width,
      zIndex: 10000,
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, value, options.length])

  useEffect(() => {
    if (!open) return
    const onScroll = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const baseBtn =
    'flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-hd-border bg-hd-surface text-left text-hd-text shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-[border-color,box-shadow] duration-150 ease-out hover:border-hd-border-hover focus:border-hd-indigo/35 focus:outline-none focus:ring-2 focus:ring-hd-indigo/15 disabled:cursor-not-allowed disabled:opacity-40'

  const panel = open ? (
    <ul
      ref={panelRef}
      id={listId}
      role="listbox"
      className="max-h-60 overflow-auto rounded-lg border border-hd-border bg-hd-elevated py-1 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.65)]"
      style={panelStyle}
    >
      {options.map((o) => {
        const isSel = o.value === value
        return (
          <li key={o.value} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={isSel}
              className={`flex w-full px-3 py-2 text-left transition-colors duration-150 ${optionSizeClass} ${
                isSel
                  ? 'bg-hd-indigo-surface text-hd-indigo-tint'
                  : 'text-hd-text hover:bg-hd-hover'
              }`}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
            >
              {o.label}
            </button>
          </li>
        )
      })}
    </ul>
  ) : null

  return (
    <div className={`relative w-full min-w-0 ${className}`}>
      <button
        ref={btnRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        className={`${baseBtn} ${sizeClasses} ${buttonClassName}`}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? '—'}</span>
        <ChevronIcon open={open} />
      </button>
      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </div>
  )
}
