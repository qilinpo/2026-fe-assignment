import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './test/renderApp'
import { SEGMENT_KEY, THEME_KEY } from './theme/preferences'

describe('theme and segment', () => {
  it('toggles dark mode on <html> and remembers it', async () => {
    const { user } = renderApp()

    const toggle = screen.getByRole('button', { name: 'Dark mode' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('switches to Premium on <html> and remembers it', async () => {
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Premium' }))

    expect(screen.getByRole('button', { name: 'Premium' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(document.documentElement).toHaveAttribute('data-segment', 'premium')
    expect(localStorage.getItem(SEGMENT_KEY)).toBe('premium')
  })

  it('shows the customer avatar once loaded', async () => {
    renderApp()
    expect(await screen.findByRole('img', { name: 'Ava Chen' })).toHaveTextContent('AC')
  })
})
