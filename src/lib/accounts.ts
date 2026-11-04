import type { Account, Customer } from '../api/types'

/** Checking and savings hold money; the credit card is money owed. */
export function isDepositAccount(account: Account): boolean {
  return account.type !== 'credit'
}

export function depositAccounts(accounts: Account[]): Account[] {
  return accounts.filter(isDepositAccount)
}

/** Sum of deposit balances. Derived on render, never stored. */
export function totalAvailable(accounts: Account[]): number {
  const cents = depositAccounts(accounts).reduce(
    (sum, account) => sum + Math.round(account.balance * 100),
    0,
  )
  return cents / 100
}

export function remainingDailyLimit(customer: Customer): number {
  return Math.max(0, customer.dailyTransferLimit - customer.transferredToday)
}
