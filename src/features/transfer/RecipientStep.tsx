import { useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { payeesQuery } from '../../api/queries'
import type { Payee } from '../../api/types'
import { Button } from '../../components/Button'
import { Field, FieldError } from '../../components/Field'
import { SearchInput } from '../../components/SearchInput'
import { Skeleton } from '../../components/Skeleton'
import { BANKS } from './banks'
import { NEW_RECIPIENT, type TransferFormValues } from './schema'

export function RecipientStep() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<TransferFormValues>()
  const payees = useQuery(payeesQuery)
  const [search, setSearch] = useState('')
  const errorId = useId()

  const selected = watch('recipient')
  const recipientError = errors.recipient?.message
  const visiblePayees = payees.data ? filterPayees(payees.data, search) : []

  // Shared by every radio so the group error is linked to each option (T8).
  const radioProps = {
    ...register('recipient'),
    type: 'radio' as const,
    className: 'payee-option__input',
    'aria-describedby': recipientError ? errorId : undefined,
    'aria-invalid': recipientError ? true : undefined,
  }

  return (
    <>
      <SearchInput
        label="Search payees"
        placeholder="Search payees"
        value={search}
        onChange={setSearch}
        onClear={() => setSearch('')}
      />

      {/* A native radio group: arrow keys move between payees (T8). */}
      <fieldset className="payee-fieldset">
        <legend className="visually-hidden">Recipient</legend>

        {payees.isPending ? (
          <div className="payee-list" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <PayeeOptionSkeleton key={i} />
            ))}
          </div>
        ) : payees.isError ? (
          <div className="payee-notice">
            <p>We couldn&apos;t load your saved payees.</p>
            <Button variant="secondary" onClick={() => void payees.refetch()}>
              Retry
            </Button>
          </div>
        ) : payees.data.length === 0 ? (
          <p className="payee-notice">You don&apos;t have any saved payees yet.</p>
        ) : visiblePayees.length === 0 ? (
          <p className="payee-notice">No payees match your search.</p>
        ) : (
          <div className="payee-list">
            {visiblePayees.map((payee) => (
              <label key={payee.id} className="payee-option">
                <input {...radioProps} value={payee.id} />
                <span className="payee-option__avatar" aria-hidden="true">
                  {payee.initials}
                </span>
                <span className="payee-option__text">
                  <span className="payee-option__name">{payee.name}</span>
                  <span className="payee-option__meta">
                    {payee.bank} · {payee.accountNumberMasked}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        <label className="payee-option payee-option--new">
          <input {...radioProps} value={NEW_RECIPIENT} />
          <span className="payee-option__avatar" aria-hidden="true">
            +
          </span>
          <span className="payee-option__name">Send to someone new</span>
        </label>

        {recipientError && <FieldError id={errorId}>{recipientError}</FieldError>}
      </fieldset>

      {selected === NEW_RECIPIENT && <NewRecipientFields />}
    </>
  )
}

function NewRecipientFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<TransferFormValues>()
  const fieldErrors = errors.newRecipient

  return (
    <div className="new-recipient" role="group" aria-label="New recipient details">
      <Field label="Recipient name" error={fieldErrors?.name?.message}>
        {(control) => (
          <input
            className="input"
            autoComplete="off"
            {...control}
            {...register('newRecipient.name')}
          />
        )}
      </Field>
      <Field
        label="Account number"
        hint="8 digits"
        error={fieldErrors?.accountNumber?.message}
      >
        {(control) => (
          <input
            className="input"
            inputMode="numeric"
            autoComplete="off"
            {...control}
            {...register('newRecipient.accountNumber')}
          />
        )}
      </Field>
      <Field label="Bank" error={fieldErrors?.bank?.message}>
        {(control) => (
          <select className="select" {...control} {...register('newRecipient.bank')}>
            <option value="">Choose a bank</option>
            {BANKS.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        )}
      </Field>
    </div>
  )
}

function PayeeOptionSkeleton() {
  return (
    <div className="payee-option" aria-hidden="true">
      <span className="payee-option__avatar" />
      <span className="payee-option__text">
        <span className="payee-option__name">
          <Skeleton width="10ch" />
        </span>
        <span className="payee-option__meta">
          <Skeleton width="12ch" />
        </span>
      </span>
    </div>
  )
}

function filterPayees(payees: Payee[], query: string): Payee[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return payees
  return payees.filter(
    (p) =>
      p.name.toLowerCase().includes(needle) ||
      p.bank.toLowerCase().includes(needle),
  )
}
