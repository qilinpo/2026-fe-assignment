import { formatMoney } from '../lib/format'

/**
 * `formatMoney` output as Testing Library sees it. Its matchers collapse the
 * non-breaking space Intl puts after `SGD` into a normal space in the DOM
 * text, but not in the expected string, so normalise that side too.
 */
export function money(amount: number): string {
  return formatMoney(amount).replace(/\s+/g, ' ')
}
