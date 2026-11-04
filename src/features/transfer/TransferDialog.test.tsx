import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { openTransfer } from '../../test/transferHelpers'

describe('transfer dialog', () => {
  it('opens on the recipient step with focus inside', async () => {
    const { inDialog } = await openTransfer()

    expect(
      await inDialog.findByRole('heading', { name: 'Who are you sending to?' }),
    ).toHaveFocus()
    const steps = inDialog.getByRole('list', { name: 'Transfer steps' })
    expect(steps.querySelector('[aria-current="step"]')).toHaveTextContent('Recipient')
  })

  it('moves between steps, and Back keeps what was entered', async () => {
    const t = await openTransfer()

    await t.choosePayee('Jamie Tan')
    await t.continue()
    expect(t.inDialog.getByRole('heading', { name: 'How much?' })).toHaveFocus()

    await t.user.type(t.inDialog.getByLabelText('Amount'), '120')
    await t.continue()
    expect(t.inDialog.getByRole('heading', { name: 'Check the details' })).toHaveFocus()
    expect(t.inDialog.getByRole('button', { name: 'Confirm transfer' })).toBeInTheDocument()

    await t.user.click(t.inDialog.getByRole('button', { name: 'Back' }))
    expect(t.inDialog.getByRole('heading', { name: 'How much?' })).toHaveFocus()
    expect(t.inDialog.getByLabelText('Amount')).toHaveValue('120')

    await t.user.click(t.inDialog.getByRole('button', { name: 'Back' }))
    expect(t.inDialog.getByRole('radio', { name: /Jamie Tan/ })).toBeChecked()
  })

  it('closes on Esc and returns focus to New transfer', async () => {
    const { user, trigger } = await openTransfer()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes on ✕ and returns focus to New transfer', async () => {
    const { user, trigger, inDialog } = await openTransfer()

    await user.click(inDialog.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('starts from scratch every time it opens', async () => {
    const t = await openTransfer()

    await t.choosePayee('Jamie Tan')
    await t.continue()
    await t.user.keyboard('{Escape}')
    await t.user.click(t.trigger)

    expect(
      screen.getByRole('heading', { name: 'Who are you sending to?' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('radio', { name: /Jamie Tan/ })).not.toBeChecked()
  })
})
