import { supabase } from '../supabase'
import { audit } from '../auditLog'
import { parseInsightStatus } from '../validators'
import type { Insight } from '../../types/index'
import type { DbInsight } from '../database.types'

function toApp(row: DbInsight): Insight {
  return {
    id: row.id,
    investigationId: row.investigation_id,
    text: row.text,
    status: parseInsightStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchAllInsights(): Promise<Insight[]> {
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת תובנות: ' + error.message)
  return (data as DbInsight[]).map(toApp)
}

export async function fetchDeletedInsights(): Promise<Insight[]> {
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת תובנות מאורכבות: ' + error.message)
  return (data as DbInsight[]).map(toApp)
}

export async function createInsight(
  data: Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Insight> {
  const { data: row, error } = await supabase
    .from('insights')
    .insert({
      investigation_id: data.investigationId,
      text: data.text,
      status: data.status,
    })
    .select()
    .single()
  if (error) throw new Error('שגיאה ביצירת תובנה: ' + error.message)
  const saved = toApp(row as DbInsight)
  void audit('insights', saved.id, 'create', { text: saved.text.slice(0, 60) })
  return saved
}

export async function updateInsight(
  id: string,
  updates: Partial<Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Insight> {
  const { data: row, error } = await supabase
    .from('insights')
    .update({
      ...(updates.investigationId !== undefined && { investigation_id: updates.investigationId }),
      ...(updates.text !== undefined && { text: updates.text }),
      ...(updates.status !== undefined && { status: updates.status }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error('שגיאה בעדכון תובנה: ' + error.message)
  void audit('insights', id, 'update', { status: updates.status })
  return toApp(row as DbInsight)
}

export async function deleteInsight(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('insights')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select('text')
    .single()
  if (error) throw new Error('שגיאה במחיקת תובנה: ' + error.message)
  void audit('insights', id, 'soft_delete', { text: data.text.slice(0, 200) })
}

export async function restoreInsight(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('insights')
    .update({ deleted_at: null })
    .eq('id', id)
    .select('text')
    .single()
  if (error) throw new Error('שגיאה בשחזור תובנה: ' + error.message)
  void audit('insights', id, 'restore', { text: data.text.slice(0, 200) })
}
