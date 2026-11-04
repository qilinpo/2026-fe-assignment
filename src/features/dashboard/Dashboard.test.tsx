import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { money } from '../../test/money'
import { renderApp } from '../../test/renderApp'
import { server } from '../../test/setup'

function transactionsRegion() {
  return screen.getByRole('region', { name: 'Recent transactions' })
}

function transactionRows() {
  return within(transactionsRegion()).getAllByRole('listitem')
}

describe('dashboard', () => {
  it('shows the total, accounts and the 8 newest transactions', async () => {
    renderApp()

    expect(await screen.findByText(money(17120.55))).toBeInTheDocument()
    expect(screen.getByText('Across 2 deposit accounts')).toBeInTheDocument()

    const accounts = screen.getByRole('region', { name: 'Accounts' })
    expect(within(accounts).getAllByRole('listitem')).toHaveLength(3)
    expect(within(accounts).getByText(money(-420.3))).toBeInTheDocument()
    expect(within(accounts).getByText('Amount due')).toBeInTheDocument()

    const rows = transactionRows()
    expect(rows).toHaveLength(8)
    expect(rows[0]).toHaveTextContent('FairPrice Finest')
    expect(rows[0]).toHaveTextContent('Groceries · 19 Oct')
    expect(rows[0]).toHaveTextContent(money(-86.4))
    expect(within(rows[1]).getByText('Pending')).toBeInTheDocument()
    expect(within(rows[4]).getByText(`+${money(45)}`)).toBeInTheDocument()
  })

  it('filters by description or category, ignoring case, and can be cleared', async () => {
    const { user } = renderApp()
    await screen.findByText('FairPrice Finest')

    const search = screen.getByRole('searchbox', { name: 'Search transactions' })

    await user.type(search, 'DINING')
    expect(transactionRows()).toHaveLength(1)
    expect(transactionRows()[0]).toHaveTextContent('Kopitiam Corner')
    expect(screen.getByRole('status')).toHaveTextContent('1 result')

    await user.clear(search)
    await user.type(search, 'grab')
    expect(transactionRows()).toHaveLength(1)
    expect(transactionRows()[0]).toHaveTextContent('Grab')

    await user.type(search, 'zzz')
    expect(
      screen.getByText('No transactions match your search.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(transactionRows()).toHaveLength(8)
    expect(search).toHaveValue('')
    expect(search).toHaveFocus()
  })

  it('shows an error when loading fails, and Retry loads the dashboard', async () => {
    server.use(
      http.get(
        '*/api/accounts',
        () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
            { status: 500 },
          ),
        { once: true },
      ),
    )
    const { user } = renderApp()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't load your dashboard.",
    )
    expect(screen.queryByText(money(17120.55))).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText(money(17120.55))).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
