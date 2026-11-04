import { describe, expect, it } from 'vitest'
import type { Account, Customer } from '../api/types'
import { remainingDailyLimit, totalAvailable } from './accounts'

const accounts: Account[] = [
  { id: 'a', name: 'Checking', type: 'checking', maskedNumber: '•••• 1', balance: 4280.55, currency: 'SGD' },
  { id: 'b', name: 'Savings', type: 'savings', maskedNumber: '•••• 2', balance: 12840, currency: 'SGD' },
  { id: 'c', name: 'Card', type: 'credit', maskedNumber: '•••• 3', balance: -420.3, currency: 'SGD' },
]

describe('totalAvailable', () => {
  it('sums deposit accounts and ignores the credit card', () => {
    expect(totalAvailable(accounts)).toBe(17120.55)
  })
})

describe('remainingDailyLimit', () => {
  const customer: Customer = {
    id: 'c',
    firstName: 'Ava',
    lastName: 'Chen',
    email: 'ava@example.com',
    segment: 'retail',
    dailyTransferLimit: 5000,
    transferredToday: 120,
  }

  it('subtracts what was already sent today', () => {
    expect(remainingDailyLimit(customer)).toBe(4880)
  })

  it('never goes below zero', () => {
    expect(remainingDailyLimit({ ...customer, transferredToday: 6000 })).toBe(0)
  })
})
