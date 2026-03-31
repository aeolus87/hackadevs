import type { AvailabilityStatusUi } from '@/types/hackadevs'

export function availabilityLabel(status: AvailabilityStatusUi | undefined): string | null {
  switch (status) {
    case 'OPEN_TO_WORK':
      return 'Open to work'
    case 'EMPLOYED':
      return 'Employed'
    case 'NOT_LOOKING':
      return 'Not looking'
    case 'FREELANCE_OPEN':
      return 'Open to freelance'
    default:
      return null
  }
}
