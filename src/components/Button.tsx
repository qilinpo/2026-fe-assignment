import type { ComponentPropsWithRef } from 'react'
import './Button.css'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: Variant
  block?: boolean
}

export function Button({
  variant = 'primary',
  block = false,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'button',
    `button--${variant}`,
    block ? 'button--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <button type={type} className={classes} {...rest} />
}
