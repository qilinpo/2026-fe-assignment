import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { money } from '../../test/money'
import { server } from '../../test/setup'
import { openTransfer, recordTransferRequests } from '../../test/transferHelpers'

async function goToReview({ amount = '120', note = '' } = {}) {
  const t = await openTransfer()
  await t.choosePayee('Jamie Tan')
  await t.continue()
  await t.user.type(t.inDialog.getByLabelText('Amount'), amount)
  if (note) await t.user.type(t.inDialog.getByLabelText('Note (optional)'), note)
  await t.continue()
  await t.inDialog.findByRole('heading', { name: 'Check the details' })
  return {
    ...t,
    confirm: () => t.user.click(t.inDialog.getByRole('button', { name: 'Confirm transfer' })),
  }
}

function failNextTransfer(status: number, body: object) {
  server.use(
    http.post('*/api/transfers', () => HttpResponse.json(body, { status }), { once: true }),
  )
}

describe('sending a transfer', () => {
  it('E4 #2: a successful transfer shows the success screen and the dashboard updates', async () => {
    const requests = recordTransferRequests()
    const t = await goToReview({ amount: '120', note: 'Dinner' })

    await t.confirm()

    const sending = await t.inDialog.findByRole('button', { name: 'Sending…' })
    expect(sending).toHaveAttribute('aria-disabled', 'true')

    expect(await t.inDialog.findByRole('heading', { name: 'Transfer sent' })).toBeInTheDocument()
    expect(t.dialog).toHaveTextContent(money(120))
    expect(t.dialog).toHaveTextContent('to Jamie Tan · DBS · •••• 3391')
    expect(t.dialog).toHaveTextContent(/Reference\s*TRF-\w+/)
    expect(t.dialog).toHaveTextContent('The money should arrive within minutes.')
    // Announced to screen readers (T8)
    expect(t.dialog.querySelector('[aria-live="polite"]')).toHaveTextContent(
      /^Transfer sent\. SGD.*120\.00 to Jamie Tan\. Reference TRF-\w+\.$/,
    )

    expect(requests).toHaveLength(1)
    expect(await requests[0].json()).toEqual({
      fromAccountId: 'acc_checking',
      payeeId: 'pay_001',
      amount: 120,
      note: 'Dinner',
    })

    const done = t.inDialog.getByRole('button', { name: 'Back to dashboard' })
    expect(done).toHaveFocus()
    await t.user.click(done)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(t.trigger).toHaveFocus()
    // Refreshed before the success screen showed, so no waiting needed.
    expect(screen.getByText(money(17000.55))).toBeInTheDocument()
    const accounts = screen.getByRole('region', { name: 'Accounts' })
    expect(within(accounts).getByText(money(4160.55))).toBeInTheDocument()
    const transactions = screen.getByRole('region', { name: 'Recent transactions' })
    expect(within(transactions).getAllByRole('listitem')[0]).toHaveTextContent(
      `Transfer to Jamie Tan`,
    )
    expect(screen.getByRole('region', { name: 'Daily limit' })).toHaveTextContent(money(4880))
  })

  it('sends only one request when Confirm is double-clicked', async () => {
    const requests = recordTransferRequests()
    const t = await goToReview()

    await t.user.dblClick(t.inDialog.getByRole('button', { name: 'Confirm transfer' }))
    await t.inDialog.findByRole('heading', { name: 'Transfer sent' })

    expect(requests).toHaveLength(1)
  })

  it('T7: stays on review with the data intact when sending fails, and can retry', async () => {
    failNextTransfer(500, {
      error: { code: 'INTERNAL_ERROR', message: "Something went wrong. Your money hasn't left your account." },
    })
    const t = await goToReview({ amount: '120' })

    await t.confirm()

    expect(await t.inDialog.findByRole('alert')).toHaveTextContent(
      "Something went wrong. Your money hasn't left your account. Try again.",
    )
    expect(t.inDialog.getByRole('heading', { name: 'Check the details' })).toBeInTheDocument()
    expect(t.inDialog.queryByText('Transfer sent')).not.toBeInTheDocument()
    expect(t.dialog).toHaveTextContent(`Total ${money(120)}`)
    // Nothing moved
    expect(screen.getByText(money(17120.55))).toBeInTheDocument()

    await t.confirm()

    expect(await t.inDialog.findByRole('heading', { name: 'Transfer sent' })).toBeInTheDocument()
  })

  it('shows field errors from the API and puts them on the field', async () => {
    failNextTransfer(422, {
      error: {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Amount exceeds available balance.',
        fields: { amount: "Amount can't be more than your available balance (SGD 100.00)." },
        meta: { available: 100 },
      },
    })
    const t = await goToReview({ amount: '120' })

    await t.confirm()

    const alert = await t.inDialog.findByRole('alert')
    expect(alert).toHaveTextContent('Amount exceeds available balance.')
    expect(alert).toHaveTextContent("Amount can't be more than your available balance (SGD 100.00).")

    await t.user.click(t.inDialog.getByRole('button', { name: 'Back' }))

    const amount = t.inDialog.getByLabelText('Amount')
    expect(amount).toHaveAttribute('aria-invalid', 'true')
    expect(t.dialog).toHaveTextContent("Amount can't be more than your available balance (SGD 100.00).")
    expect(t.inDialog.queryByRole('alert')).not.toBeInTheDocument()
  })
})
