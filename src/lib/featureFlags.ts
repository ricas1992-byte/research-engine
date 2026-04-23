/**
 * Build-time feature flags sourced from VITE_FF_* env vars.
 * Treat only string "true" as enabled; anything else is off.
 */

function read(key: string, fallback = false): boolean {
  const raw = (import.meta.env as Record<string, string | undefined>)[key]
  if (raw === undefined) return fallback
  return raw === 'true'
}

export const featureFlags = {
  researchMap: read('VITE_FF_RESEARCH_MAP', true),
  sourcesView: read('VITE_FF_SOURCES_VIEW', true),
  recycleBin:  read('VITE_FF_RECYCLE_BIN',  true),
  auditLog:    read('VITE_FF_AUDIT_LOG',    false),
} as const

export type FeatureFlag = keyof typeof featureFlags
