import type { Transaction } from '../../api/types'

/** D6: match description or category, ignoring case and surrounding spaces. */
export function filterTransactions(
  transactions: Transaction[],
  query: string,
): Transaction[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return transactions

  return transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(needle) ||
      t.category.toLowerCase().includes(needle),
  )
}

/** `groceries` → `Groceries` */
export function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}
