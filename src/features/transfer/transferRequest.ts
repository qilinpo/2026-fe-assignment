import type { CreateTransferRequest, Payee, TransferRecipient } from '../../api/types'
import { NEW_RECIPIENT, type TransferFormValues } from './schema'

/** `12345678` → `•••• 5678`, matching how the API masks numbers. */
export function maskAccountNumber(accountNumber: string): string {
  return `•••• ${accountNumber.trim().slice(-4)}`
}

/** Who the money goes to, for display (review step). */
export function resolveRecipient(
  values: TransferFormValues,
  payees: Payee[] | undefined,
): TransferRecipient | undefined {
  if (values.recipient === NEW_RECIPIENT) {
    return {
      name: values.newRecipient.name.trim(),
      bank: values.newRecipient.bank,
      accountNumberMasked: maskAccountNumber(values.newRecipient.accountNumber),
    }
  }
  const payee = payees?.find((p) => p.id === values.recipient)
  return payee && {
    name: payee.name,
    bank: payee.bank,
    accountNumberMasked: payee.accountNumberMasked,
  }
}

/** Form values → API body: either `payeeId` or `recipient`, never both. */
export function toTransferRequest(values: TransferFormValues): CreateTransferRequest {
  const note = values.note.trim()
  const base = {
    fromAccountId: values.fromAccountId,
    amount: Number(values.amount),
    ...(note ? { note } : {}),
  }

  if (values.recipient === NEW_RECIPIENT) {
    return {
      ...base,
      recipient: {
        name: values.newRecipient.name.trim(),
        accountNumber: values.newRecipient.accountNumber.trim(),
        bank: values.newRecipient.bank,
      },
    }
  }
  return { ...base, payeeId: values.recipient }
}
