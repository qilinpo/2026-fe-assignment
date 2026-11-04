import type { Step } from './steps'

interface StepperProps {
  steps: readonly Step[]
  currentIndex: number
}

export function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <ol className="stepper" aria-label="Transfer steps">
      {steps.map((step, index) => {
        const state =
          index < currentIndex
            ? 'complete'
            : index === currentIndex
              ? 'current'
              : 'upcoming'

        return (
          <li
            key={step.id}
            className="stepper__item"
            data-state={state}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            {index > 0 && <ChevronIcon />}
            <span className="stepper__index" aria-hidden="true">
              {state === 'complete' ? <CheckIcon /> : index + 1}
            </span>
            <span className="stepper__label">
              {step.label}
              {state === 'complete' && (
                <span className="visually-hidden">, completed</span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function ChevronIcon() {
  return (
    <svg className="stepper__separator" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 10 17l9-10" />
    </svg>
  )
}
