import type { CSSProperties } from 'react'
import './Skeleton.css'

interface SkeletonProps {
  width?: CSSProperties['width']
  className?: string
}

/**
 * Decorative placeholder for one line of text. Put it where the text will go
 * (inside the same element) and it takes exactly that line's height, because
 * it *is* a line of text: an inline-block holding a non-breaking space, which
 * inherits the font size, line height and baseline. The visible bar is drawn
 * by a pseudo-element, so nothing moves when the real text replaces it.
 *
 * The surrounding region should carry `aria-busy` while loading.
 */
export function Skeleton({ width = '100%', className = '' }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton ${className}`.trim()}
      style={{ width }}
    >
      {'\u00A0'}
    </span>
  )
}
