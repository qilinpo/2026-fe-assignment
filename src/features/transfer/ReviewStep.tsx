import { useQuery } from '@tanstack/react-query'
import { useFormContext } from 'react-hook-form'
import { payeesQuery } from '../../api/queries'
import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'
import type { TransferFormValues } from './schema'
import { resolveRecipient } from './transferRequest'

const FEE = 0

export function ReviewStep({ fromAccounts }: { fromAccounts: Account[] }) {
  const { getValues } = useFormContext<TransferFormValues>()
  const payees = useQuery(payeesQuery)

  // Values were validated on the way here and can't change on this step.
  const values = getValues()
  const fromAccount = fromAccounts.find((a) => a.id === values.fromAccountId)
  const recipient = resolveRecipient(values, payees.data)
  const amount = Number(values.amount)
  const note = values.note.trim()

  return (
    <>
      <dl className="review-list">
        <div className="review-list__row">
          <dt>From</dt>{' '}
          <dd>
            {fromAccount && `${fromAccount.name} · ${fromAccount.maskedNumber}`}
          </dd>
        </div>
        <div className="review-list__row">
          <dt>To</dt>{' '}
          <dd>
            {recipient &&
              `${recipient.name} · ${recipient.bank} · ${recipient.accountNumberMasked}`}
          </dd>
        </div>
        <div className="review-list__row">
          <dt>Amount</dt>{' '}
          <dd className="amount">{formatMoney(amount)}</dd>
        </div>
        <div className="review-list__row">
          <dt>Fee</dt>{' '}
          <dd className="amount">{formatMoney(FEE)}</dd>
        </div>
        {note && (
          <div className="review-list__row">
            <dt>Note</dt>{' '}
            <dd>{note}</dd>
          </div>
        )}
        <div className="review-list__row review-list__row--total">
          <dt>Total</dt>{' '}
          <dd className="amount">{formatMoney(amount + FEE)}</dd>
        </div>
      </dl>
      <p className="review-info">Usually arrives in minutes.</p>
    </>
  )
}
