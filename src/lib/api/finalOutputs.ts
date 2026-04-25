import { supabase } from '../supabase'
import { audit } from '../auditLog'
import type { FinalOutput } from '../../types/index'
import type { DbFinalOutput } from '../database.types'

function toApp(row: DbFinalOutput): FinalOutput {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    format: row.format,
    linkedInsights: row.linked_insights ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchAllFinalOutputs(): Promise<FinalOutput[]> {
  const { data, error } = await supabase
    .from('final_outputs')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת תוצרים: ' + error.message)
  return (data as DbFinalOutput[]).map(toApp)
}

export async function fetchDeletedFinalOutputs(): Promise<FinalOutput[]> {
  const { data, error } = await supabase
    .from('final_outputs')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת תוצרים מאורכבים: ' + error.message)
  return (data as DbFinalOutput[]).map(toApp)
}

export async function createFinalOutput(
  data: Omit<FinalOutput, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FinalOutput> {
  const { data: row, error } = await supabase
    .from('final_outputs')
    .insert({
      title: data.title,
      content: data.content,
      format: data.format,
      linked_insights: data.linkedInsights,
    })
    .select()
    .single()
  if (error) throw new Error('שגיאה ביצירת תוצר: ' + error.message)
  const saved = toApp(row as DbFinalOutput)
  void audit('final_outputs', saved.id, 'create', { title: saved.title })
  return saved
}

export async function updateFinalOutput(
  id: string,
  updates: Partial<Omit<FinalOutput, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<FinalOutput> {
  const { data: row, error } = await supabase
    .from('final_outputs')
    .update({
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.content !== undefined && { content: updates.content }),
      ...(updates.format !== undefined && { format: updates.format }),
      ...(updates.linkedInsights !== undefined && { linked_insights: updates.linkedInsights }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error('שגיאה בעדכון תוצר: ' + error.message)
  void audit('final_outputs', id, 'update', { title: updates.title })
  return toApp(row as DbFinalOutput)
}

export async function deleteFinalOutput(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('final_outputs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select('title')
    .single()
  if (error) throw new Error('שגיאה במחיקת תוצר: ' + error.message)
  void audit('final_outputs', id, 'soft_delete', { title: data.title })
}

export async function restoreFinalOutput(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('final_outputs')
    .update({ deleted_at: null })
    .eq('id', id)
    .select('title')
    .single()
  if (error) throw new Error('שגיאה בשחזור תוצר: ' + error.message)
  void audit('final_outputs', id, 'restore', { title: data.title })
}
