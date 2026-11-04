import type { ReactNode } from 'react'
import type { Account } from '../../api/types'
import { Skeleton } from '../../components/Skeleton'
import { depositAccounts, totalAvailable } from '../../lib/accounts'
import { formatMoney } from '../../lib/format'

interface BalanceHeroProps {
  accounts: Account[] | undefined
  /** Shown at the end of the "Total available" row. */
  action?: ReactNode
}

export function BalanceHero({ accounts, action }: BalanceHeroProps) {
  const depositCount = accounts ? depositAccounts(accounts).length : 0

  return (
    <section className="balance-hero" aria-labelledby="total-available-heading">
      <div className="balance-hero__top">
        <h2 id="total-available-heading" className="balance-hero__label">
          Total available
        </h2>
        {action}
      </div>
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
