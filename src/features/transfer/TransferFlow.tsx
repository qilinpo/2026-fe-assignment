import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { FormProvider, useForm, type FieldPath } from 'react-hook-form'
import { useCreateTransfer } from '../../api/queries'
import type { Account, Customer } from '../../api/types'
import { Button } from '../../components/Button'
import { depositAccounts, remainingDailyLimit } from '../../lib/accounts'
import { formatMoney } from '../../lib/format'
import { AmountStep } from './AmountStep'
import { RecipientStep } from './RecipientStep'
import { ReviewStep } from './ReviewStep'
import { createTransferSchema, type TransferFormValues } from './schema'
import { describeSendError } from './sendError'
import { Stepper } from './Stepper'
import { STEPS, type Step } from './steps'
import { SuccessPanel } from './SuccessPanel'
import { toTransferRequest } from './transferRequest'

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

  const transfer = useCreateTransfer()
  // The API sends money twice for two identical requests. `isPending` only
  // updates after a re-render, so a ref also blocks a fast double click.
  const sendingRef = useRef(false)
  const isSending = transfer.isPending
  const sendError = transfer.isError ? describeSendError(transfer.error) : null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isLastStep) {
      if (sendingRef.current) return
      sendingRef.current = true
      // Final check with the same schema, then send.
      await form.handleSubmit(send, goToFirstInvalidStep)()
      return
    }
    // Validate this step's fields with the shared schema.
    const isValid = await form.trigger(STEP_FIELDS[step.id])
    if (isValid) setStepIndex(stepIndex + 1)
    else setFocusErrorRequest((n) => n + 1)
  }

  function send(values: TransferFormValues) {
    transfer.mutate(toTransferRequest(values), {
      // Put field-level messages from the API (e.g. the balance changed
      // since the dashboard loaded) on their fields, for when the user goes
      // Back. The review step shows them in the alert too.
      onError: (error) => {
        for (const field of describeSendError(error).fields) {
          form.setError(field.name, { type: 'server', message: field.message })
        }
      },
      onSettled: () => {
        sendingRef.current = false
      },
    })
  }

  // Only reachable if data changed since the user passed a step.
  function goToFirstInvalidStep() {
    sendingRef.current = false
    const index = STEPS.findIndex((s) =>
      STEP_FIELDS[s.id].some((name) => form.getFieldState(name).invalid),
    )
    if (index >= 0) setStepIndex(index)
    setFocusErrorRequest((n) => n + 1)
  }

  function goBack() {
    if (isSending) return
    transfer.reset() // clear a previous send error
    setStepIndex(stepIndex - 1)
  }

  const successAnnouncement = transfer.data
    ? `Transfer sent. ${formatMoney(transfer.data.transfer.amount)} to ${transfer.data.transfer.recipient.name}. Reference ${transfer.data.transfer.reference}.`
    : ''

  return (
    <FormProvider {...form}>
      {/* Always mounted so the success message is announced (T8). */}
      <p className="visually-hidden" aria-live="polite">
        {successAnnouncement}
      </p>

      {transfer.isSuccess ? (
        <SuccessPanel transfer={transfer.data.transfer} onDone={onClose} />
      ) : (
        <>
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
              {step.id === 'review' && (
                <>
                  {sendError && (
                    <div role="alert" className="send-error">
                      <p>{sendError.message}</p>
                      {sendError.fields.length > 0 && (
                        <ul>
                          {sendError.fields.map((field) => (
                            <li key={field.name}>{field.message}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <ReviewStep fromAccounts={fromAccounts} />
                </>
              )}
            </div>

            <div className="transfer-dialog__footer">
              {stepIndex === 0 ? (
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
              ) : (
                <Button variant="secondary" aria-disabled={isSending} onClick={goBack}>
                  Back
                </Button>
              )}
              {/* aria-disabled rather than disabled: a disabled button drops
                  keyboard focus, and the user lands back on it after a failure. */}
              <Button type="submit" aria-disabled={isSending}>
                {isLastStep ? (isSending ? 'Sending…' : 'Confirm transfer') : 'Continue'}
              </Button>
            </div>
          </form>
        </>
      )}
    </FormProvider>
  )
}
