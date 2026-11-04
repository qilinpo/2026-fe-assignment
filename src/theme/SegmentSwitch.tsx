import type { Segment } from '../api/types'
import { useSegment } from './preferences'
import './toggles.css'

const OPTIONS: { value: Segment; label: string }[] = [
  { value: 'retail', label: 'Retail' },
  { value: 'premium', label: 'Premium' },
]

export function SegmentSwitch({ className = '' }: { className?: string }) {
  const [segment, setSegment] = useSegment()

  return (
    <div
      role="group"
      aria-label="Customer segment"
      className={`segment-switch ${className}`.trim()}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="segment-switch__option"
          aria-pressed={segment === option.value}
          onClick={() => setSegment(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
