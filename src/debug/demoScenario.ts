/**
 * Demo-only switch for the mock API's test hooks (?scenario=, ?delay=), so
 * reviewers can see the error, empty and slow-loading states on the deployed
 * site. Only reachable through the debug panel (`?debug` in the page URL);
 * normal app logic never sets it.
 */
export type DemoScenario = 'normal' | 'error' | 'empty' | 'slow'

let current: DemoScenario = 'normal'

export function getDemoScenario(): DemoScenario {
  return current
}

export function setDemoScenario(scenario: DemoScenario) {
  current = scenario
}

/** Adds the mock API's hook params for the current scenario to a GET path. */
export function withDemoParams(path: string): string {
  if (current === 'normal') return path
  const [pathname, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  if (current === 'slow') params.set('delay', '3000')
  else params.set('scenario', current)
  return `${pathname}?${params}`
}
