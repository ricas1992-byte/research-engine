/**
 * Best-effort audit trail. Logs mutations to a Supabase table so
 * soft-deletes and destructive edits leave a recoverable record.
 * Failures are swallowed — an audit write must never break the
 * user action that triggered it.
 */

import { supabase } from './supabase'
import { logger } from './logger'
import { featureFlags } from './featureFlags'

export type AuditAction =
  | 'create'
  | 'update'
  | 'soft_delete'
  | 'restore'
  | 'hard_delete'

export async function audit(
  entity: string,
  entityId: string,
  action: AuditAction,
  payload?: unknown,
): Promise<void> {
  if (!featureFlags.auditLog) return
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('audit_log').insert({
      entity,
      entity_id: entityId,
      action,
      payload: payload ?? null,
    })
  } catch (err) {
    logger.warn('audit', 'failed to record', entity, action, err)
  }
}
