/**
 * Runtime validators used when converting DB rows → app types.
 * Replaces unsafe `as Status` casts.
 */

import type { InvestigationStatus, InsightStatus } from '../types/index'

const INVESTIGATION_STATUSES: readonly InvestigationStatus[] = ['גולמי', 'בעבודה', 'הושלמה']
const INSIGHT_STATUSES: readonly InsightStatus[] = ['גולמי', 'מעובד', 'מוכן']

export function parseInvestigationStatus(raw: string): InvestigationStatus {
  return (INVESTIGATION_STATUSES as readonly string[]).includes(raw)
    ? (raw as InvestigationStatus)
    : 'גולמי'
}

export function parseInsightStatus(raw: string): InsightStatus {
  return (INSIGHT_STATUSES as readonly string[]).includes(raw)
    ? (raw as InsightStatus)
    : 'גולמי'
}
