import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { apiFetch } from './client'
import type {
  AccountsResponse,
  CreateTransferRequest,
  CustomerResponse,
  PayeesResponse,
  TransactionsResponse,
  TransferResponse,
} from './types'

/**
 * The typed data layer. Components use these query options / hooks and never
 * call `fetch` or `apiFetch` directly.
 */

export interface TransactionsParams {
  limit?: number
  q?: string
}

export const queryKeys = {
  customer: ['customer'] as const,
  accounts: ['accounts'] as const,
  // Prefix key: invalidating it refreshes every transactions query.
  transactions: ['transactions'] as const,
  transactionList: (params: TransactionsParams) =>
    ['transactions', params] as const,
  payees: ['payees'] as const,
}

export const customerQuery = queryOptions({
  queryKey: queryKeys.customer,
  queryFn: ({ signal }) =>
    apiFetch<CustomerResponse>('/api/customer', { signal }).then(
      (res) => res.customer,
    ),
})

export const accountsQuery = queryOptions({
  queryKey: queryKeys.accounts,
  queryFn: ({ signal }) =>
    apiFetch<AccountsResponse>('/api/accounts', { signal }).then(
      (res) => res.accounts,
    ),
})

export function transactionsQuery(params: TransactionsParams = {}) {
  return queryOptions({
    queryKey: queryKeys.transactionList(params),
    queryFn: ({ signal }) =>
      apiFetch<TransactionsResponse>(
        `/api/transactions${toSearch(params)}`,
        { signal },
      ),
  })
}

export const payeesQuery = queryOptions({
  queryKey: queryKeys.payees,
  queryFn: ({ signal }) =>
    apiFetch<PayeesResponse>('/api/payees', { signal }).then(
      (res) => res.payees,
    ),
})

export function useCreateTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateTransferRequest) =>
      apiFetch<TransferResponse>('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    // Returning the promise keeps the mutation pending until the dashboard
    // data has been refetched, so the success screen never shows stale
    // balances behind it. The server stays the single source of truth.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customer }),
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions }),
      ]),
  })
}

function toSearch(params: TransactionsParams): string {
  const search = new URLSearchParams()
  if (params.limit !== undefined) search.set('limit', String(params.limit))
  if (params.q) search.set('q', params.q)
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}
