import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg rounded-[12px] border border-hd-border bg-hd-card p-8 text-center">
      <h1 className="text-xl font-medium text-hd-text">Page not found</h1>
      <p className="mt-2 text-sm text-hd-secondary">
        The URL may be wrong or the resource was removed.
      </p>
      <Link
        to="/feed"
        className="mt-6 inline-block text-sm font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
      >
        Back to feed
      </Link>
    </div>
  )
}
