import type { Account } from '../../api/types'
import { EmptyState } from '../../components/EmptyState'
import { Skeleton } from '../../components/Skeleton'
import { formatMoney } from '../../lib/format'

const SKELETON_COUNT = 3

export function AccountList({ accounts }: { accounts: Account[] | undefined }) {
  return (
    <section aria-labelledby="accounts-heading">
      <h2 id="accounts-heading" className="section-title">
        Accounts
      </h2>

      {accounts?.length === 0 ? (
        <EmptyState title="No accounts to show." />
      ) : (
        <ul className="account-list">
          {accounts
            ? accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))
            : Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <AccountCardSkeleton key={i} />
              ))}
        </ul>
      )}
    </section>
  )
}

function AccountCard({ account }: { account: Account }) {
  const isCredit = account.type === 'credit'

  return (
    <li className="card account-card">
      <p className="account-card__name">{account.name}</p>
      <p className="account-card__number amount">{account.maskedNumber}</p>
      <p className="account-card__balance amount">
        {formatMoney(account.balance)}
      </p>
      <p className="account-card__label">
        {isCredit ? 'Amount due' : 'Available'}
      </p>
    </li>
  )
}

function AccountCardSkeleton() {
  return (
    <li className="card account-card">
      <p className="account-card__name">
        <Skeleton width="60%" />
      </p>
      <p className="account-card__number">
        <Skeleton width="7ch" />
      </p>
      <p className="account-card__balance">
        <Skeleton width="8ch" />
      </p>
      <p className="account-card__label">
        <Skeleton width="6ch" />
      </p>
    </li>
  )
}
