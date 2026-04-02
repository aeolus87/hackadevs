import { HdModal } from '@/components/ui/hd-modal'

type WithdrawRevisionModalProps = {
  open: boolean
  onClose: () => void
  closesAtLabel: string
  busy: boolean
  onConfirm: () => void
}

export function WithdrawRevisionModal({
  open,
  onClose,
  closesAtLabel,
  busy,
  onConfirm,
}: WithdrawRevisionModalProps) {
  return (
    <HdModal
      open={open}
      onClose={onClose}
      title="Withdraw your solution?"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-hd-border px-4 py-2 text-sm font-medium text-hd-text hover:bg-hd-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-full bg-hd-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Working…' : 'Withdraw and revise'}
          </button>
        </>
      }
    >
      <p className="text-sm text-hd-secondary">
        Your solution will be removed from the leaderboard. Rep for this challenge will be revoked.
        You can resubmit before the challenge closes on{' '}
        <span className="font-medium text-hd-text">{closesAtLabel}</span>.
      </p>
      <p className="mt-3 text-sm text-hd-amber">You cannot withdraw after the challenge closes.</p>
    </HdModal>
  )
}
