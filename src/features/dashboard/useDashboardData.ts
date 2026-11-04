import { useQuery } from '@tanstack/react-query'
import {
  accountsQuery,
  customerQuery,
  transactionsQuery,
} from '../../api/queries'

export const RECENT_TRANSACTIONS_LIMIT = 8

/**
 * The three dashboard requests run in parallel (D1). Components get
 * `undefined` while a piece is loading and render a skeleton in its place.
 *
 * The dashboard counts as failed only when a query has no data to show: a
 * failed background refetch keeps the last good data on screen instead of
 * replacing the whole page with an error.
 */
export function useDashboardData() {
  const customer = useQuery(customerQuery)
  const accounts = useQuery(accountsQuery)
  const transactions = useQuery(
    transactionsQuery({ limit: RECENT_TRANSACTIONS_LIMIT }),
  )

  const queries = [customer, accounts, transactions]
  const failed = queries.filter((q) => q.isError && q.data === undefined)
  // While Retry is in flight, show skeletons again rather than the error.
  const isError = failed.length > 0 && failed.every((q) => !q.isFetching)

  return {
    customer: customer.data,
    accounts: accounts.data,
    transactions: transactions.data?.transactions,
    isLoading: queries.some((q) => q.data === undefined),
    isError,
    retry: () => {
      failed.forEach((q) => void q.refetch())
    },
  }
}
