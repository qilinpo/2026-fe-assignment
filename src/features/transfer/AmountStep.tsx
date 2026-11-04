import { useFormContext } from 'react-hook-form'
import type { Account } from '../../api/types'
import { Field } from '../../components/Field'
import { formatMoney } from '../../lib/format'
import { NOTE_MAX_LENGTH, type TransferFormValues } from './schema'

const QUICK_AMOUNTS = [50, 100, 250, 500]

interface AmountStepProps {
  fromAccounts: Account[]
  remainingLimit: number
}

export function AmountStep({ fromAccounts, remainingLimit }: AmountStepProps) {
  const {
    register,
    watch,
    setValue,
    trigger,
    getFieldState,
    formState: { errors },
  } = useFormContext<TransferFormValues>()

  const fromAccount = fromAccounts.find((a) => a.id === watch('fromAccountId'))
  const noteLength = watch('note').length

  return (
    <>
      <Field
        label="From account"
        hint="Deposit accounts only"
        error={errors.fromAccountId?.message}
      >
        {(control) => (
          <select
            className="select"
            {...control}
            {...register('fromAccountId', {
              // The balance rule depends on the account: re-check an amount
              // the user has already entered.
              onChange: () => {
                if (getFieldState('amount').isTouched) void trigger('amount')
              },
            })}
          >
            {fromAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.maskedNumber}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        label="Amount"
        error={errors.amount?.message}
        hint={
          <dl className="amount-facts">
            <div>
              <dt>Available</dt>{' '}
              <dd className="amount">
                {fromAccount ? formatMoney(fromAccount.balance) : '—'}
              </dd>
            </div>
            <div>
              <dt>Remaining daily limit</dt>{' '}
              <dd className="amount">{formatMoney(remainingLimit)}</dd>
            </div>
          </dl>
        }
      >
        {(control) => (
          <>
            <div className="amount-input">
              <span className="amount-input__currency" aria-hidden="true">
                SGD
              </span>
              <input
                className="input amount-input__field amount"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                {...control}
                {...register('amount')}
              />
            </div>
            <div className="quick-amounts" role="group" aria-label="Quick amounts">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="quick-amounts__option"
                  aria-label={`SGD ${value}`}
                  onClick={() =>
                    setValue('amount', String(value), {
                      shouldValidate: true,
                      shouldTouch: true,
                      shouldDirty: true,
                    })
                  }
                >
                  {value}
                </button>
              ))}
            </div>
          </>
        )}
      </Field>

      <Field
        label="Note (optional)"
        error={errors.note?.message}
        aside={
          <span className={noteLength > NOTE_MAX_LENGTH ? 'field__count--over' : undefined}>
            {noteLength}/{NOTE_MAX_LENGTH}
          </span>
        }
      >
        {(control) => (
          <input
            className="input"
            autoComplete="off"
            {...control}
            {...register('note')}
          />
        )}
      </Field>
    </>
  )
}
