import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { SEGMENT_KEY, THEME_KEY } from './theme/preferences'

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )
}

describe('theme and segment', () => {
  it('toggles dark mode on <html> and remembers it', async () => {
    const user = userEvent.setup()
    renderApp()

    const toggle = screen.getByRole('button', { name: 'Dark mode' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('switches to Premium on <html> and remembers it', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Premium' }))

    expect(screen.getByRole('button', { name: 'Premium' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(document.documentElement).toHaveAttribute('data-segment', 'premium')
    expect(localStorage.getItem(SEGMENT_KEY)).toBe('premium')
  })

  it('shows the customer initials once loaded', async () => {
    renderApp()
    expect(await screen.findByText('AC')).toBeInTheDocument()
  })
})
