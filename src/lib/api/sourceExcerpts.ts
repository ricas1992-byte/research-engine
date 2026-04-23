import { supabase } from '../supabase'
import { audit } from '../auditLog'
import type { SourceExcerpt } from '../../types/index'
import type { DbSourceExcerpt } from '../database.types'

function toApp(row: DbSourceExcerpt): SourceExcerpt {
  return {
    id: row.id,
    quotedText: row.quoted_text,
    materialId: row.material_id,
    materialTitle: row.material_title,
    investigationId: row.investigation_id,
    investigationTitle: row.investigation_title,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchAllSourceExcerpts(): Promise<SourceExcerpt[]> {
  const { data, error } = await supabase
    .from('source_excerpts')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת ציטוטים: ' + error.message)
  return (data as DbSourceExcerpt[]).map(toApp)
}

export async function fetchDeletedSourceExcerpts(): Promise<SourceExcerpt[]> {
  const { data, error } = await supabase
    .from('source_excerpts')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת ציטוטים מאורכבים: ' + error.message)
  return (data as DbSourceExcerpt[]).map(toApp)
}

export async function createSourceExcerpt(
  data: Omit<SourceExcerpt, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SourceExcerpt> {
  const { data: row, error } = await supabase
    .from('source_excerpts')
    .insert({
      quoted_text: data.quotedText,
      material_id: data.materialId,
      material_title: data.materialTitle,
      investigation_id: data.investigationId,
      investigation_title: data.investigationTitle,
      notes: data.notes ?? null,
    })
    .select()
    .single()
  if (error) throw new Error('שגיאה ביצירת ציטוט: ' + error.message)
  const saved = toApp(row as DbSourceExcerpt)
  void audit('source_excerpts', saved.id, 'create', { materialId: saved.materialId })
  return saved
}

export async function updateSourceExcerpt(
  id: string,
  updates: Partial<Omit<SourceExcerpt, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<SourceExcerpt> {
  const { data: row, error } = await supabase
    .from('source_excerpts')
    .update({
      ...(updates.quotedText !== undefined && { quoted_text: updates.quotedText }),
      ...(updates.materialId !== undefined && { material_id: updates.materialId }),
      ...(updates.materialTitle !== undefined && { material_title: updates.materialTitle }),
      ...(updates.investigationId !== undefined && { investigation_id: updates.investigationId }),
      ...(updates.investigationTitle !== undefined && { investigation_title: updates.investigationTitle }),
      ...(updates.notes !== undefined && { notes: updates.notes ?? null }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error('שגיאה בעדכון ציטוט: ' + error.message)
  void audit('source_excerpts', id, 'update', updates)
  return toApp(row as DbSourceExcerpt)
}

export async function deleteSourceExcerpt(id: string): Promise<void> {
  const { error } = await supabase
    .from('source_excerpts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error('שגיאה במחיקת ציטוט: ' + error.message)
  void audit('source_excerpts', id, 'soft_delete')
}

export async function restoreSourceExcerpt(id: string): Promise<void> {
  const { error } = await supabase
    .from('source_excerpts')
    .update({ deleted_at: null })
    .eq('id', id)
  if (error) throw new Error('שגיאה בשחזור ציטוט: ' + error.message)
  void audit('source_excerpts', id, 'restore')
}
