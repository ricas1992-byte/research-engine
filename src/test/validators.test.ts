import { describe, it, expect } from 'vitest'
import { parseInvestigationStatus, parseInsightStatus } from '../lib/validators'

describe('parseInvestigationStatus', () => {
  it('accepts known Hebrew statuses', () => {
    expect(parseInvestigationStatus('גולמי')).toBe('גולמי')
    expect(parseInvestigationStatus('בעבודה')).toBe('בעבודה')
    expect(parseInvestigationStatus('הושלמה')).toBe('הושלמה')
  })

  it('falls back to "גולמי" for unknown input rather than leaking garbage to UI', () => {
    expect(parseInvestigationStatus('')).toBe('גולמי')
    expect(parseInvestigationStatus('unknown-value')).toBe('גולמי')
  })
})

describe('parseInsightStatus', () => {
  it('accepts known Hebrew statuses', () => {
    expect(parseInsightStatus('גולמי')).toBe('גולמי')
    expect(parseInsightStatus('מעובד')).toBe('מעובד')
    expect(parseInsightStatus('מוכן')).toBe('מוכן')
  })

  it('falls back to "גולמי" for unknown input', () => {
    expect(parseInsightStatus('bogus')).toBe('גולמי')
  })
})
