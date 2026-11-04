import { Button } from '../../components/Button'
import { Skeleton } from '../../components/Skeleton'
import { SegmentSwitch } from '../../theme/SegmentSwitch'
import { AccountList } from './AccountList'
import { BalanceHero } from './BalanceHero'
import { DailyLimitCard } from './DailyLimitCard'
import { DashboardError } from './DashboardError'
import { TransactionList } from './TransactionList'
import { useDashboardData } from './useDashboardData'
import './Dashboard.css'

interface DashboardProps {
  onNewTransfer?: () => void
}

export function Dashboard({ onNewTransfer }: DashboardProps) {
  const { customer, accounts, transactions, isLoading, isError, retry } =
    useDashboardData()

  if (isError) return <DashboardError onRetry={retry} />

  return (
    <div className="dashboard" aria-busy={isLoading}>
      <div className="dashboard__greeting">
        <h1 className="dashboard__title">
          Good evening,{' '}
          {customer ? customer.firstName : <Skeleton width="3ch" />}
        </h1>
        {/* Below 640px the header has no room for the switch. */}
        <SegmentSwitch className="mobile-only" />
      </div>

      <div className="dashboard__grid">
        <div className="dashboard__main">
          <BalanceHero
            accounts={accounts}
            action={
              // In the Total available row (wireframe); fixed to the bottom
              // of the screen on mobile.
              <div className="cta-bar">
                <Button onClick={onNewTransfer}>
                  <PlusIcon />
                  New transfer
                </Button>
              </div>
            }
          />
          <AccountList accounts={accounts} />
          <TransactionList transactions={transactions} />
        </div>

        <aside className="dashboard__rail" aria-label="Transfer limits">
          <DailyLimitCard customer={customer} />
        </aside>
      </div>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
