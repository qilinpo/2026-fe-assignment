import { screen, within } from '@testing-library/react'
import { renderApp } from './renderApp'
import { server } from './setup'

/** Renders the app and opens the transfer dialog once the dashboard is in. */
export async function openTransfer() {
  const utils = renderApp()
  await screen.findByText('FairPrice Finest')
  const trigger = screen.getByRole('button', { name: 'New transfer' })
  await utils.user.click(trigger)
  const dialog = await screen.findByRole('dialog', { name: 'New transfer' })
  const inDialog = within(dialog)

  return {
    ...utils,
    trigger,
    dialog,
    inDialog,
    continue: () => utils.user.click(inDialog.getByRole('button', { name: 'Continue' })),
    choosePayee: async (name: string) =>
      utils.user.click(await inDialog.findByRole('radio', { name: new RegExp(name) })),
  }
}

/** Records every POST /api/transfers the app sends. */
export function recordTransferRequests() {
  const requests: Request[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'POST' && new URL(request.url).pathname.endsWith('/api/transfers')) {
      requests.push(request.clone())
    }
  })
  return requests
}
