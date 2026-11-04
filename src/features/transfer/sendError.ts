import type { FieldPath } from 'react-hook-form'
import { ApiError } from '../../api/client'
import type { TransferFormValues } from './schema'

export const SEND_ERROR_MESSAGE =
  "Something went wrong. Your money hasn't left your account. Try again."

/** API `fields` keys → form field names. */
const API_FIELD_TO_FORM: Record<string, FieldPath<TransferFormValues>> = {
  fromAccountId: 'fromAccountId',
  payeeId: 'recipient',
  'recipient.name': 'newRecipient.name',
  'recipient.accountNumber': 'newRecipient.accountNumber',
  'recipient.bank': 'newRecipient.bank',
  amount: 'amount',
  note: 'note',
}

export interface SendErrorDetails {
  message: string
  fields: { name: FieldPath<TransferFormValues>; message: string }[]
}

/**
 * What to tell the user when POST /api/transfers fails.
 *
 * A 4xx with `fields` means the API rejected something specific (e.g. the
 * balance changed since the dashboard loaded): show its messages. Anything
 * else (500, network failure) gets the reassuring generic copy — the API
 * guarantees no money moved.
 */
export function describeSendError(error: unknown): SendErrorDetails {
  if (error instanceof ApiError && error.status < 500 && error.fields) {
    const fields = Object.entries(error.fields).flatMap(([key, message]) => {
      const name = API_FIELD_TO_FORM[key]
      return name ? [{ name, message }] : []
    })
    return { message: error.message, fields }
  }
  return { message: SEND_ERROR_MESSAGE, fields: [] }
}
