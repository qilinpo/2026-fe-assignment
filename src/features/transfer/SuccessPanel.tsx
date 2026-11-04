import { useEffect, useRef } from 'react'
import type { Transfer } from '../../api/types'
import { Button } from '../../components/Button'
import { formatMoney } from '../../lib/format'

interface SuccessPanelProps {
  transfer: Transfer
  onDone: () => void
}

export function SuccessPanel({ transfer, onDone }: SuccessPanelProps) {
  const doneRef = useRef<HTMLButtonElement>(null)
  const { recipient } = transfer

  // The Confirm button that had focus is gone; put focus on the next thing
  // to do. The result itself is announced by the live region in TransferFlow.
  useEffect(() => {
    doneRef.current?.focus()
  }, [])

  return (
    <div className="transfer-dialog__body success-panel">
      <span className="success-panel__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 10 17l9-10" />
        </svg>
      </span>
      <h3 className="success-panel__title">Transfer sent</h3>
      <p className="success-panel__amount amount">{formatMoney(transfer.amount)}</p>
      <p className="success-panel__recipient">
        to {recipient.name} · {recipient.bank} · {recipient.accountNumberMasked}
      </p>
      <dl className="success-panel__reference">
        <dt>Reference</dt>{' '}
        <dd className="amount">{transfer.reference}</dd>
      </dl>
      <p className="success-panel__note">The money should arrive within minutes.</p>
      <Button ref={doneRef} block onClick={onDone}>
        Back to dashboard
      </Button>
    </div>
  )
}
