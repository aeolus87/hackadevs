type HackaDevsMarkProps = {
  className?: string
}

export function HackaDevsMark({ className }: HackaDevsMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 10V5h5M14 5h5v5M19 14v5h-5M10 19H5v-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
