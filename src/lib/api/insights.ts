import { supabase } from '../supabase'
import type { Insight } from '../../types/index'
import type { DbInsight } from '../database.types'

function toApp(row: DbInsight): Insight {
  return {
    id: row.id,
    investigationId: row.investigation_id,
    text: row.text,
    status: row.status as Insight['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchAllInsights(): Promise<Insight[]> {
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת תובנות: ' + error.message)
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
  return toApp(row as DbInsight)
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
  return toApp(row as DbInsight)
}

export async function deleteInsight(id: string): Promise<void> {
  const { error } = await supabase.from('insights').delete().eq('id', id)
  if (error) throw new Error('שגיאה במחיקת תובנה: ' + error.message)
}
