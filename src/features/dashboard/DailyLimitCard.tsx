import type { Customer } from '../../api/types'
import { Skeleton } from '../../components/Skeleton'
import { remainingDailyLimit } from '../../lib/accounts'
import { formatMoney } from '../../lib/format'

export function DailyLimitCard({ customer }: { customer: Customer | undefined }) {
  const limit = customer?.dailyTransferLimit ?? 0
  const used = customer?.transferredToday ?? 0
  const usedPercent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  return (
    <section className="card daily-limit" aria-labelledby="daily-limit-heading">
      <h2 id="daily-limit-heading" className="section-title">
        Daily limit
      </h2>

      {/* Amount on its own line so the text can't wrap differently from the
          skeleton when it arrives. */}
      <p className="daily-limit__remaining">
        <span className="daily-limit__amount amount">
          {customer ? (
            formatMoney(remainingDailyLimit(customer))
          ) : (
            <Skeleton width="9ch" />
          )}
        </span>
        <span className="daily-limit__caption">remaining today</span>
      </p>

      <div
        className="progress"
        role="progressbar"
        aria-label="Daily limit used"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-valuetext={
          customer ? `${formatMoney(used)} of ${formatMoney(limit)} used` : undefined
        }
      >
        <div className="progress__bar" style={{ width: `${usedPercent}%` }} />
      </div>

      <p className="daily-limit__note">Resets daily. Applies to all transfers.</p>
    </section>
  )
}
