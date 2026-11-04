import type { CSSProperties } from 'react'
import './Skeleton.css'

interface SkeletonProps {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  radius?: CSSProperties['borderRadius']
  className?: string
}

/**
 * Decorative placeholder. Give it the same size as the content it stands in
 * for so the layout doesn't jump. The surrounding region should carry
 * `aria-busy` so assistive tech knows content is loading.
 */
export function Skeleton({
  width = '100%',
  height = '1em',
  radius,
  className = '',
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
    />
  )
}
