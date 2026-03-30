export type RationaleParts = {
  approach: string
  tradeoffs: string
  scale: string
}

type RationaleInputProps = {
  parts: RationaleParts
  onChange: (parts: RationaleParts) => void
  minChars: number
}

function totalLen(p: RationaleParts): number {
  return `${p.approach}\n${p.tradeoffs}\n${p.scale}`.trim().length
}

export function RationaleInput({ parts, onChange, minChars }: RationaleInputProps) {
  const n = totalLen(parts)
  const ok = n >= minChars

  const set = (key: keyof RationaleParts, value: string) => {
    onChange({ ...parts, [key]: value })
  }

  const fieldClass =
    'min-h-[72px] w-full resize-y rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted focus:border-hd-border-hover focus:outline-none'

  return (
    <div className="rounded-[12px] border border-hd-border bg-hd-card p-4">
      <h3 className="mb-4 text-sm font-medium text-hd-text">Your rationale</h3>
      <div className="space-y-0">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-hd-muted">
            approach
          </label>
          <textarea
            value={parts.approach}
            onChange={(e) => set('approach', e.target.value)}
            rows={3}
            placeholder="Concrete steps, interfaces, and data flow…"
            className={fieldClass}
          />
        </div>
        <hr
          className="my-3 border-0 border-t border-[rgba(255,255,255,0.08)]"
          style={{ borderTopWidth: 0.5 }}
        />
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-hd-muted">
            tradeoffs
          </label>
          <textarea
            value={parts.tradeoffs}
            onChange={(e) => set('tradeoffs', e.target.value)}
            rows={3}
            placeholder="Costs, risks, and what you rejected…"
            className={fieldClass}
          />
        </div>
        <hr
          className="my-3 border-0 border-t border-[rgba(255,255,255,0.08)]"
          style={{ borderTopWidth: 0.5 }}
        />
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-hd-muted">
            at 10x scale
          </label>
          <textarea
            value={parts.scale}
            onChange={(e) => set('scale', e.target.value)}
            rows={3}
            placeholder="Sharding, queues, teams, observability…"
            className={fieldClass}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end border-t border-hd-border pt-3">
        <span className={`font-mono text-xs ${ok ? 'text-hd-emerald' : 'text-hd-muted'}`}>
          {n} / min {minChars}
        </span>
      </div>
    </div>
  )
}
