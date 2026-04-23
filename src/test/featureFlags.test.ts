import { describe, it, expect } from 'vitest'
import { featureFlags } from '../lib/featureFlags'

describe('featureFlags', () => {
  it('has boolean values for all declared flags', () => {
    for (const [key, value] of Object.entries(featureFlags)) {
      expect(typeof value, `flag ${key} should be boolean`).toBe('boolean')
    }
  })
})
