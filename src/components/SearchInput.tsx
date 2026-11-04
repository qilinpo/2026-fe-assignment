import { useId, type Ref } from 'react'
import './SearchInput.css'

interface SearchInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  ref?: Ref<HTMLInputElement>
}

export function SearchInput({
  label,
  value,
  onChange,
  onClear,
  placeholder,
  ref,
}: SearchInputProps) {
  const id = useId()

  return (
    <div className="search-input">
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <svg className="search-input__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={ref}
        id={id}
        type="search"
        className="search-input__field"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault()
            onClear()
          }
        }}
      />
      {value && (
        <button
          type="button"
          className="search-input__clear"
          aria-label="Clear search text"
          onClick={onClear}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
