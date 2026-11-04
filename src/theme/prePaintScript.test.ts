import { afterEach, describe, expect, it, vi } from 'vitest'
import indexHtml from '../../index.html?raw'
import { SEGMENT_KEY, THEME_KEY } from './preferences'

// The real inline script from index.html (the classic one, not the module).
const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1] ?? ''

function runScript({ systemDark }: { systemDark: boolean }) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' && systemDark,
  }))
  new Function(script)()
  const root = document.documentElement
  return { theme: root.dataset.theme, segment: root.dataset.segment }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('TH1: theme applied before first paint', () => {
  it('is present in index.html', () => {
    expect(script).toContain(THEME_KEY)
    expect(script).toContain(SEGMENT_KEY)
  })

  it('follows the system setting on first visit', () => {
    expect(runScript({ systemDark: true }).theme).toBe('dark')
    expect(runScript({ systemDark: false }).theme).toBe('light')
  })

  it('prefers the remembered choice over the system setting', () => {
    localStorage.setItem(THEME_KEY, 'light')
    localStorage.setItem(SEGMENT_KEY, 'premium')

    expect(runScript({ systemDark: true })).toEqual({ theme: 'light', segment: 'premium' })
  })

  it('ignores values it does not recognise', () => {
    localStorage.setItem(THEME_KEY, 'purple')
    localStorage.setItem(SEGMENT_KEY, 'vip')

    expect(runScript({ systemDark: true })).toEqual({ theme: 'dark', segment: undefined })
  })
})
