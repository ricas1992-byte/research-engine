import { supabase } from '../supabase'
import type { Investigation } from '../../types/index'
import type { DbInvestigation } from '../database.types'

function toApp(row: DbInvestigation): Investigation {
  return {
    id: row.id,
    subQuestionId: row.sub_question_id,
    title: row.title,
    content: row.content,
    findings: row.findings ?? undefined,
    status: row.status as Investigation['status'],
    rawMaterials: row.raw_materials ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchAllInvestigations(): Promise<Investigation[]> {
  const { data, error } = await supabase
    .from('investigations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error('שגיאה בטעינת חקירות: ' + error.message)
  return (data as DbInvestigation[]).map(toApp)
}

export async function createInvestigation(
  data: Omit<Investigation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Investigation> {
  const { data: row, error } = await supabase
    .from('investigations')
    .insert({
      sub_question_id: data.subQuestionId,
      title: data.title,
      content: data.content,
      findings: data.findings ?? null,
      status: data.status,
      raw_materials: (data.rawMaterials ?? []) as unknown as DbInvestigation['raw_materials'],
    })
    .select()
    .single()
  if (error) throw new Error('שגיאה ביצירת חקירה: ' + error.message)
  return toApp(row as DbInvestigation)
}

export async function updateInvestigation(
  id: string,
  updates: Partial<Omit<Investigation, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Investigation> {
  const { data: row, error } = await supabase
    .from('investigations')
    .update({
      ...(updates.subQuestionId !== undefined && { sub_question_id: updates.subQuestionId }),
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.content !== undefined && { content: updates.content }),
      ...(updates.findings !== undefined && { findings: updates.findings ?? null }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.rawMaterials !== undefined && { raw_materials: updates.rawMaterials as unknown as DbInvestigation['raw_materials'] }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error('שגיאה בעדכון חקירה: ' + error.message)
  return toApp(row as DbInvestigation)
}

export async function deleteInvestigation(id: string): Promise<void> {
  const { error } = await supabase.from('investigations').delete().eq('id', id)
  if (error) throw new Error('שגיאה במחיקת חקירה: ' + error.message)
}
