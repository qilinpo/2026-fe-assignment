import { expect, test } from '@playwright/test'

/**
 * Ava's main journey in a real browser: dashboard → New transfer → recipient
 * → amount → review → send → back to an updated dashboard.
 *
 * Unit tests cover the rules in detail; this checks the pieces work together
 * in the production build, with the browser's own <dialog>, focus handling
 * and the MSW service worker.
 */
test('sends a transfer and the dashboard shows the new balance', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  await page.goto('/')

  // Dashboard
  const total = page.getByRole('region', { name: 'Total available' })
  await expect(total).toContainText('17,120.55')
  await expect(page.getByText('Across 2 deposit accounts')).toBeVisible()

  // Open the dialog
  const newTransfer = page.getByRole('button', { name: 'New transfer' })
  await newTransfer.click()
  const dialog = page.getByRole('dialog', { name: 'New transfer' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Who are you sending to?' })).toBeFocused()

  // Step 1: recipient
  await dialog.getByRole('radio', { name: /Jamie Tan/ }).check()
  await dialog.getByRole('button', { name: 'Continue' }).click()

  // Step 2: amount — an invalid amount first, then a valid one
  await expect(dialog.getByRole('heading', { name: 'How much?' })).toBeVisible()
  const amount = dialog.getByLabel('Amount', { exact: true })
  await amount.fill('5000')
  await dialog.getByRole('button', { name: 'Continue' }).click()
  await expect(amount).toBeFocused()
  await expect(dialog).toContainText("Amount can't be more than your available balance")

  await amount.fill('120')
  await dialog.getByLabel('Note (optional)').fill('Dinner')
  await dialog.getByRole('button', { name: 'Continue' }).click()

  // Step 3: review
  await expect(dialog.getByRole('heading', { name: 'Check the details' })).toBeVisible()
  await expect(dialog).toContainText('Jamie Tan · DBS · •••• 3391')
  await expect(dialog).toContainText('Dinner')

  // Send
  await dialog.getByRole('button', { name: 'Confirm transfer' }).click()
  await expect(dialog.getByRole('heading', { name: 'Transfer sent' })).toBeVisible()
  await expect(dialog).toContainText(/TRF-\w+/)
  await expect(dialog).toContainText('The money should arrive within minutes.')

  // Back to an updated dashboard, with focus where the user started
  await dialog.getByRole('button', { name: 'Back to dashboard' }).click()
  await expect(dialog).toBeHidden()
  await expect(newTransfer).toBeFocused()
  await expect(total).toContainText('17,000.55')
  await expect(
    page.getByRole('region', { name: 'Recent transactions' }).getByRole('listitem').first(),
  ).toContainText('Transfer to Jamie Tan')
  await expect(page.getByRole('region', { name: 'Daily limit' })).toContainText('4,880.00')

  // E5: no console errors on the happy path
  expect(consoleErrors).toEqual([])
})
