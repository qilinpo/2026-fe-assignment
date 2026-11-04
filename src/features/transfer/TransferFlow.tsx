import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { FormProvider, useForm, type FieldPath } from 'react-hook-form'
import type { Account, Customer } from '../../api/types'
import { Button } from '../../components/Button'
import { depositAccounts, remainingDailyLimit } from '../../lib/accounts'
import { AmountStep } from './AmountStep'
import { RecipientStep } from './RecipientStep'
import { ReviewStep } from './ReviewStep'
import { createTransferSchema, type TransferFormValues } from './schema'
import { Stepper } from './Stepper'
import { STEPS, type Step } from './steps'

/** Fields checked when Continue is pressed on each step. */
const STEP_FIELDS: Record<Step['id'], FieldPath<TransferFormValues>[]> = {
  recipient: [
    'recipient',
    'newRecipient.name',
    'newRecipient.accountNumber',
    'newRecipient.bank',
  ],
  amount: ['fromAccountId', 'amount', 'note'],
  review: [],
}

interface TransferFlowProps {
  accounts: Account[]
  customer: Customer
  onClose: () => void
}

/**
 * One form across all three steps, so going Back keeps everything the user
 * entered (T4). Steps only decide which fields are on screen and checked.
 */
export function TransferFlow({ accounts, customer, onClose }: TransferFlowProps) {
  const fromAccounts = useMemo(() => depositAccounts(accounts), [accounts])
  const remainingLimit = remainingDailyLimit(customer)
  const schema = useMemo(
    () => createTransferSchema({ fromAccounts, remainingLimit }),
    [fromAccounts, remainingLimit],
  )

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(schema),
    // Check a field when the user leaves it, then as they fix it (§3.3).
    mode: 'onTouched',
    defaultValues: {
      recipient: '',
      newRecipient: { name: '', accountNumber: '', bank: '' },
      fromAccountId: fromAccounts[0]?.id ?? '',
      amount: '',
      note: '',
    },
  })

  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  // Bumped after a failed Continue; the effect below runs once the errors
  // have rendered (and set aria-invalid).
  const [focusErrorRequest, setFocusErrorRequest] = useState(0)

  // Focus the step title on open and on every step change so screen readers
  // announce where the user is.
  useEffect(() => {
    stepHeadingRef.current?.focus()
  }, [stepIndex])

  // Focus the first invalid field in on-screen order (§3.3).
  useEffect(() => {
    if (focusErrorRequest === 0) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [focusErrorRequest])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isLastStep) {
      // Sending the transfer is wired up in phase 5.
      return
    }
    // Validate this step's fields with the shared schema.
    const isValid = await form.trigger(STEP_FIELDS[step.id])
    if (isValid) setStepIndex(stepIndex + 1)
    else setFocusErrorRequest((n) => n + 1)
  }

  return (
    <FormProvider {...form}>
      <div className="transfer-dialog__stepper">
        <Stepper steps={STEPS} currentIndex={stepIndex} />
      </div>

      {/* noValidate: the schema owns validation, not the browser. Enter in a
          field acts as Continue. */}
      <form
        ref={formRef}
        className="transfer-dialog__form"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="transfer-dialog__body">
          <h3
            ref={stepHeadingRef}
            tabIndex={-1}
            className="transfer-dialog__step-title"
          >
            {step.title}
          </h3>

          {step.id === 'recipient' && <RecipientStep />}
          {step.id === 'amount' && (
            <AmountStep fromAccounts={fromAccounts} remainingLimit={remainingLimit} />
          )}
          {step.id === 'review' && <ReviewStep fromAccounts={fromAccounts} />}
        </div>

        <div className="transfer-dialog__footer">
          {stepIndex === 0 ? (
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setStepIndex(stepIndex - 1)}>
              Back
            </Button>
          )}
          <Button type="submit">{isLastStep ? 'Confirm transfer' : 'Continue'}</Button>
        </div>
      </form>
    </FormProvider>
  )
}
