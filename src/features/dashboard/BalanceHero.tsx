import type { Account } from '../../api/types'
import { Skeleton } from '../../components/Skeleton'
import { depositAccounts, totalAvailable } from '../../lib/accounts'
import { formatMoney } from '../../lib/format'

export function BalanceHero({ accounts }: { accounts: Account[] | undefined }) {
  const depositCount = accounts ? depositAccounts(accounts).length : 0

  return (
    <section className="balance-hero" aria-labelledby="total-available-heading">
      <h2 id="total-available-heading" className="balance-hero__label">
        Total available
      </h2>
      <p className="balance-hero__amount amount">
        {accounts ? (
          formatMoney(totalAvailable(accounts))
        ) : (
          <Skeleton width="9ch" />
        )}
      </p>
      <p className="balance-hero__caption">
        {accounts ? (
          `Across ${depositCount} deposit ${depositCount === 1 ? 'account' : 'accounts'}`
        ) : (
          <Skeleton width="16ch" />
        )}
      </p>
    </section>
  )
}
