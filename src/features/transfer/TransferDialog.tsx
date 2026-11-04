import { useQuery } from '@tanstack/react-query'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { accountsQuery, customerQuery } from '../../api/queries'
import { Button } from '../../components/Button'
import { IconButton } from '../../components/IconButton'
import { Skeleton } from '../../components/Skeleton'
import { TransferFlow } from './TransferFlow'
import './TransferDialog.css'

interface TransferDialogProps {
  onClose: () => void
}

/**
 * Mounted only while open, so every transfer starts from a clean slate.
 *
 * Uses the native <dialog> with showModal(): the browser puts it in the top
 * layer, makes the page behind it inert (focus can't leave), and closes it on
 * Esc. We only add moving focus in on open and back to the opener on close.
 */
export function TransferDialog({ onClose }: TransferDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  // Usually already cached by the dashboard.
  const accounts = useQuery(accountsQuery)
  const customer = useQuery(customerQuery)

  // Captured during the first render, before the dialog takes focus.
  const [opener] = useState(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )

  // Layout effect: runs before any child's useEffect, so the dialog is
  // already open (and focusable) when the flow moves focus into it.
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // Passive-effect cleanup runs after React has removed the dialog from the
  // DOM, so the page is no longer inert and the opener can take focus again.
  useEffect(() => () => opener?.focus(), [opener])

  const failed = [accounts, customer].filter((q) => q.isError && q.data === undefined)

  return (
    <dialog
      ref={dialogRef}
      className="transfer-dialog"
      aria-labelledby={titleId}
      // Fired when the browser closes the dialog itself (Esc).
      onClose={onClose}
    >
      <div className="transfer-dialog__header">
        <h2 id={titleId} className="transfer-dialog__title">
          New transfer
        </h2>
        <IconButton aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>

      {accounts.data && customer.data ? (
        <TransferFlow
          accounts={accounts.data}
          customer={customer.data}
          onClose={onClose}
        />
      ) : failed.length > 0 && failed.every((q) => !q.isFetching) ? (
        <div className="transfer-dialog__body transfer-dialog__status">
          <p role="alert">We couldn&apos;t load your accounts.</p>
          <Button onClick={() => failed.forEach((q) => void q.refetch())}>Retry</Button>
        </div>
      ) : (
        <div className="transfer-dialog__body" aria-busy="true">
          <Skeleton width="60%" />
          <Skeleton width="100%" />
          <Skeleton width="100%" />
        </div>
      )}
    </dialog>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
