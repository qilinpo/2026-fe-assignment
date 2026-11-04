import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getDemoScenario, setDemoScenario, type DemoScenario } from './demoScenario'
import './DebugPanel.css'

const OPTIONS: { value: DemoScenario; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'error', label: 'Errors (500)' },
  { value: 'empty', label: 'Empty lists' },
  { value: 'slow', label: 'Slow (3 s)' },
]

/**
 * Shown only with `?debug` in the page URL. Switches the mock API's test
 * hooks for every GET, then resets the cache so the dashboard reloads.
 * Pick "Errors", see the error state, pick "Normal", then press Retry.
 */
export function DebugPanel() {
  const queryClient = useQueryClient()
  const [scenario, setScenario] = useState(getDemoScenario)

  function choose(next: DemoScenario) {
    setDemoScenario(next)
    setScenario(next)
    // "Errors" and "Empty" show straight away; switching back to "Normal"
    // leaves the error up so Retry can be tried.
    if (next !== 'normal') void queryClient.resetQueries()
  }

  return (
    <details className="debug-panel">
      <summary>Debug</summary>
      <fieldset>
        <legend>Mock API responses</legend>
        {OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="demo-scenario"
              value={option.value}
              checked={scenario === option.value}
              onChange={() => choose(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <p>
        To fail a transfer, put <code>#fail</code> in its note.
      </p>
    </details>
  )
}
