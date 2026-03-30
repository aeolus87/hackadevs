type CategoryTabBarProps = {
  tabs: string[]
  value: string
  onChange: (v: string) => void
}

export function CategoryTabBar({ tabs, value, onChange }: CategoryTabBarProps) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto pb-1 md:mx-0 md:flex-wrap md:overflow-visible">
      {tabs.map((tab) => {
        const active = tab === value
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out ${
              active
                ? 'bg-hd-indigo text-white'
                : 'bg-transparent text-hd-muted hover:text-hd-secondary'
            }`}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}
