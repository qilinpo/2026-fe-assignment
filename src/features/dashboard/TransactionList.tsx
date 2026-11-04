import { useRef, useState } from 'react'
import type { Transaction } from '../../api/types'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { SearchInput } from '../../components/SearchInput'
import { Skeleton } from '../../components/Skeleton'
import { formatMoney, formatShortDate } from '../../lib/format'
import { filterTransactions, formatCategory } from './filterTransactions'
import { RECENT_TRANSACTIONS_LIMIT } from './useDashboardData'

interface TransactionListProps {
  transactions: Transaction[] | undefined
}

export function TransactionList({ transactions }: TransactionListProps) {
  // Search text is UI state; the list itself stays in the query cache.
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const isSearching = query.trim() !== ''
  const results = transactions
    ? filterTransactions(transactions, query)
    : undefined

  function clearSearch() {
    setQuery('')
    searchRef.current?.focus()
  }

  return (
    <section className="card transactions" aria-labelledby="transactions-heading">
      <div className="transactions__header">
        <h2 id="transactions-heading" className="section-title">
          Recent transactions
        </h2>
        <SearchInput
          ref={searchRef}
          label="Search transactions"
          placeholder="Search transactions"
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
        />
      </div>

      {/* Always mounted so screen readers announce changes to the count. */}
      <p role="status" className="transactions__count">
        {isSearching && results
          ? `${results.length} ${results.length === 1 ? 'result' : 'results'}`
          : ''}
      </p>

      {results === undefined ? (
        <ul className="transactions__list">
          {Array.from({ length: RECENT_TRANSACTIONS_LIMIT }, (_, i) => (
            <TransactionRowSkeleton key={i} />
          ))}
        </ul>
      ) : results.length > 0 ? (
        <ul className="transactions__list">
          {results.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      ) : isSearching ? (
        <EmptyState
          title="No transactions match your search."
          action={
            <Button variant="secondary" onClick={clearSearch}>
              Clear search
            </Button>
          }
        />
      ) : (
        <EmptyState title="No transactions yet." />
      )}
    </section>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isIn = transaction.direction === 'in'
  const amount = isIn
    ? `+${formatMoney(transaction.amount)}`
    : formatMoney(-transaction.amount)

  return (
    <li className="txn">
      <div className="txn__main">
        <p className="txn__description" title={transaction.description}>
          {transaction.description}
        </p>
        <p className="txn__meta">
          {formatCategory(transaction.category)} ·{' '}
          <time dateTime={transaction.date}>
            {formatShortDate(transaction.date)}
          </time>
        </p>
      </div>
      <div className="txn__side">
        {transaction.status === 'pending' && (
          <span className="chip">Pending</span>
        )}
        <span className={`txn__amount amount ${isIn ? 'txn__amount--in' : ''}`}>
          {amount}
        </span>
      </div>
    </li>
  )
}

function TransactionRowSkeleton() {
  return (
    <li className="txn">
      <div className="txn__main">
        <p className="txn__description">
          <Skeleton width="12ch" />
        </p>
        <p className="txn__meta">
          <Skeleton width="9ch" />
        </p>
      </div>
      <div className="txn__side">
        <Skeleton width="7ch" />
      </div>
    </li>
  )
}
