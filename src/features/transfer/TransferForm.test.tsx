import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { money } from '../../test/money'
import { server } from '../../test/setup'
import { openTransfer, recordTransferRequests } from '../../test/transferHelpers'

/**
 * The control's accessible description — what a screen reader announces with
 * it, computed from aria-describedby — contains `text` (T8).
 */
function expectDescribedBy(control: HTMLElement, text: string) {
  expect(control).toHaveAccessibleDescription({
    // Collapse Intl's non-breaking spaces, like Testing Library's text
    // matchers do (see test/money.ts).
    asymmetricMatch: (actual: string) => actual.replace(/\s+/g, ' ').includes(text),
    toString: () => `description containing "${text}"`,
  })
}

describe('transfer form — recipient', () => {
  it('needs a recipient before continuing, and focuses the list', async () => {
    const t = await openTransfer()
    await t.inDialog.findByRole('radio', { name: /Jamie Tan/ })

    await t.continue()

    const firstPayee = t.inDialog.getByRole('radio', { name: /Jamie Tan/ })
    await waitFor(() => expect(firstPayee).toHaveFocus())
    expectDescribedBy(firstPayee, 'Choose who you\'re sending to.')
    expect(t.inDialog.getByRole('heading', { name: 'Who are you sending to?' })).toBeInTheDocument()
  })

  it('lists all payees and filters them by search', async () => {
    const t = await openTransfer()
    await t.inDialog.findByRole('radio', { name: /Jamie Tan/ })
    // 4 payees + "Send to someone new"
    expect(t.inDialog.getAllByRole('radio')).toHaveLength(5)

    await t.user.type(t.inDialog.getByRole('searchbox', { name: 'Search payees' }), 'uob')

    expect(t.inDialog.getAllByRole('radio')).toHaveLength(2)
    expect(t.inDialog.getByRole('radio', { name: /Priya Nair/ })).toBeInTheDocument()
    expect(t.inDialog.getByRole('radio', { name: 'Send to someone new' })).toBeInTheDocument()
  })

  it('offers Retry when payees fail to load, and still allows someone new', async () => {
    server.use(
      http.get(
        '*/api/payees',
        () => HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Down' } }, { status: 500 }),
        { once: true },
      ),
    )
    const t = await openTransfer()

    expect(await t.inDialog.findByText("We couldn't load your saved payees.")).toBeInTheDocument()
    expect(t.inDialog.getByRole('radio', { name: 'Send to someone new' })).toBeInTheDocument()

    await t.user.click(t.inDialog.getByRole('button', { name: 'Retry' }))

    expect(await t.inDialog.findByRole('radio', { name: /Jamie Tan/ })).toBeInTheDocument()
  })

  it('validates new-recipient details and focuses the first invalid field', async () => {
    const t = await openTransfer()
    await t.choosePayee('Send to someone new')

    await t.user.type(t.inDialog.getByLabelText('Recipient name'), 'Alex Lim')
    await t.user.type(t.inDialog.getByLabelText('Account number'), '1234')
    await t.continue()

    const accountNumber = t.inDialog.getByLabelText('Account number')
    await waitFor(() => expect(accountNumber).toHaveFocus())
    expect(accountNumber).toHaveAttribute('aria-invalid', 'true')
    expectDescribedBy(accountNumber, 'Enter a valid 8-digit account number.')
    expectDescribedBy(t.inDialog.getByLabelText('Bank'), 'Choose a bank.')

    await t.user.clear(accountNumber)
    await t.user.type(accountNumber, '12345678')
    await t.user.selectOptions(t.inDialog.getByLabelText('Bank'), 'OCBC')
    await t.continue()

    expect(t.inDialog.getByRole('heading', { name: 'How much?' })).toBeInTheDocument()
  })
})

describe('transfer form — amount', () => {
  async function toAmountStep() {
    const t = await openTransfer()
    await t.choosePayee('Jamie Tan')
    await t.continue()
    return { ...t, amount: t.inDialog.getByLabelText('Amount') }
  }

  it('shows the available balance and remaining daily limit', async () => {
    const t = await toAmountStep()

    expectDescribedBy(t.amount, `Available ${money(4280.55)}`)
    expectDescribedBy(t.amount, `Remaining daily limit ${money(5000)}`)
  })

  it('checks the amount when the user leaves the field', async () => {
    const t = await toAmountStep()

    await t.user.type(t.amount, '12.345')
    await t.user.tab()

    expectDescribedBy(t.amount, 'Use at most 2 decimal places.')
  })

  it('E4 #1: an amount over the balance shows the error and sends no request', async () => {
    const requests = recordTransferRequests()
    const t = await toAmountStep()

    await t.user.type(t.amount, '4280.56')
    await t.continue()

    await waitFor(() => expect(t.amount).toHaveFocus())
    expectDescribedBy(
      t.amount,
      `Amount can't be more than your available balance (${money(4280.55)}).`,
    )
    expect(t.inDialog.getByRole('heading', { name: 'How much?' })).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('re-checks the amount against the newly chosen account', async () => {
    const t = await toAmountStep()

    await t.user.type(t.amount, '6000')
    await t.user.tab()
    expectDescribedBy(t.amount, `Amount can't be more than your available balance (${money(4280.55)}).`)

    await t.user.selectOptions(t.inDialog.getByLabelText('From account'), 'acc_savings')

    expectDescribedBy(
      t.amount,
      `This transfer exceeds your remaining daily limit (${money(5000)}).`,
    )
  })

  it('offers only deposit accounts', async () => {
    const t = await toAmountStep()

    const options = Array.from(
      (t.inDialog.getByLabelText('From account') as HTMLSelectElement).options,
    ).map((o) => o.textContent)
    expect(options).toEqual(['Everyday Checking · •••• 4821', 'Savings Plus · •••• 9930'])
  })

  it('fills the amount from a quick-amount button', async () => {
    const t = await toAmountStep()

    await t.user.click(t.inDialog.getByRole('button', { name: 'SGD 250' }))

    expect(t.amount).toHaveValue('250')
  })

  it('counts note characters and rejects more than 50', async () => {
    const t = await toAmountStep()
    const note = t.inDialog.getByLabelText('Note (optional)')

    await t.user.type(note, 'Dinner')
    expectDescribedBy(note, '6/50')

    await t.user.clear(note)
    await t.user.type(note, 'x'.repeat(51))
    await t.user.tab()
    expectDescribedBy(note, 'Keep the note to 50 characters or fewer.')
  })
})

describe('transfer form — review', () => {
  it('shows from, recipient, amount, fee, total and note', async () => {
    const t = await openTransfer()
    await t.choosePayee('Jamie Tan')
    await t.continue()
    await t.user.type(t.inDialog.getByLabelText('Amount'), '120')
    await t.user.type(t.inDialog.getByLabelText('Note (optional)'), 'Dinner')
    await t.continue()

    const review = t.inDialog.getByRole('heading', { name: 'Check the details' }).parentElement!
    expect(review).toHaveTextContent('From Everyday Checking · •••• 4821')
    expect(review).toHaveTextContent('To Jamie Tan · DBS · •••• 3391')
    expect(review).toHaveTextContent(`Amount ${money(120)}`)
    expect(review).toHaveTextContent(`Fee ${money(0)}`)
    expect(review).toHaveTextContent('Note Dinner')
    expect(review).toHaveTextContent(`Total ${money(120)}`)
  })
})
