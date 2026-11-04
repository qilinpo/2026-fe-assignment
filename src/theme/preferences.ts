import { useSyncExternalStore } from 'react'
import type { Segment } from '../api/types'

/**
 * Theme and segment live on <html data-theme data-segment>. The inline script
 * in index.html sets them before first paint (no flash); this module keeps
 * React in sync and persists changes.
 *
 * The DOM attribute is the source of truth, exposed through a tiny external
 * store so any number of components (e.g. a header switch on desktop and one
 * under the greeting on mobile) share the same value.
 *
 * Keep the storage keys in sync with the script in index.html.
 */
export type Theme = 'light' | 'dark'

export const THEME_KEY = 'meridian:theme'
export const SEGMENT_KEY = 'meridian:segment'

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify() {
  listeners.forEach((listener) => listener())
}

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private mode / storage disabled: the choice still applies this session.
  }
}

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function getSegment(): Segment {
  return document.documentElement.dataset.segment === 'premium'
    ? 'premium'
    : 'retail'
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  persist(THEME_KEY, theme)
  notify()
}

export function setSegment(segment: Segment) {
  document.documentElement.dataset.segment = segment
  persist(SEGMENT_KEY, segment)
  notify()
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light')
  return [theme, setTheme] as const
}

export function useSegment() {
  const segment = useSyncExternalStore(subscribe, getSegment, () => 'retail')
  return [segment, setSegment] as const
}
