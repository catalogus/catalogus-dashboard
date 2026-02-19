import { supabase, type Json } from '@/lib/supabase'

type AuditPayload = {
  action: string
  entityType: string
  entityId?: string | null
  outcome?: 'success' | 'error'
  summary?: string | null
  changedFields?: Json
  meta?: Json
}

export async function logAuditEvent(payload: AuditPayload) {
  const { error } = await supabase.rpc('log_audit_event', {
    p_action: payload.action,
    p_entity_type: payload.entityType,
    p_entity_id: payload.entityId ?? null,
    p_outcome: payload.outcome ?? 'success',
    p_summary: payload.summary ?? null,
    p_changed_fields: payload.changedFields ?? [],
    p_meta: payload.meta ?? {},
  })

  if (error) {
    console.error('Failed to write audit event:', error)
  }
}
