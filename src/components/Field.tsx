import { useId, type ReactNode } from 'react'
import './forms.css'

export interface FieldControlProps {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
}

interface FieldProps {
  label: string
  error?: string
  /** Help text under the control, e.g. available balance. */
  hint?: ReactNode
  /** Extra info beside the label, e.g. a character counter. */
  aside?: ReactNode
  /** Render the control, spreading the props that wire up label/hint/error. */
  children: (control: FieldControlProps) => ReactNode
}

/**
 * Label + control + hint + error, all linked: the label via htmlFor, and the
 * hint, aside and error via aria-describedby (T8).
 */
export function Field({ label, error, hint, aside, children }: FieldProps) {
  const id = useId()
  const asideId = `${id}-aside`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const describedBy =
    [aside && asideId, hint && hintId, error && errorId]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div className="field">
      <div className="field__label-row">
        <label htmlFor={id} className="field__label">
          {label}
        </label>
        {aside && (
          <span id={asideId} className="field__aside">
            {aside}
          </span>
        )}
      </div>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {/* Error first, so it sits right under the control it's about. */}
      {error && <FieldError id={errorId}>{error}</FieldError>}
      {hint && (
        <div id={hintId} className="field__hint">
          {hint}
        </div>
      )}
    </div>
  )
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="field__error">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.5v.01" />
      </svg>
      <span>{children}</span>
    </p>
  )
}
