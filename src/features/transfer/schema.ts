import { z } from 'zod'
import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'

/** Value of the recipient radio for "Send to someone new". */
export const NEW_RECIPIENT = 'new'
export const NOTE_MAX_LENGTH = 50

export interface TransferFormValues {
  /** A saved payee's id, or NEW_RECIPIENT. */
  recipient: string
  newRecipient: {
    name: string
    accountNumber: string
    bank: string
  }
  fromAccountId: string
  /** Kept as typed so we can tell "1.234" (3 decimals) from 1.234. */
  amount: string
  note: string
}

/**
 * Every validation rule, defined once (§3.3). The same schema drives the
 * inline errors (on blur), the per-step check on Continue, and the final
 * submit.
 */
export const fieldRules = {
  recipient: z.string().min(1, 'Choose who you\'re sending to.'),
  name: z
    .string()
    .trim()
    .min(2, 'Enter a name between 2 and 50 characters.')
    .max(50, 'Enter a name between 2 and 50 characters.'),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'Enter a valid 8-digit account number.'),
  bank: z.string().min(1, 'Choose a bank.'),
  fromAccountId: z.string().min(1, 'Choose an account to send from.'),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter an amount.')
    .regex(/^\d+(\.\d+)?$/, 'Enter a valid amount, like 120.50.')
    .regex(/^\d+(\.\d{1,2})?$/, 'Use at most 2 decimal places.')
    .refine((value) => Number(value) >= 1, 'The minimum transfer is SGD 1.00.'),
  note: z
    .string()
    .max(NOTE_MAX_LENGTH, `Keep the note to ${NOTE_MAX_LENGTH} characters or fewer.`),
}

interface SchemaContext {
  /** Accounts money can be sent from (deposit accounts only). */
  fromAccounts: Account[]
  remainingLimit: number
}

/**
 * Balance and daily limit come from live data, so the schema is built from
 * it. Everything is checked in one refinement (rather than per-field schemas
 * on the object) so that:
 *  - conditional fields (new recipient) are only checked when they apply;
 *  - one invalid field never hides the errors of another — with object-level
 *    refinements, Zod skips them as soon as any field fails.
 */
export function createTransferSchema({ fromAccounts, remainingLimit }: SchemaContext) {
  return z
    .object({
      recipient: z.string(),
      newRecipient: z.object({
        name: z.string(),
        accountNumber: z.string(),
        bank: z.string(),
      }),
      fromAccountId: z.string(),
      amount: z.string(),
      note: z.string(),
    })
    .superRefine((values, ctx) => {
      function check(rule: z.ZodType, value: unknown, path: (string | number)[]) {
        const result = rule.safeParse(value)
        if (!result.success) {
          ctx.addIssue({ code: 'custom', message: result.error.issues[0].message, path })
        }
        return result.success
      }

      check(fieldRules.recipient, values.recipient, ['recipient'])
      if (values.recipient === NEW_RECIPIENT) {
        check(fieldRules.name, values.newRecipient.name, ['newRecipient', 'name'])
        check(fieldRules.accountNumber, values.newRecipient.accountNumber, ['newRecipient', 'accountNumber'])
        check(fieldRules.bank, values.newRecipient.bank, ['newRecipient', 'bank'])
      }

      const account = fromAccounts.find((a) => a.id === values.fromAccountId)
      if (check(fieldRules.fromAccountId, values.fromAccountId, ['fromAccountId']) && !account) {
        ctx.addIssue({ code: 'custom', message: 'Choose an account to send from.', path: ['fromAccountId'] })
      }

      if (check(fieldRules.amount, values.amount, ['amount'])) {
        const cents = toCents(Number(values.amount))
        if (account && cents > toCents(account.balance)) {
          ctx.addIssue({
            code: 'custom',
            message: `Amount can't be more than your available balance (${formatMoney(account.balance)}).`,
            path: ['amount'],
          })
        } else if (cents > toCents(remainingLimit)) {
          ctx.addIssue({
            code: 'custom',
            message: `This transfer exceeds your remaining daily limit (${formatMoney(remainingLimit)}).`,
            path: ['amount'],
          })
        }
      }

      check(fieldRules.note, values.note, ['note'])
    })
}

function toCents(amount: number) {
  return Math.round(amount * 100)
}
