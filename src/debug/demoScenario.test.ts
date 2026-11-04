import { describe, expect, it } from 'vitest'
import { setDemoScenario, withDemoParams } from './demoScenario'

describe('withDemoParams', () => {
  it('leaves requests alone normally', () => {
    expect(withDemoParams('/api/transactions?limit=8')).toBe('/api/transactions?limit=8')
  })

  it('adds the mock API hook for the chosen scenario', () => {
    setDemoScenario('error')
    expect(withDemoParams('/api/accounts')).toBe('/api/accounts?scenario=error')

    setDemoScenario('empty')
    expect(withDemoParams('/api/transactions?limit=8')).toBe('/api/transactions?limit=8&scenario=empty')

    setDemoScenario('slow')
    expect(withDemoParams('/api/customer')).toBe('/api/customer?delay=3000')
  })
})
