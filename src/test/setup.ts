import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { handlers, resetMockDb } from '../mocks/handlers'
import './dialogPolyfill'

// Every mock response takes ~500 ms; give async queries some headroom.
configure({ asyncUtilTimeout: 3000 })

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => resetMockDb())
afterEach(() => {
  // RTL only auto-cleans when Vitest globals are on; they aren't here.
  cleanup()
  server.resetHandlers()
  // Theme/segment preferences live on <html> and in localStorage.
  localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.segment
})
afterAll(() => server.close())
