import { describe, expect, it } from 'vitest'
import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'
import { createTransferSchema, NEW_RECIPIENT, type TransferFormValues } from './schema'
import { toTransferRequest } from './transferRequest'

const checking: Account = {
  id: 'acc_checking',
  name: 'Everyday Checking',
  type: 'checking',
  maskedNumber: '•••• 4821',
  balance: 4280.55,
  currency: 'SGD',
}
const savings: Account = { ...checking, id: 'acc_savings', type: 'savings', balance: 12840 }

const schema = createTransferSchema({ fromAccounts: [checking, savings], remainingLimit: 5000 })

const valid: TransferFormValues = {
  recipient: 'pay_001',
  newRecipient: { name: '', accountNumber: '', bank: '' },
  fromAccountId: 'acc_checking',
  amount: '120.50',
  note: '',
}

function errorsFor(values: Partial<TransferFormValues>) {
  const result = schema.safeParse({ ...valid, ...values })
  if (result.success) return {}
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]))
}

describe('transfer schema', () => {
  it('accepts a valid saved-payee transfer', () => {
    expect(errorsFor({})).toEqual({})
  })

  it.each([
    ['', 'Enter an amount.'],
    ['abc', 'Enter a valid amount, like 120.50.'],
    ['1.234', 'Use at most 2 decimal places.'],
    ['0.99', 'The minimum transfer is SGD 1.00.'],
  ])('rejects amount %j', (amount, message) => {
    expect(errorsFor({ amount })).toEqual({ amount: message })
  })

  it('allows exactly the balance, but not a cent more', () => {
    expect(errorsFor({ amount: '4280.55' })).toEqual({})
    expect(errorsFor({ amount: '4280.56' })).toEqual({
      amount: `Amount can't be more than your available balance (${formatMoney(4280.55)}).`,
    })
  })

  it('checks the daily limit against the chosen account', () => {
    expect(errorsFor({ fromAccountId: 'acc_savings', amount: '5000.01' })).toEqual({
      amount: `This transfer exceeds your remaining daily limit (${formatMoney(5000)}).`,
    })
  })

  it('only checks new-recipient fields when sending to someone new', () => {
    expect(errorsFor({ recipient: NEW_RECIPIENT })).toEqual({
      'newRecipient.name': 'Enter a name between 2 and 50 characters.',
      'newRecipient.accountNumber': 'Enter a valid 8-digit account number.',
      'newRecipient.bank': 'Choose a bank.',
    })
  })

  it('reports every invalid field at once', () => {
    expect(Object.keys(errorsFor({ recipient: '', amount: '', note: 'x'.repeat(51) }))).toEqual([
      'recipient',
      'amount',
      'note',
    ])
  })
})

describe('toTransferRequest', () => {
  it('sends payeeId for a saved payee and drops an empty note', () => {
    expect(toTransferRequest(valid)).toEqual({
      fromAccountId: 'acc_checking',
      amount: 120.5,
      payeeId: 'pay_001',
    })
  })

  it('sends trimmed recipient details for someone new', () => {
    expect(
      toTransferRequest({
        ...valid,
        recipient: NEW_RECIPIENT,
        newRecipient: { name: ' Alex Lim ', accountNumber: '12345678', bank: 'OCBC' },
        note: ' Dinner ',
      }),
    ).toEqual({
      fromAccountId: 'acc_checking',
      amount: 120.5,
      note: 'Dinner',
      recipient: { name: 'Alex Lim', accountNumber: '12345678', bank: 'OCBC' },
    })
  })
})
