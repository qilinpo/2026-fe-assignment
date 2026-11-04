import { useQuery } from '@tanstack/react-query'
import { customerQuery } from '../api/queries'
import { SegmentSwitch } from '../theme/SegmentSwitch'
import { ThemeToggle } from '../theme/ThemeToggle'
import { Skeleton } from './Skeleton'
import './Header.css'

// Only Overview exists; the rest are decoration (out of scope).
const NAV = ['Overview', 'Cards', 'Payments', 'Insights'] as const

export function Header() {
  const customer = useQuery(customerQuery)
  const initials = customer.data
    ? `${customer.data.firstName[0]}${customer.data.lastName[0]}`
    : null

  return (
    <header className="header">
      <div className="container header__inner">
        <a className="header__brand" href="/" aria-label="Meridian home">
          <LogoMark />
          <span className="header__wordmark">Meridian</span>
        </a>

        <nav className="header__nav" aria-label="Main">
          <ul>
            {NAV.map((item) =>
              item === 'Overview' ? (
                <li key={item}>
                  <a className="header__link" href="/" aria-current="page">
                    {item}
                  </a>
                </li>
              ) : (
                <li key={item}>
                  <a className="header__link" aria-disabled="true">
                    {item}
                  </a>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="header__actions">
          <SegmentSwitch className="header__segment" />
          <ThemeToggle />
          {customer.data ? (
            <span
              className="header__avatar"
              role="img"
              aria-label={`${customer.data.firstName} ${customer.data.lastName}`}
            >
              <span aria-hidden="true">{initials}</span>
            </span>
          ) : (
            <span className="header__avatar">
              <Skeleton width={20} />
            </span>
          )}
        </div>
      </div>
    </header>
  )
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--brand)" />
      <path
        d="M8 23V9l8 9 8-9v14"
        fill="none"
        stroke="var(--on-brand)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
