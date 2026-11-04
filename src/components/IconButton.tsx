import type { ComponentPropsWithRef } from 'react'
import './IconButton.css'

interface IconButtonProps extends ComponentPropsWithRef<'button'> {
  /** Icon-only buttons need an accessible name. */
  'aria-label': string
}

export function IconButton({
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={`icon-button ${className}`.trim()}
      {...rest}
    />
  )
}
