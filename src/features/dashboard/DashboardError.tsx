import { Button } from '../../components/Button'

export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card dashboard-error">
      <p role="alert" className="dashboard-error__message">
        We couldn&apos;t load your dashboard.
      </p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  )
}
